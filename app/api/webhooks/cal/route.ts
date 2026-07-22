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

  const signature = req.headers.get("x-cal-signature-256") ?? "";
  /* An Hmac can only be digested once, so build a fresh one per encoding. */
  const digest = (enc: "hex" | "base64") =>
    crypto.createHmac("sha256", webhookSecret).update(raw).digest(enc);
  const expected = digest("hex");

  if (!signature || !safeEqual(signature, expected)) {
    /* Diagnostics for the FIRST real delivery. Cal's docs confirm HMAC-SHA256
       over the body but do not pin the encoding, so log both candidates next to
       what actually arrived: one glance says which one Cal uses, or that the
       secret itself is wrong (neither matches). None of this leaks the secret,
       these are one-way digests. Safe to delete once a delivery has landed. */
    console.warn(
      "[cal-webhook] rejected: bad signature\n" +
        `  header present : ${signature ? "yes" : "NO, check the header name"}\n` +
        `  received       : ${signature || "(none)"}\n` +
        `  computed hex   : ${expected}\n` +
        `  computed b64   : ${digest("base64")}\n` +
        `  body bytes     : ${Buffer.byteLength(raw, "utf8")}\n` +
        `  cal headers    : ${JSON.stringify(
          Object.fromEntries(
            [...req.headers.entries()].filter(([k]) => k.toLowerCase().startsWith("x-cal"))
          )
        )}`
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

  /* First-delivery diagnostics: confirms the paths this route depends on are
     really where we think they are. Names/emails are NOT logged, only whether a
     value was found. Safe to delete once a booking has come through clean. */
  console.log(
    "[cal-webhook] payload check:",
    JSON.stringify({
      payloadKeys: Object.keys(payload),
      hasUid: Boolean(payload?.uid),
      attendeeCount: payload?.attendees?.length ?? 0,
      attendeeKeys: Object.keys(attendee),
      hasEmail: Boolean(attendee?.email),
      hasName: Boolean(attendee?.name),
      responseKeys: Object.keys(payload?.responses ?? {}),
    })
  );

  /* uid is the dedup key shared with the browser pixel. Without it the pair
     cannot be collapsed, so we would rather send nothing than double count. */
  const uid: string | undefined = payload?.uid;
  if (!uid) {
    console.warn("[cal-webhook] booking has no uid, skipping to avoid double counting");
    return Response.json({ ok: true, skipped: "no uid" });
  }

  /* Cal sends the full name in one field. Meta wants first and last hashed
     separately, so split on the first space and hash whatever we got. */
  const fullName: string = attendee?.name ?? "";
  const [firstName, ...restName] = fullName.trim().split(/\s+/);
  const lastName = restName.join(" ");

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
    custom_data: {
      ...OFFER,
      booking_uid: uid,
    },
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

    console.log("[cal-webhook] Lead sent", uid, JSON.stringify(result));
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
