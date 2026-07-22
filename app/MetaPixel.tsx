import Script from "next/script";

/* Meta Pixel base code. Mounted once in the root layout, so PageView fires on
   every page. Every link in this funnel is a plain <a> (no next/link), so each
   navigation is a real page load and PageView fires again on its own — there is
   no SPA route-change shim to maintain.

   The id comes from NEXT_PUBLIC_META_PIXEL_ID. If it is unset (a bare local
   checkout) the pixel simply does not render, rather than initialising against
   a wrong or hardcoded id.

   Conversion events are fired from app/lib/fbq.ts. The Lead event is ALSO sent
   server-side from app/api/webhooks/cal/route.ts and deduplicated on event_id. */

export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
/* Mid-funnel event. Fired HERE, in the same script as init, so it cannot lose a
   race against fbq loading. It used to fire from CalEmbed's mount effect, which
   races the pixel script and loses silently. /book is only reachable from a CTA,
   so this is the reliable "clicked apply" number. */
if (window.location.pathname.replace(/\\/+$/, '') === '/book') {
  fbq('track', 'ViewContent', {
    content_name: 'Instant Image Upgrade consultation',
    content_category: 'booking'
  });
}`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
