import type { Metadata } from "next";
import Script from "next/script";
import MetaPixel from "./MetaPixel";

export const metadata: Metadata = {
  title: "The Instant Image Upgrade · Sanobar Samir",
  description:
    "You earned your success. People still cannot see it on you. A private, one-to-one Instant Image Upgrade with celebrity stylist Sanobar Samir, so how people see you finally matches what you have built.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Meta (Facebook) domain verification. Required for Aggregated Event
            Measurement, which is how conversions from iOS users get attributed.
            Public by design, it is meant to be readable in page source. Meta
            re-checks it periodically, so this tag has to STAY here. */}
        <meta
          name="facebook-domain-verification"
          content="qlvthhc5jb3su9aoeex7dssmhdgxef"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/*
          The luxury-house model (Chanel / Vogue / Celine): a Didone WORDMARK on top
          + ONE neo-grotesque doing everything else, hierarchy from case + tracking +
          weight + scale (not a second body font).
            Wordmark (masthead "Sanobar Samir" only) = Bodoni Moda (the Didone)
            Everything else (titles, body, labels)   = Jost (the Futura, one geometric)
          LICENSED UPGRADE: drop real Futura .woff2 in /public/fonts, @font-face in
          styles.css, repoint --f-display/body.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {children}
        {/* Meta Pixel — base code + PageView on every page */}
        <MetaPixel />
        {/* Microsoft Clarity — session analytics/heatmaps */}
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "xhpz90q436");`}
        </Script>
      </body>
    </html>
  );
}
