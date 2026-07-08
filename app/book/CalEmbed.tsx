"use client";

import { useEffect, useState } from "react";

/* Cal.com inline embed for Sanobar's 30-minute Instant Image Upgrade consultation.
   calLink: sanobar-samir-fiqx39/30min. Runs client-side only; the brand FRAMES the
   embed (cream inset + loading placeholder), it does not restyle Cal's own UI (C12). */
export default function CalEmbed() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
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
