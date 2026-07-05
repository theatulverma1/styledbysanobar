import FunnelScripts from "./FunnelScripts";

/* SANOBAR — high-ticket single-page funnel ("Instant Image Upgrade").
   One page, one action: apply for a one-to-one Instant Image Upgrade. Structure
   is the tgo-sreshtha book-a-call spine (Hero -> Who -> Problem -> Call structure
   -> What you get -> Testimonials -> FAQ -> Footer), rendered in the LOCKED
   sanobar-quiz skin by reusing the result-page component classes as a parts bin.
   Copy via NO-BRAINER, structure via SHAPE. [PENDING SANOBAR] = a real asset or
   figure still to land; honest placeholders only, never fabricated data. */

const BOOK_HREF = "#book"; // [PENDING SANOBAR] real Calendly / application link

/* ---- inline line-icon helper ---- */
const I = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

/* the big names, bolded wherever they appear (celebrities, brands, films). */
const BIG_NAMES = [
  "Rajkummar Rao", "Parineeti Chopra", "Priyamani", "Sharvari Wagh", "Jyothi Yarraji",
  "Martin Garrix", "Shah Rukh Khan", "Deepika Padukone", "Alia Bhatt", "Kriti Sanon",
  "Jim Sarbh", "Pankaj Tripathi", "Ajay Devgn", "Huma Qureshi", "Madhuri Dixit",
  "Virat Kohli", "Anushka Sharma", "Arijit Singh",
  "Parachute", "Kotak Mahindra", "Oppo", "American Tourister", "Santoor",
  "Gangubai Kathiawadi", "Mimi",
];
function highlightNames(text: string): React.ReactNode {
  const escaped = [...BIG_NAMES].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  return text.split(re).map((part, i) => (BIG_NAMES.includes(part) ? <strong className="rc-name" key={i}>{part}</strong> : part));
}

/* §2 authority: stats + the 4-part track arc + brand logos (real files). */
const CRED_STATS: { n: string; l: string }[] = [
  { n: "10+", l: "Years in fashion" },
  { n: "100+", l: "Campaigns, films & shoots" },
  { n: "200+", l: "Styling appointments at Broadway" },
];
const CRED_TRACK: { head: string; body: string }[] = [
  { head: "It all started in films", body: "Co-styled on film sets featuring Deepika Padukone, Alia Bhatt, Kriti Sanon, Jim Sarbh, Pankaj Tripathi, Ajay Devgn, Huma Qureshi & Madhuri Dixit, across blockbusters like Gangubai Kathiawadi and Mimi." },
  { head: "Then came the big brands", body: "Launched 100+ brand campaigns for names like American Tourister and Parachute, and shoots featuring Virat Kohli, Anushka Sharma and Arijit Singh." },
  { head: "A national first", body: "Launched India's first nationwide personal-shopper program, running on her own diagnostic system, fully booked out in 15 days." },
  { head: "And now, you", body: "And now that same system is reading you, through the very quiz you just finished." },
];
const CRED_TRACK_ICONS: React.ReactNode[] = [
  I(<><rect x="3" y="7.5" width="18" height="12.5" /><circle cx="12" cy="13.7" r="3.1" /><path d="M8.5 7.5 10 5h4l1.5 2.5" /></>),
  I(<><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>),
  I(<><path d="M4 20.5h16" /><path d="M5.5 20.5V10.5l6.5-4 6.5 4v10" /><path d="M10 20.5v-5h4v5" /></>),
  I(<><circle cx="12" cy="7" r="3" /><path d="M6 20a6 6 0 0 1 12 0" /></>),
];
const CRED_LOGOS: { name: string; src: string; scale?: number }[] = [
  { name: "Kotak Mahindra", src: "/images/logos/kotak.svg" },
  { name: "Oppo", src: "/images/logos/oppo.png" },
  { name: "Tanishq", src: "/images/logos/tanishq.webp" },
  { name: "American Tourister", src: "/images/logos/american-tourister.svg" },
  { name: "Parachute", src: "/images/logos/parachute.png", scale: 1.55 },
  { name: "Santoor", src: "/images/logos/santoor.png", scale: 1.95 },
  { name: "Whisper", src: "/images/logos/whisper.png", scale: 1.3 },
  { name: "Myntra", src: "/images/logos/myntra.png", scale: 1.45 },
  { name: "Livspace", src: "/images/logos/livspace.png", scale: 1 },
  { name: "Future Group", src: "/images/logos/future-group.png" },
];

/* §4 call structure: what actually happens on the consultation, as an agenda. */
const AGENDA: { title: string; desc: string }[] = [
  { title: "She reads where you are today", desc: "Your work, the rooms you walk into, and how you want to be seen at the occasions that matter." },
  { title: "She reads your proportions and colouring", desc: "Your body shape and the shades that genuinely suit you, the way she reads it for the camera." },
  { title: "She names what is holding your image back", desc: "The one or two quiet things working against how you look, that no one ever pointed out." },
  { title: "She tells you honestly if it is a fit", desc: "This is not a pitch. If Sanobar is not right for what you need, she will say so plainly." },
];
const AGENDA_ICONS: React.ReactNode[] = [
  I(<><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>),
  I(<><rect x="3" y="8" width="18" height="8" rx="1.4" /><path d="M7 8v3M10.5 8v4M14 8v3M17.5 8v4" /></>),
  I(<><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  I(<><circle cx="12" cy="12" r="9" /><path d="M8 12.4l2.6 2.6L16 9.5" /></>),
];

/* §5 what you walk away with: the Instant Image Upgrade deliverables. */
const LEAVE: { title: string; desc: string }[] = [
  { title: "Style Discovery", desc: "A full read of your proportions, colouring and how you want to be seen." },
  { title: "Korean Colour Analysis", desc: "Your exact palette, so every colour finally works for your skin, not against it." },
  { title: "Wardrobe Audit", desc: "What to keep, what to let go, and the gaps worth filling." },
  { title: "Grooming Direction", desc: "The finishing details most people miss, that quietly change how put-together you look." },
  { title: "Personal Shopping", desc: "The right pieces sourced for you, so you stop buying wrong." },
  { title: "Lookbook & Reports", desc: "Everything documented, so you dress right long after the call." },
];
const LEAVE_ICONS: React.ReactNode[] = [
  I(<><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.6" /></>),
  I(<><path d="M12 3.2a8.8 8.8 0 1 0 0 17.6c1.3 0 1.8-.9 1.8-1.8 0-1.4.9-1.9 1.9-1.9h.9a2.8 2.8 0 0 0 2.8-2.8c0-4.8-3.6-8.5-9.4-8.5Z" /><circle cx="7.6" cy="11" r="1" /><circle cx="12" cy="8" r="1" /><circle cx="16.3" cy="11" r="1" /></>),
  I(<><path d="M12 7.2a1.5 1.5 0 1 1 1.2 2.4c-.7.1-1.2.6-1.2 1.2" /><path d="M12 10.8 4.5 16.5h15z" /></>),
  I(<><circle cx="6" cy="7" r="2.1" /><circle cx="6" cy="17" r="2.1" /><path d="M7.7 8.3 20 17M7.7 15.7 20 7" /></>),
  I(<><path d="M6 8h12l-1 11H7L6 8z" /><path d="M9 8V6.4a3 3 0 0 1 6 0V8" /></>),
  I(<><rect x="5" y="3.5" width="14" height="17" rx="1" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>),
];

/* §6 testimonials: consented client clips (assets pending — honest placeholders). */
const TESTI_FEATURED = { title: "The first look", dur: "0:32" };
const TESTI_CLIPS: { title: string; dur: string }[] = [
  { title: "The wardrobe edit", dur: "0:41" },
  { title: "Colour draping", dur: "0:35" },
  { title: "The body-shape read", dur: "0:28" },
  { title: "Personal shopping", dur: "0:38" },
];

/* §7 FAQ: objections in order; the first opens by default and carries the pill. */
const FAQ: { q: string; a: React.ReactNode; most?: boolean }[] = [
  {
    q: "I do not have a style problem, I have no time. Is this even for me?",
    most: true,
    a: <>That is exactly who this is for. You are not meant to spend hours on this. The point of one conversation with Sanobar is that she does the reading and the thinking, and hands you a plan, so you never have to guess in the morning again.</>,
  },
  {
    q: "Will a stylist actually change how people see me?",
    a: <>Yes, and it is the fastest lever you have. People decide your level in the first few seconds, before you speak. Change what they see first, and you stop having to prove your level in every room.</>,
  },
  {
    q: "My body is not easy to dress. Will this work for me?",
    a: <>Your body is not the problem, and it never was. Any set of proportions can be dressed well once someone reads them properly. That reading is the whole job of the consultation, built around the body you actually have, not an ideal one.</>,
  },
  {
    q: "Is this a sales call in disguise? What does it cost?",
    a: <>No. The first conversation is about you, and Sanobar will give you a real, honest read whether or not you ever work with her further. What that leads to afterward is entirely your call.</>,
  },
  {
    q: "I already own expensive clothes, and someone shops for me. Why do I need this?",
    a: <>Because owning good pieces and being styled are not the same thing. A cupboard of expensive clothes with no single plan is exactly the problem this solves. Sanobar builds the plan that makes what you own, and what you buy next, finally work together for your body.</>,
  },
  {
    q: "Why should I do this now?",
    a: <>Because the next room is already in your calendar. Every wedding, meeting and appearance you walk into before you fix this is one more where your image speaks a level below you, and you never get that first impression back. And Sanobar takes only 8 consultations a week.</>,
  },
];

/* hero offer-card items: circular icon badge + one line each. */
const HERO_CARD: { icon: React.ReactNode; text: string }[] = [
  { icon: I(<><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>), text: "One to one with Sanobar herself, live" },
  { icon: I(<><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.6" /></>), text: "She reads your image on sight, the way she reads it for the camera" },
  { icon: I(<><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8.2" cy="8.2" r="1.1" /></>), text: "She names exactly what is holding it back" },
  { icon: I(<><rect x="5" y="3.5" width="14" height="17" rx="1" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></>), text: "You leave with your Instant Image Upgrade plan, built only for you" },
];

export default function Page() {
  return (
    <main className="result hi">
      {/* ============ [1] HERO — two-column: text stack left, tall portrait
           right; stacks on mobile with the image between body and card ======= */}
      <section className="r-band r-band--dark hi-hero">
        <div className="hi-hero-layout">
          <div className="hi-hero-intro">
            <span className="sec-eyebrow r-hero-eyebrow hi-eyebrow">For founders, leaders, experts, and public figures</span>
            <h1 className="hi-h1">
              Why do people half as successful as you look <em className="hi-turn">twice as expensive?</em>
            </h1>
            <p className="hi-sub">
              It is not your money. It is not your taste. In 30 minutes, <span className="hi-hl">Bollywood celebrity
              stylist Sanobar Samir</span> will get on a call with you and use her <span className="hi-hl">Instant
              Image Upgrade System</span> to close the gap, so people finally see you at the level you have already
              reached.
            </p>
          </div>

          <figure className="hi-hero-media">
            <span className="hi-hero-glow" aria-hidden="true" />
            <span className="hi-hero-imgclip">
              <img className="hi-hero-img" src="/images/hero_photo.png" alt="Sanobar Samir" />
            </span>
          </figure>

          <div className="hi-hero-offer">
            <div className="hi-hero-card">
              <span className="hi-card-eyebrow">Your 30-minute Instant Image Upgrade</span>
              <ul className="hi-card-list">
                {HERO_CARD.map((c, i) => (
                  <li key={i}>
                    <span className="hi-card-ic" aria-hidden="true">{c.icon}</span>
                    <span className="hi-card-txt">{c.text}</span>
                  </li>
                ))}
              </ul>
              <p className="hi-card-foot">The eye behind national campaigns and leading actors, now on you.</p>
            </div>
            <a className="hi-cta-btn" href={BOOK_HREF}>Apply for your Instant Image Upgrade <span className="arrow">&rarr;</span></a>
            <ul className="hi-cta-points">
              <li className="hi-cta-point">
                <span className="hi-cta-point-ic" aria-hidden="true">{I(<><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>)}</span>
                <span className="hi-cta-point-txt">One to one with Sanobar</span>
              </li>
              <li className="hi-cta-point">
                <span className="hi-cta-point-ic" aria-hidden="true">{I(<><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.6" /></>)}</span>
                <span className="hi-cta-point-txt">A real read, not a pitch</span>
              </li>
              <li className="hi-cta-point">
                <span className="hi-cta-point-ic" aria-hidden="true">{I(<><rect x="3" y="4.5" width="18" height="16" rx="1.4" /><path d="M3 9h18M8 3v3M16 3v3" /></>)}</span>
                <span className="hi-cta-point-txt">Only 8 consultations a week</span>
              </li>
            </ul>
            <a className="hi-soft" href="#problem">Not ready to apply? See why the gap exists, and why it was never your fault &darr;</a>
          </div>
        </div>
        <div className="hi-hero-stats">
          {CRED_STATS.map((s) => (
            <div className="hi-stat" key={s.l}>
              <span className="hi-stat-n">{s.n}</span>
              <span className="hi-stat-l">{s.l}</span>
            </div>
          ))}
        </div>
      </section>
      <span data-sticky-start aria-hidden="true" />

      {/* ============ [2] WHO IS DOING IT — authority (heaviest component) ============ */}
      <section className="r-band r-cred hi-who reveal" aria-label="Who is doing this">
        <div className="r-inner">
          <div className="rc-top">
            <figure className="rc-portrait">
              <img className="rc-portrait-img" src="/images/IMG_2730.PNG" alt="Sanobar Samir" />
            </figure>
            <div className="rc-right">
              <header className="r-head rc-head">
                <span className="r-index" aria-hidden="true">01</span>
                <span className="sec-eyebrow">The person behind your consultation</span>
              </header>
              <h2 className="rc-title">From Bhansali&rsquo;s sets to India&rsquo;s leading actors. Now that eye is on <em>your image</em>.</h2>
              <span className="rc-rule" aria-hidden="true" />
              <p className="rc-lead">
                The eye reading your image belongs to Sanobar Samir, one of the eyes behind how India&rsquo;s biggest
                names appear on screen. Across 10+ years she has personally styled leading actors and worked on films
                and campaigns that featured {highlightNames("Martin Garrix, Shah Rukh Khan, Deepika Padukone, Alia Bhatt, Kriti Sanon, Jim Sarbh, Pankaj Tripathi, Ajay Devgn, Huma Qureshi & Madhuri Dixit")}.
                That same eye is now on you, and on your image.
              </p>
            </div>
          </div>

          <div className="rc-track">
            <span className="rc-track-label">A track record that speaks for itself</span>
            <ol className="rc-steps">
              {CRED_TRACK.map((t, i) => (
                <li className="rc-step" key={i}>
                  <span className="rc-step-ic" aria-hidden="true">{CRED_TRACK_ICONS[i]}</span>
                  <div className="rc-step-body">
                    <span className="rc-step-n">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="rc-step-h">{t.head}</h3>
                    <p className="rc-step-p">{highlightNames(t.body)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rc-logos-wrap">
            <span className="r-authority-eyebrow">As seen on</span>
            <div className="rc-marquee">
              <div className="rc-marquee-track">
                {Array.from({ length: 6 }).flatMap((_, g) =>
                  CRED_LOGOS.map((l, i) => (
                    <span className="r-logo" key={`${g}-${i}`} aria-hidden={g >= 3}>
                      <img className="r-logo-img" src={l.src} alt={l.name} style={{ "--logo-scale": l.scale ?? 1 } as React.CSSProperties} />
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ [3] HIGHLIGHT PROBLEM — the A to B gap ============ */}
      <section className="r-band hi-problem pr" id="problem" aria-label="The real problem">
        {/* moment 1 — hero statement */}
        <div className="pr-moment pr-hero reveal">
          <span className="pr-num" aria-hidden="true">02</span>
          <h2 className="pr-h">You built the success.<br /><span className="pr-h-accent">Your image never caught up.</span></h2>
          <p className="pr-support">People rarely underestimate your work. They often underestimate you before you speak.</p>
        </div>

        {/* moment 2 — the comparison (today vs should-be) */}
        <div className="pr-moment pr-compare reveal">
          <div className="pr-col">
            <span className="pr-col-eyebrow">How people see you today</span>
            <ul className="pr-list">
              <li>Capable</li>
              <li>Experienced</li>
              <li>Trustworthy</li>
              <li className="pr-punch">Easy to underestimate</li>
            </ul>
          </div>
          <span className="pr-divide" aria-hidden="true" />
          <div className="pr-col pr-col--to">
            <span className="pr-col-eyebrow">How they should see you</span>
            <ul className="pr-list">
              <li>Senior</li>
              <li>Decisive</li>
              <li>Influential</li>
              <li className="pr-punch">The person people notice first</li>
            </ul>
          </div>
        </div>

        {/* moment 3 — the question every room asks */}
        <div className="pr-moment pr-question reveal">
          <p className="pr-q-lead">Every room asks one question before you speak.</p>
          <p className="pr-q-main">&ldquo;How important is this person?&rdquo;</p>
          <p className="pr-q-foot">Your image answers first.</p>
        </div>

        {/* moment 4 — closing + transition to the consultation */}
        <div className="pr-moment pr-close reveal">
          <p className="pr-close-h">Nothing in your wardrobe is wrong.<br />It simply wasn&rsquo;t built for you.</p>
          <span className="pr-close-note">That&rsquo;s exactly what Sanobar identifies during your consultation.</span>
        </div>
      </section>

      {/* ============ [4] CALL STRUCTURE — the agenda ============ */}
      <section className="r-band hi-call reveal" aria-label="What happens on the call">
        <div className="r-inner">
          <header className="r-head">
            <span className="r-index" aria-hidden="true">03</span>
            <span className="sec-eyebrow">What the consultation is</span>
            <h2 className="r-h2">A private read of your image. <em>Not a sales call.</em></h2>
            <p className="r-sub">One to one with Sanobar herself. Come exactly as you are; there is nothing to prepare.</p>
          </header>
          <span className="call-meta-chip">One to one · With Sanobar herself · 30 minutes</span>
          <div className="bp-steps-box">
            <ol className="bp-steps">
              {AGENDA.map((s, i) => (
                <li className="bp-step" key={i}>
                  <span className="bp-step-ic" aria-hidden="true">{AGENDA_ICONS[i]}</span>
                  <div className="bp-step-body">
                    <span className="bp-step-n">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="bp-step-t">{s.title}</h3>
                    <p className="bp-step-d">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ============ [5] WHAT YOU WILL GET — the Instant Image Upgrade ============ */}
      <section className="r-band hi-get reveal" aria-label="What you walk away with">
        <div className="r-inner r-inner--wide">
          <header className="r-head">
            <span className="r-index" aria-hidden="true">04</span>
            <span className="sec-eyebrow">What the upgrade includes</span>
            <h2 className="r-h2">Your personal <em>Instant Image Upgrade</em></h2>
            <p className="r-sub">A complete image transformation, built only for you. Your colours, your wardrobe, your shopping and the plan to hold it all together, done with Sanobar.</p>
          </header>
          <ul className="bp-leave">
            {LEAVE.map((d, i) => (
              <li className="bp-leave-item" key={i}>
                <span className="bp-leave-ic" aria-hidden="true">{LEAVE_ICONS[i]}</span>
                <h4 className="bp-leave-t">{d.title}</h4>
                <p className="bp-leave-d">{d.desc}</p>
              </li>
            ))}
          </ul>
          <p className="bp-leave-note">Plus Sanobar on WhatsApp throughout, for the moments you are unsure.</p>
        </div>
      </section>

      {/* ============ [6] TESTIMONIALS — proof ============ */}
      <section className="r-band r-testi hi-testi reveal" aria-label="People who stood where you stand">
        <div className="r-inner">
          <header className="rt-head">
            <span className="r-index" aria-hidden="true">05</span>
            <span className="sec-eyebrow">People who stood where you stand</span>
            <h2 className="r-h2">Accomplished, and finally <em>seen</em></h2>
            <p className="rt-sub">Sanobar&rsquo;s appointment-only service, a first of its kind in India, booked out in fifteen days with a waiting list. Every person here was already successful. The only thing missing was an image that matched. <span className="r-pending">[PENDING SANOBAR: confirm wording]</span></p>
          </header>

          <figure className="rt-featured">
            <span className="rt-featured-media" aria-hidden="true" />
            <button type="button" className="rt-play rt-play--lg" aria-label={`Play ${TESTI_FEATURED.title}`}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19 12z" /></svg>
            </button>
            <figcaption className="rt-featured-cap">
              <span className="rt-featured-eyebrow">Featured<span className="rt-cap-rule" aria-hidden="true" /></span>
              <span className="rt-featured-title">{TESTI_FEATURED.title}</span>
              <span className="rt-featured-dur">{TESTI_FEATURED.dur}</span>
            </figcaption>
          </figure>

          <div className="rt-band-label"><span>Inside an Instant Image Upgrade</span> <span className="r-pending">[PENDING SANOBAR: real consented clips]</span></div>

          <ul className="rt-carousel">
            {TESTI_CLIPS.map((c, i) => (
              <li className="rt-card" key={i}>
                <figure className="rt-card-media" aria-hidden="true">
                  <button type="button" className="rt-play" aria-label={`Play ${c.title}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19 12z" /></svg>
                  </button>
                </figure>
                <div className="rt-card-meta">
                  <h3 className="rt-card-title">{c.title}</h3>
                  <span className="rt-card-dur">{c.dur}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className="rt-closing">Real moments from real consultations. No scripts, no actors, just people <em>seeing themselves differently</em>.</p>
        </div>
      </section>

      {/* ============ [7] FAQ ============ */}
      <section className="r-band hi-faq reveal" aria-label="Before you apply">
        <div className="r-inner">
          <header className="r-head">
            <span className="r-index" aria-hidden="true">06</span>
            <span className="sec-eyebrow">Before you apply</span>
            <h2 className="r-h2">Quick answers</h2>
          </header>
          <div className="faq">
            {FAQ.map((f, i) => (
              <details className="faq-item" key={i} open={f.most}>
                <summary className="faq-q">
                  <span className="faq-q-text">{f.q}{f.most ? <span className="most-asked">Most asked</span> : null}</span>
                  <span className="faq-ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </summary>
                <div className="faq-a"><p>{f.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ [8] FOOTER — dark oxblood finale peak ============ */}
      <section className="r-band r-band--dark r-finale" id="book" data-sticky-stop>
        <div className="r-inner">
          <span className="sec-eyebrow r-hero-eyebrow">Now let it tell the same story</span>
          <h2 className="r-finale-h">You already built the success. Now let your image <em>tell the same story</em>.</h2>
          <p className="r-finale-sub">
            At the next wedding, the next meeting, the next stage, be the one they remember, for exactly the right
            reasons. One conversation, and a plan built only for you.
          </p>
          <a className="cta-btn" href={BOOK_HREF}>Apply for your Instant Image Upgrade <span className="arrow">&rarr;</span></a>
          <span className="r-finale-micro">
            Led personally by Sanobar · by private application · only 8 consultations each week
          </span>
          <div className="r-colophon">Your image should be as thought through as everything else you have built.<br />The Instant Image Upgrade, by Sanobar Samir.</div>
        </div>
      </section>

      {/* sticky book bar — chrome, appears past the hero, hides at the finale */}
      <div className="hi-sticky" aria-hidden="true">
        <span className="hi-sticky-txt">Your image, read by the eye behind the campaigns.</span>
        <a className="hi-sticky-btn" href={BOOK_HREF}>Apply for your consultation <span className="arrow">&rarr;</span></a>
      </div>

      <FunnelScripts />
    </main>
  );
}
