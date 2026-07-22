/* Thin wrapper over the Meta Pixel (browser side).

   Every call no-ops when fbq is not on the page (ad blocker, JS disabled, a
   server render, the pixel script still in flight). Tracking must never be able
   to throw inside the funnel, so nothing here assumes the pixel loaded. */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

function ready(): Fbq | null {
  if (typeof window === "undefined") return null;
  return typeof window.fbq === "function" ? window.fbq : null;
}

/* The pixel loads with strategy="afterInteractive", and React effects also run
   after hydration, so the two race. An event fired from a mount effect can
   arrive before window.fbq exists and would otherwise vanish with no error.

   So: hold anything fired too early and flush it the moment the pixel appears.
   Give up after WAIT_MS, which is the genuinely blocked case (ad blocker), and
   drop the queue rather than leak a timer forever. */
const WAIT_MS = 10_000;
const POLL_MS = 200;
let queued: Array<() => void> = [];
let waiting = false;

function flushWhenReady() {
  if (waiting) return;
  waiting = true;
  const started = Date.now();
  const tick = () => {
    if (ready()) {
      const run = queued;
      queued = [];
      waiting = false;
      run.forEach((fire) => fire());
      return;
    }
    if (Date.now() - started > WAIT_MS) {
      queued = [];
      waiting = false;
      return;
    }
    window.setTimeout(tick, POLL_MS);
  };
  tick();
}

function send(fire: (fbq: Fbq) => void) {
  const fbq = ready();
  if (fbq) {
    fire(fbq);
    return;
  }
  if (typeof window === "undefined") return; // server render, nothing to queue
  queued.push(() => {
    const late = ready();
    if (late) fire(late);
  });
  flushWhenReady();
}

/** Fire one of Meta's standard events (PageView, ViewContent, Lead, ...).
 *  Pass eventID when the same event is ALSO sent from the Conversions API, so
 *  Meta collapses the pair instead of counting the conversion twice. */
export function track(
  event: string,
  params?: Record<string, unknown>,
  eventID?: string
) {
  send((fbq) => {
    if (eventID) fbq("track", event, params, { eventID });
    else fbq("track", event, params);
  });
}

/** Fire a custom (non-standard) event. */
export function trackCustom(event: string, params?: Record<string, unknown>) {
  send((fbq) => fbq("trackCustom", event, params));
}

/* The one offer this funnel sells, so every event carries the same labels and
   the numbers line up in Events Manager. Kept in sync with the server-side copy
   in app/api/webhooks/cal/route.ts. */
export const OFFER = {
  content_name: "Instant Image Upgrade consultation",
  content_category: "booking",
} as const;

/** The shared dedup key for a booking. The browser pixel and the Cal.com
 *  webhook must derive the SAME string from the SAME booking, which is why it
 *  is built from Cal's booking uid and nothing else. */
export function leadEventId(bookingUid: string) {
  return `cal_lead_${bookingUid}`;
}
