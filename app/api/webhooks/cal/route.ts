import crypto from "node:crypto";

/* Cal.com webhook -> Meta Conversions API.

   Cal.com POSTs here when a booking is created. We verify the signature, pull
   the attendee's details out of the payload, hash them, and send a server-side
   Lead event to Meta.

   Why this exists: the browser pixel alone loses a large share of conversions to
   ad blockers and iOS. The webhook fires from Cal's servers, so it lands
   regardless. Both copies carry the same event_id (cal_lead_<uid>), so Meta
   deduplicates them into one conversion rather than double counting.

   Cal.com setup: Webhooks -> New, URL https://<domain>/api/webhooks/cal,
   trigger BOOKING_CREATED, secret = CAL_WEBHOOK_SECRET.

   Env required:
     META_PIXEL_ID              same id as NEXT_PUBLIC_META_PIXEL_ID
     META_CAPI_ACCESS_TOKEN     Events Manager -> Settings -> Generate access token
     CAL_WEBHOOK_SECRET         the secret set on the Cal.com webhook
     META_CAPI_TEST_EVENT_CODE  optional, only while testing in Events Manager */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH_VERSION = "v21.0";

/* Kept in sync with OFFER in app/lib/fbq.ts */
const OFFER = {
  content_name: "Instant Image Upgrade consultation",
  content_category: "booking",
};

/* Application-form answers. Cal keys payload.responses by the question text,
   slugified, so these strings must match the questions in Cal EXACTLY. If a
   question is reworded in Cal, its key changes and the answer silently stops
   coming through. That is the one maintenance trap here.

   Free-text questions ("Why are you applying", "biggest image challenge") are
   deliberately NOT sent. Applicants write personal things in those boxes, and
   Meta's terms forbid sending sensitive personal data. Only fixed-choice
   answers go out. */
const Q = {
  budget:
    "How-much-are-you-prepared-to-invest-in-improving-your-image-if-Sanobar-believes-you-re-the-right-fit",
  profession: "What-best-describes-your-profession",
  priorStylist:
    "Have-you-worked-with-a-personal-stylist-or-image-consultant-before",
};

/* Cal returns an answer as a bare string, a number, an array (multi-select), or
   a { label, value } object depending on the field type. Flatten all of them. */
function answer(responses: any, key: string): string | undefined {
  const raw = responses?.[key];
  if (raw == null) return undefined;
  const v = typeof raw === "object" && !Array.isArray(raw) ? raw.value ?? raw.label : raw;
  if (Array.isArray(v)) return v.filter(Boolean).join(", ") || undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  return undefined;
}

/* Budget band -> the number Meta gets as `value`, in INR.

   The bands are "at least X", so the label already IS the lower bound and the
   mapping is exact, not an estimate.

   Keys are NORMALISED (lowercased, everything non-alphanumeric stripped) rather
   than matched byte for byte, so "atleast 50000", "At least ₹50,000" and
   "at-least 50,000" all resolve to the same band. Cal labels get reworded and
   re-spaced over time; an exact-string map would silently stop matching and we
   would never notice. */
const BUDGET_VALUE: Record<string, number> = {
  atleast50000: 50_000,
  atleast100000: 100_000,
  atleast200000: 200_000,
  atleast500000: 500_000,
};

function budgetKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function budgetToValue(raw?: string): number | undefined {
  if (!raw) return undefined;

  const mapped = BUDGET_VALUE[budgetKey(raw)];
  if (typeof mapped === "number") return mapped;

  /* Fallback for a band added in Cal but not here: read the first number out of
     the label, tolerating comma grouping. Keeps a new option reporting a sane
     value instead of nothing until the map catches up. */
  const match = raw.replace(/[,\s]/g, "").match(/\d+/);
  if (!match) return undefined;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Meta requires every PII field lowercased, trimmed, then SHA-256 hex. */
function hash(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalised = value.trim().toLowerCase();
  if (!normalised) return undefined;
  return crypto.createHash("sha256").update(normalised).digest("hex");
}

/** Phone numbers hash digits-only, country code included, no + or spaces. */
function hashPhone(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

/** Cal's timestamp if it parses, otherwise now. Never NaN, which Meta rejects. */
function eventTimeMs(value: unknown): number {
  if (typeof value === "string" || typeof value === "number") {
    const ms = new Date(value).getTime();
    if (Number.isFinite(ms)) return ms;
  }
  return Date.now();
}

/** Constant-time compare so the signature check cannot be timed. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const webhookSecret = process.env.CAL_WEBHOOK_SECRET;

  if (!pixelId || !accessToken || !webhookSecret) {
    console.error("[cal-webhook] missing env: META_PIXEL_ID / META_CAPI_ACCESS_TOKEN / CAL_WEBHOOK_SECRET");
    return Response.json({ error: "not configured" }, { status: 500 });
  }

  /* Read the RAW body. The HMAC is over the exact bytes Cal sent, so this must
     happen before any JSON parsing. */
  const raw = await req.text();

  /* Hex over the raw bytes, confirmed against a real Cal delivery. */
  const signature = req.headers.get("x-cal-signature-256") ?? "";
  const expected = crypto.createHmac("sha256", webhookSecret).update(raw).digest("hex");

  if (!signature || !safeEqual(signature, expected)) {
    /* Only ever logs on failure, so it costs nothing in normal operation and
       makes a rotated-and-mismatched secret obvious. Digests are one way, so
       nothing here leaks the secret. */
    console.warn(
      "[cal-webhook] rejected: bad signature",
      JSON.stringify({
        headerPresent: Boolean(signature),
        received: signature.slice(0, 16),
        computed: expected.slice(0, 16),
        bodyBytes: Buffer.byteLength(raw, "utf8"),
      })
    );
    return Response.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  /* Only a NEW booking is a conversion. Reschedules and cancellations are not,
     and would inflate the number if we let them through. */
  const trigger = body?.triggerEvent;
  if (trigger !== "BOOKING_CREATED") {
    return Response.json({ ok: true, skipped: trigger ?? "unknown" });
  }

  const payload = body?.payload ?? {};
  const attendee = payload?.attendees?.[0] ?? {};

  /* uid is the dedup key shared with the browser pixel. Without it the pair
     cannot be collapsed, so we would rather send nothing than double count. */
  const uid: string | undefined = payload?.uid;
  if (!uid) {
    console.warn("[cal-webhook] booking has no uid, skipping to avoid double counting");
    return Response.json({ ok: true, skipped: "no uid" });
  }

  /* Cal gives firstName/lastName on the attendee directly (confirmed against a
     real BOOKING_CREATED payload), so prefer those. Splitting the display name
     on whitespace is only a fallback: it mangles "Priya Raj Sharma" and every
     single-word name, and a wrong hash is worse than no hash because it cannot
     match anything. */
  const splitName = (attendee?.name ?? "").trim().split(/\s+/);
  const firstName: string = attendee?.firstName || splitName[0] || "";
  const lastName: string = attendee?.lastName || splitName.slice(1).join(" ");

  const phone: string | undefined =
    attendee?.phoneNumber ??
    payload?.responses?.attendeePhoneNumber?.value ??
    payload?.responses?.phone?.value;

  const userData: Record<string, unknown> = {
    em: hash(attendee?.email),
    ph: hashPhone(phone),
    fn: hash(firstName),
    ln: hash(lastName),
  };
  /* Meta rejects null/undefined members, so send only what we actually have. */
  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key];
  }

  /* Qualifying answers. Sent so you can see WHICH ads bring serious applicants,
     and so Meta has value history if volume ever justifies value optimisation.
     Do NOT switch campaigns to value optimisation on this: at 8 consultations a
     week there is nowhere near enough signal, and this is stated intent on a
     form, not revenue collected. */
  const budgetAnswer = answer(payload?.responses, Q.budget);
  const value = budgetToValue(budgetAnswer);

  const customData: Record<string, unknown> = {
    ...OFFER,
    booking_uid: uid,
    budget_band: budgetAnswer,
    profession: answer(payload?.responses, Q.profession),
    prior_stylist: answer(payload?.responses, Q.priorStylist),
  };
  if (value !== undefined) {
    customData.value = value;
    customData.currency = "INR";
  }
  for (const key of Object.keys(customData)) {
    if (customData[key] === undefined) delete customData[key];
  }

  const event = {
    event_name: "Lead",
    /* Seconds, and Meta rejects anything older than 7 days. Cal puts an ISO
       createdAt at the top level on some triggers and on the payload on others,
       so try both before falling back to now. */
    event_time: Math.floor(eventTimeMs(body?.createdAt ?? payload?.createdAt) / 1000),
    event_id: `cal_lead_${uid}`,
    action_source: "website",
    event_source_url: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/book`
      : undefined,
    user_data: userData,
    custom_data: customData,
  };

  const capiBody: Record<string, unknown> = { data: [event] };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    capiBody.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(capiBody),
      }
    );

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      /* Log loudly but still 200 back to Cal. A non-2xx here makes Cal retry the
         same booking, and a retry storm on a Meta-side error helps nobody. */
      console.error("[cal-webhook] CAPI rejected", res.status, JSON.stringify(result));
      return Response.json({ ok: false, capi: result }, { status: 200 });
    }

    /* Logs the resolved value so a band that failed to map is obvious: a
       budget_band with no value next to it means BUDGET_VALUE needs that label
       (or the parser could not find a number in it). */
    console.log(
      "[cal-webhook] Lead sent",
      uid,
      JSON.stringify({ value: value ?? null, budget_band: budgetAnswer ?? null }),
      JSON.stringify(result)
    );
    return Response.json({ ok: true, event_id: event.event_id });
  } catch (err) {
    console.error("[cal-webhook] CAPI request failed", err);
    return Response.json({ ok: false }, { status: 200 });
  }
}

/* A GET is handy for confirming the route deployed at all. It reports whether
   the env is wired without ever revealing the values. */
export async function GET() {
  return Response.json({
    route: "cal -> meta capi",
    configured: Boolean(
      process.env.META_PIXEL_ID &&
        process.env.META_CAPI_ACCESS_TOKEN &&
        process.env.CAL_WEBHOOK_SECRET
    ),
  });
}
