"use client";

import { useEffect, useRef, useState } from "react";
import { OFFER, leadEventId, track } from "../lib/fbq";

/* Cal.com inline embed for Sanobar's 30-minute Instant Image Upgrade consultation.
   calLink: sanobar-samir-fiqx39/30min. Runs client-side only; the brand FRAMES the
   embed (cream inset + loading placeholder), it does not restyle Cal's own UI (C12). */
export default function CalEmbed() {
  const [ready, setReady] = useState(false);
  const viewed = useRef(false);
  const booked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const debug =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("pixeldebug");
    /* eslint-disable */
    (function (C: any, A: string, L: string) {
      let p = function (a: any, ar: any) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal; let ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          const api: any = function () { p(api, arguments); };
          const namespace = ar[1]; api.q = api.q || [];
          if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
          else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    const Cal = (window as any).Cal;
    Cal("init", "30min", { origin: "https://app.cal.com" });
    Cal.config = Cal.config || {};
    Cal.config.forwardQueryParams = true;
    Cal.ns["30min"]("inline", {
      elementOrSelector: "#my-cal-inline-30min",
      config: { layout: "month_view", useSlotsViewOnSmallScreen: "true" },
      calLink: "sanobar-samir-fiqx39/30min",
    });
    Cal.ns["30min"]("ui", { hideEventTypeDetails: false, layout: "month_view" });
    /* best-effort: lift the placeholder once Cal has had a moment to render */
    Cal.ns["30min"]("on", { action: "linkReady", callback: () => setReady(true) });

    /* Meta Pixel — mid-funnel: they reached the calendar. /book is only ever
       reached from a CTA, so this is the reliable "clicked apply" number.
       Ref-guarded so React's double-invoked effect in dev cannot double-count. */
    if (!viewed.current) {
      viewed.current = true;
      track("ViewContent", OFFER);
    }

    /* Meta Pixel — the conversion: the consultation is actually booked. This is
       the event to optimise the campaign on.

       The SAME Lead is also sent server-side by the Cal.com webhook at
       /api/webhooks/cal. Both carry event_id cal_lead_<booking uid>, so Meta
       collapses the pair into one conversion. If the uid is missing from the
       callback we still fire, but unmatched: an over-count is recoverable,
       a silently missing conversion is not.

       bookingSuccessfulV2 is the current event; it deprecates the older
       bookingSuccessful. We subscribe to BOTH and drop the second one by uid,
       so this keeps working whichever Cal actually emits. */
    const fireLead = (e: any) => {
      const d = e?.detail?.data ?? {};
      const uid: string | undefined = d?.uid ?? d?.booking?.uid;
      if (debug) console.log("[pixel-debug] fireLead", { uid, fbq: typeof window.fbq, e });
      if (uid) {
        if (booked.current.has(uid)) return; // already sent for this booking
        booked.current.add(uid);
      }
      track("Lead", OFFER, uid ? leadEventId(uid) : undefined);
    };
    Cal.ns["30min"]("on", { action: "bookingSuccessfulV2", callback: fireLead });
    Cal.ns["30min"]("on", { action: "bookingSuccessful", callback: fireLead });

    /* Diagnostics, off unless the URL carries ?pixeldebug=1.

       Listens to the RAW postMessage channel rather than Cal's named events, so
       it shows what Cal actually emits on booking even if the action name we
       subscribe to is wrong. That is the whole point: a named listener cannot
       tell you it was never called. Delete once the Lead is confirmed. */
    let onMsg: ((ev: MessageEvent) => void) | null = null;
    if (debug) {
      console.log("[pixel-debug] armed. fbq at mount:", typeof window.fbq);
      onMsg = (ev: MessageEvent) => {
        if (typeof ev.origin === "string" && ev.origin.includes("cal.com")) {
          console.log("[pixel-debug] cal =>", ev.data);
        }
      };
      window.addEventListener("message", onMsg);
    }

    const t = setTimeout(() => setReady(true), 2500);
    return () => {
      clearTimeout(t);
      if (onMsg) window.removeEventListener("message", onMsg);
    };
  }, []);

  return (
    <div className="bk-cal" id="cal">
      {!ready && (
        <span className="bk-cal-loading" aria-hidden="true">
          Opening the calendar
        </span>
      )}
      <div id="my-cal-inline-30min" className="bk-cal-inline" />
    </div>
  );
}
