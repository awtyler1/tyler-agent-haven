import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { tig } from '@/data/landingContent';

// ============================================================================
// ORIGINAL DATA REPORT — "The Kentucky Medicare Market: An Agent's 2026 Report"
// ----------------------------------------------------------------------------
// Shared report body used by TWO surfaces:
//   • Public SEO/GEO page  → /kentucky-medicare-market-report (KentuckyReportPage)
//   • In-shell agent page  → /market-report (AgentMarketReportPage), embedded
//
// Pass `embedded` for the agent-facing render: it drops the public marketing
// nav, the recruiting CTA, the public footer, and the /insights cross-links, so
// an agent viewing the report never leaves the hub shell. The data, stats, and
// analysis are identical across both.
//
// INTEGRITY RULE: do not add a number here without a source below. Figures the
// research flagged as unverifiable (a hard KY agent count, a KY dual-eligible
// headcount, a measured "beneficiaries per agent") are deliberately NOT stated
// as fact. Future editions can add TIG first-party data (retention, survey).
// ============================================================================

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="kr-nav">
      <div className="kr-nav__in">
        <RouterLink to="/" className="kr-brand">
          <img className="kr-crest" src="/tyler-crest.png" alt="" aria-hidden="true" /> {tig.name}
        </RouterLink>
        <nav className="kr-nav__lks">
          <RouterLink to="/#honest" className="kr-nav__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="kr-nav__lk">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="kr-nav__lk">Insights</RouterLink>
          <RouterLink to="/about" className="kr-nav__lk">About</RouterLink>
        </nav>
        <div className="kr-nav__act">
          <RouterLink to="/auth" className="kr-btn kr-btn--ghost">Agent Login</RouterLink>
          <RouterLink to="/join" className="kr-btn kr-btn--gold">I'm Ready to Grow</RouterLink>
        </div>
        <button
          className={`kr-burger${menuOpen ? ' is-open' : ''}`}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
      {menuOpen && (
        <div className="kr-mmenu" onClick={() => setMenuOpen(false)}>
          <RouterLink to="/#honest" className="kr-mmenu__lk">Why TIG</RouterLink>
          <RouterLink to="/choosing-a-medicare-fmo" className="kr-mmenu__lk">Choosing an FMO</RouterLink>
          <RouterLink to="/insights" className="kr-mmenu__lk">Insights</RouterLink>
          <RouterLink to="/about" className="kr-mmenu__lk">About</RouterLink>
          <RouterLink to="/auth" className="kr-mmenu__lk">Agent Login</RouterLink>
          <RouterLink to="/join" className="kr-btn kr-btn--gold kr-mmenu__cta">I'm Ready to Grow</RouterLink>
        </div>
      )}
    </header>
  );
}

// Headline stat tiles (hero numbers — no chart needed).
const STATS: { big: string; label: string; foot: string }[] = [
  { big: '~900K', label: 'Kentuckians on Medicare', foot: 'Part A & B, CMS, early 2026' },
  { big: '~55%', label: 'are in a Medicare Advantage plan', foot: 'about the national average' },
  { big: '1 in 5', label: 'Kentuckians will be 65+ by 2030', foot: 'KY Center for Economic Policy' },
  { big: '#46', label: 'state rank for senior health', foot: 'America’s Health Rankings, 2025' },
  { big: '$725', label: 'per new MA enrollment for a KY agent', foot: 'CMS 2027 cap, plus $363/yr renewal' },
];

// Age-65+ share of Kentucky's population over time (magnitude / change over time,
// single gold hue; last bar is a projection, visually distinguished).
const AGING: { year: string; pct: number; proj?: boolean }[] = [
  { year: '2010', pct: 13.3 },
  { year: '2020', pct: 17.0 },
  { year: '2024', pct: 18.1 },
  { year: '2030', pct: 20.0, proj: true },
];

export function KentuckyMarketReport({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className={`kr${embedded ? ' kr--embedded' : ''}`}>
      <style>{CSS}</style>
      {!embedded && <Nav />}

      <section className="kr-hero">
        <div className="kr-hero__in">
          <div className="kr-kick">TIG Research · Kentucky Medicare Market Report</div>
          <h1 className="kr-h1">The Kentucky Medicare market, and the opening for agents in 2026</h1>
          <p className="kr-lead">
            Nearly a million Kentuckians are on Medicare, the population is aging fast, and it is one
            of the least healthy senior populations in the country. It is also in real disruption:
            plans are exiting, carriers are cutting commissions, and Kentucky just posted a rare drop
            in Medicare Advantage enrollment. Here is the data, and what it means if you sell Medicare
            here.
          </p>
          <div className="kr-byline">Compiled by Tyler Insurance Group · July 2026 · Public sources, cited below</div>
        </div>
      </section>

      <section className="kr-stats">
        {STATS.map((s, i) => (
          <div className="kr-stat" key={i}>
            <div className="kr-stat__big">{s.big}</div>
            <div className="kr-stat__label">{s.label}</div>
            <div className="kr-stat__foot">{s.foot}</div>
          </div>
        ))}
      </section>

      <article className="kr-wrap">
        <section className="kr-sec">
          <div className="kr-eyebrow">The bottom line</div>
          <h2 className="kr-h2">A big, aging, under-served market in the middle of change</h2>
          <p className="kr-p">
            Kentucky is not a flashy Medicare market. It is a large and steadily growing one, with an
            older-than-average, sicker-than-average population that genuinely needs help navigating
            its choices. And in 2026 those choices are shifting under people's feet. For an agent who
            shows up prepared and sticks around, that combination is opportunity. For one who does
            not, it is noise. This report lays out both sides.
          </p>
        </section>

        <section className="kr-sec">
          <h2 className="kr-h2">The market: nearly a million strong, and aging fast</h2>
          <p className="kr-p">
            About 900,000 Kentuckians are enrolled in Medicare with full Part A and B coverage, out of
            a state of roughly 4.5 million. More than 470,000 of them get their coverage through a
            Medicare Advantage plan, and another 360,000-plus carry a standalone Part D drug plan.
            Roughly 213,000 hold a Medicare Supplement. This is a deep, established market, not a
            frontier.
          </p>
          <p className="kr-p">
            It is also growing in the most durable way possible: demographically. The share of
            Kentuckians age 65 and older has climbed steadily for over a decade, and the state
            projects that one in five residents will be 65 or older by 2030.
          </p>

          <figure className="kr-fig">
            <figcaption className="kr-figcap">Share of Kentucky's population age 65 and older</figcaption>
            <div className="kr-bars">
              {AGING.map((d) => (
                <div className="kr-barrow" key={d.year}>
                  <div className="kr-baryear">{d.year}{d.proj ? ' (proj.)' : ''}</div>
                  <div className="kr-bartrack">
                    <div
                      className={`kr-bar${d.proj ? ' kr-bar--proj' : ''}`}
                      style={{ width: `${(d.pct / 20) * 100}%` }}
                    >
                      <span className="kr-barval">{d.pct.toFixed(1).replace('.0', '')}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="kr-fignote">
              Sources: US Census / Kentucky Lantern (2010, 2020), America's Health Rankings (2024),
              Kentucky Center for Economic Policy (2030 projection).
            </div>
          </figure>

          <p className="kr-p">
            Where are the seniors? Two different answers, and both matter. By percentage, the oldest
            counties are small and rural, mostly in western Kentucky (Robertson County leads at about
            26 percent age 65-plus). By sheer number, the seniors are in the metros: Louisville
            (Jefferson), Lexington (Fayette), and Northern Kentucky. And Appalachian eastern Kentucky
            is aging faster than the rest of the state. A book built only in one metro leaves most of
            the state uncovered.
          </p>
        </section>

        <section className="kr-sec">
          <h2 className="kr-h2">A population that actually needs an agent</h2>
          <p className="kr-p">
            Kentucky ranks 46th of 50 states for senior health in the 2025 America's Health Rankings
            Senior Report. Only West Virginia has more residents living with multiple chronic
            conditions. And about 14 percent of Kentucky's Medicare population qualified through
            disability rather than age, roughly 145,000 people, above the national share of around 12
            percent.
          </p>
          <p className="kr-p">
            Read that as demand, not just hardship. A sicker, more complex population makes more
            plan-fit mistakes on its own, leans harder on drug coverage and provider networks, and
            benefits more from someone who knows the difference between plans. Kentucky is also a
            Medicaid expansion state with a large dual-eligible population, which makes Dual-Eligible
            Special Needs Plans (D-SNPs) a meaningful and growing part of the market here. This is a
            place where expertise is worth something.
          </p>
        </section>

        <section className="kr-sec">
          <h2 className="kr-h2">The Medicare Advantage picture</h2>
          <p className="kr-p">
            About 55 percent of Kentucky's Medicare beneficiaries are in a Medicare Advantage plan,
            in line with the national average of roughly 55 percent for 2026. The average Kentucky
            beneficiary can choose from around 28 MA plans. Humana, headquartered in Louisville, is
            one of the most-enrolled carriers in the state, alongside UnitedHealthcare and Aetna.
          </p>
          <p className="kr-p">
            Note the group-plan wrinkle if you compare sources: Kentucky has an unusually high share
            of employer-group MA enrollment, so figures that count only individual-market plans
            (you will see numbers in the low 40s) are measuring a narrower slice than the roughly 55
            percent total.
          </p>
        </section>

        <section className="kr-sec kr-sec--dark">
          <div className="kr-eyebrow kr-eyebrow--light">The timely part</div>
          <h2 className="kr-h2 kr-h2--light">2026 disruption is the opening</h2>
          <p className="kr-p kr-p--light">
            Here is what makes this a moment and not just a market. Kentucky was one of only two
            states in the country to lose Medicare Advantage enrollment year over year as of early
            2025, a drop of more than 10,000 members. The main driver was Anthem exiting Kentucky's
            D-SNP market after it lost its state Medicaid contract, which displaced dual-eligible
            members to other carriers. Meanwhile, Blue Cross (through HCSC) is expanding into Kentucky
            MA for 2026. The board is being reset.
          </p>
          <p className="kr-p kr-p--light">
            That sits on top of a national pullback. The number of MA plans offered fell about 10
            percent for 2026. Carriers cut broker commissions on an estimated 15 to 20 percent of
            plans, with some paying zero commission to discourage sales of plans they find
            unprofitable. And roughly one in ten MA enrollees, about 2.9 million people nationally,
            face a forced plan change for 2026 because their plan is ending.
          </p>
          <div className="kr-take">
            <div className="kr-take__h">What it means for an agent</div>
            <p className="kr-take__p">
              Churn is the agent's season. When plans end and benefits move, beneficiaries need
              someone to guide them, and that is exactly when a trusted agent wins and keeps clients.
              But the commission cuts are a warning too: an agent needs an FMO that steers by what is
              right for the client and sustainable for the agent, not one chasing zero-commission
              junk plans. The disruption rewards preparation and punishes the opposite.
            </p>
          </div>
        </section>

        <section className="kr-sec">
          <h2 className="kr-h2">The economics: what the work pays</h2>
          <p className="kr-p">
            Kentucky falls in the national commission tier set by CMS (the higher-paying states are
            California, New Jersey, Connecticut, Pennsylvania, and DC). So a Kentucky agent is paid,
            at street level, $694 for a new Medicare Advantage enrollment in 2026 and $725 in 2027,
            with renewals of $347 and $363 per year. Part D pays $114 new in 2026 and $130 in 2027.
          </p>
          <p className="kr-p">
            Two data points show why the book, not the new sale, is the business. Nationally, the
            share of first-time MA enrollees who used an agent or broker rose from 36 percent in 2014
            to 44 percent in 2022, and it keeps climbing. And renewals now account for about 74
            percent of all broker commissions. Beneficiaries increasingly want an agent, and the
            agents who last are the ones who keep the clients they write.
          </p>
          {!embedded && (
            <p className="kr-p">
              For the mechanics behind these numbers, see{' '}
              <RouterLink className="kr-ilink" to="/insights/how-fmo-commissions-work">how FMO commissions actually work</RouterLink>{' '}
              and{' '}
              <RouterLink className="kr-ilink" to="/insights/kentucky-medicare-commissions-2027">Medicare agent commissions in Kentucky for 2026 and 2027</RouterLink>.
            </p>
          )}
        </section>

        <section className="kr-sec">
          <h2 className="kr-h2">The takeaways</h2>
          <ul className="kr-ul">
            <li>The market is large and demographically growing. One in five Kentuckians will be 65-plus by 2030. This does not depend on the economy.</li>
            <li>The population is older and sicker than average, which raises the value of a knowledgeable agent and makes D-SNP a real segment.</li>
            <li>2026 is disrupted: a rare enrollment drop, a carrier exit, a new entrant, plan cuts, and forced disenrollments. Churn favors the prepared agent.</li>
            <li>Commission cuts mean your FMO's judgment matters. Steer by client fit and sustainable products, not by whatever pays the most this year.</li>
            <li>Renewals are the business. Beneficiaries increasingly use agents, and the book you keep is worth more than the next sale.</li>
          </ul>
        </section>

        {!embedded && (
          <section className="kr-sec kr-cta-sec">
            <div className="kr-cta">
              <h2 className="kr-ctah">Want to build in this market with people who know it?</h2>
              <p className="kr-ctap">
                We are a Kentucky-built FMO. We run in this exact market every season. If you want the
                tools, the training, and a straight partner to grow with here, let's talk.
              </p>
              <RouterLink className="kr-btn kr-btn--gold kr-btn--lg" to="/join">I'm Ready to Grow</RouterLink>
            </div>
          </section>
        )}

        <section className="kr-sec kr-methods">
          <h2 className="kr-h2">Methodology and sources</h2>
          <p className="kr-p kr-p--sm">
            This report is a synthesis of public data, compiled by Tyler Insurance Group for a Medicare
            agent audience. Figures are drawn from the sources below, using the most recent available
            release for each. Where sources measure on different bases (for example, total Medicare
            Advantage penetration versus individual-market only), we note it in the text. Some Kentucky
            figures vary by snapshot date; we have rounded and dated accordingly rather than imply a
            precision the public data does not support. Deliberately omitted: any hard count of licensed
            Kentucky agents or a measured "beneficiaries per agent" ratio, because no authoritative
            public figure exists for those. Future editions will add Tyler Insurance Group first-party
            data, including agent retention and an agent-experience survey.
          </p>
          <ul className="kr-src">
            <li>CMS Medicare Enrollment Dashboard and CY2026 / CY2027 agent-broker compensation memos (enrollment counts; commission caps; Kentucky national-tier status).</li>
            <li>KFF State Health Facts and "Medicare Advantage in 2026" (national MA penetration ~55%; plan and carrier context).</li>
            <li>healthinsurance.org "Medicare in Kentucky," citing CMS (Kentucky enrollment, MA-PD, Part D, Medigap, disability-based share).</li>
            <li>America's Health Rankings, 2024 data and 2025 Senior Report (age 65-plus share; #46 senior-health rank; chronic-condition burden).</li>
            <li>Kentucky Center for Economic Policy and Kentucky Lantern (aging projections; "one in five by 2030"; rural aging).</li>
            <li>US Census Bureau / American Community Survey (age structure; "Peak 65" national aging-in).</li>
            <li>Appalachian Regional Commission (rural share; distressed-county counts).</li>
            <li>MedPAC and the Commonwealth Fund (broker-assisted enrollment share; renewals as a share of broker commissions).</li>
            <li>Mark Farrah Associates (Kentucky year-over-year MA enrollment change).</li>
            <li>Kentucky CHFS and carrier notices (Anthem D-SNP exit; Medicaid MCO contract change; HCSC / Blue Cross 2026 entry).</li>
            <li>STAT News (citing Chapter), Johns Hopkins Bloomberg School of Public Health, Healthcare Dive (2026 plan exits; commission cuts; forced-disenrollment estimate).</li>
          </ul>
          <p className="kr-p kr-p--sm kr-disc">
            Nothing here is beneficiary marketing or plan-specific advice. It is market research for
            agents. Figures are estimates from third-party public data and are current as of the dates
            noted; verify against the primary source before relying on any single number.
          </p>
        </section>
      </article>

      {!embedded && (
        <div className="kr-foot">
          Powered by <b>Tyler Insurance Group</b> · {tig.tagline}
        </div>
      )}
    </div>
  );
}

const CSS = `
.kr{
  --em:#0E3B2E; --em2:#0a2c22; --bone:#F4F1E8; --line:#e1d9c8; --muted:#5f6b62; --ink:#16201b; --gold:#C9A84C; --gold2:#A8801F;
  font-family:'Inter',system-ui,sans-serif; background:var(--bone); color:var(--ink); -webkit-font-smoothing:antialiased; min-height:100vh; display:flex; flex-direction:column;
}
/* Embedded in the agent shell: scroll inside shell-main instead of the viewport. */
.kr--embedded{ min-height:0; flex:1 1 auto; }
.kr *{ box-sizing:border-box; }
.kr a{ text-decoration:none; }
.kr h1,.kr h2,.kr h3{ font-family:'Outfit','Inter',sans-serif; }

.kr-nav{ background:rgba(14,59,46,.96); position:sticky; top:0; z-index:50; }
.kr-nav__in{ max-width:1140px; margin:0 auto; padding:0 32px; height:66px; display:flex; align-items:center; gap:26px; }
.kr-brand{ display:flex; align-items:center; gap:10px; color:#fff; font-weight:700; font-size:15px; }
.kr-crest{ height:30px; width:auto; display:block; }
.kr-nav__lks{ display:flex; gap:24px; flex:1; margin-left:8px; }
.kr-nav__lk{ color:rgba(244,241,232,.74); font-size:14px; font-weight:500; }
.kr-nav__lk:hover{ color:#fff; }
.kr-nav__act{ display:flex; align-items:center; gap:10px; }
.kr-burger{ display:none; flex-direction:column; justify-content:center; gap:5px; width:44px; height:44px; margin-left:auto; background:none; border:none; cursor:pointer; padding:0; }
.kr-burger span{ display:block; width:22px; height:2px; background:#fff; border-radius:2px; transition:transform .25s ease, opacity .2s ease; }
.kr-burger.is-open span:nth-child(1){ transform:translateY(7px) rotate(45deg); }
.kr-burger.is-open span:nth-child(2){ opacity:0; }
.kr-burger.is-open span:nth-child(3){ transform:translateY(-7px) rotate(-45deg); }
.kr-mmenu{ display:flex; flex-direction:column; background:rgba(8,37,28,.99); border-bottom:1px solid rgba(255,255,255,.1); padding:8px 22px 22px; }
.kr-mmenu__lk{ color:rgba(244,241,232,.92); font-size:16px; font-weight:600; padding:15px 4px; border-bottom:1px solid rgba(255,255,255,.08); }
.kr-mmenu__cta{ margin-top:16px; justify-content:center; font-size:16px; padding:14px; text-align:center; }
.kr-btn{ font-size:13.5px; font-weight:700; padding:9px 15px; border-radius:9px; cursor:pointer; font-family:inherit; display:inline-block; }
.kr-btn--ghost{ color:rgba(244,241,232,.85); font-weight:600; border:1px solid rgba(244,241,232,.25); padding:8px 14px; }
.kr-btn--gold{ background:linear-gradient(135deg,#e7cf86,var(--gold2)); color:var(--em); }
.kr-btn--lg{ font-size:16px; padding:14px 26px; }

.kr-hero{ background:linear-gradient(150deg,#13503c,#0a2c22); color:var(--bone); }
.kr-hero__in{ max-width:840px; margin:0 auto; padding:58px 32px 48px; }
.kr-kick{ font-size:12px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--gold); margin-bottom:14px; }
.kr-h1{ font-size:clamp(28px,4.2vw,44px); font-weight:800; letter-spacing:-.02em; line-height:1.12; margin:0 0 18px; }
.kr-lead{ font-size:17px; line-height:1.7; color:rgba(244,241,232,.9); max-width:720px; margin:0 0 16px; }
.kr-byline{ font-size:13px; color:rgba(244,241,232,.62); }

.kr-stats{ max-width:1140px; width:100%; margin:0 auto; padding:34px 32px 6px; display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
.kr-stat{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:20px 18px; text-align:left; }
.kr-stat__big{ font-family:'Outfit'; font-size:clamp(26px,3vw,34px); font-weight:800; color:var(--gold2); line-height:1; letter-spacing:-.02em; }
.kr-stat__label{ font-size:13px; font-weight:600; color:var(--ink); margin:9px 0 6px; line-height:1.35; }
.kr-stat__foot{ font-size:11px; color:var(--muted); line-height:1.4; }

.kr-wrap{ max-width:780px; width:100%; margin:0 auto; padding:34px 32px 20px; flex:1; }
.kr-sec{ margin-bottom:42px; }
.kr-eyebrow{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--gold2); margin-bottom:8px; }
.kr-eyebrow--light{ color:var(--gold); }
.kr-h2{ font-family:'Outfit'; font-size:clamp(21px,2.6vw,27px); font-weight:700; letter-spacing:-.01em; margin:0 0 12px; }
.kr-h2--light{ color:var(--bone); }
.kr-p{ font-size:16px; line-height:1.72; color:#33312c; margin:0 0 14px; }
.kr-p--light{ color:rgba(244,241,232,.9); }
.kr-p--sm{ font-size:14px; line-height:1.65; }
.kr-ilink{ color:var(--gold2); font-weight:600; border-bottom:1px solid rgba(168,128,31,.35); }
.kr-ilink:hover{ border-bottom-color:var(--gold2); }

.kr-fig{ margin:20px 0 22px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px 24px; }
.kr-figcap{ font-family:'Outfit'; font-size:14px; font-weight:700; color:var(--ink); margin-bottom:16px; }
.kr-bars{ display:flex; flex-direction:column; gap:12px; }
.kr-barrow{ display:flex; align-items:center; gap:12px; }
.kr-baryear{ width:78px; flex-shrink:0; font-size:12.5px; font-weight:600; color:var(--muted); }
.kr-bartrack{ flex:1; background:rgba(14,59,46,.06); border-radius:6px; height:26px; display:flex; align-items:center; }
.kr-bar{ height:26px; border-radius:6px; background:linear-gradient(90deg,var(--gold2),var(--gold)); display:flex; align-items:center; justify-content:flex-end; min-width:44px; }
.kr-bar--proj{ background:repeating-linear-gradient(45deg,rgba(201,168,76,.85),rgba(201,168,76,.85) 7px,rgba(201,168,76,.6) 7px,rgba(201,168,76,.6) 14px); }
.kr-barval{ font-family:'Outfit'; font-size:12.5px; font-weight:800; color:var(--em); padding-right:9px; }
.kr-fignote{ font-size:11.5px; color:var(--muted); margin-top:14px; line-height:1.5; }

.kr-sec--dark{ background:linear-gradient(135deg,#10362a,#0a2c22); border-radius:18px; padding:32px 28px; position:relative; overflow:hidden; }
.kr-sec--dark:before{ content:""; position:absolute; top:-80px; right:-50px; width:280px; height:280px; background:radial-gradient(circle,rgba(201,168,76,.14),transparent 60%); }
.kr-sec--dark > *{ position:relative; }
.kr-take{ background:rgba(255,255,255,.05); border:1px solid rgba(201,168,76,.28); border-radius:12px; padding:18px 20px; margin-top:18px; position:relative; }
.kr-take__h{ font-family:'Outfit'; font-size:13px; font-weight:800; letter-spacing:.03em; text-transform:uppercase; color:var(--gold); margin-bottom:8px; }
.kr-take__p{ font-size:15px; line-height:1.65; color:rgba(244,241,232,.92); margin:0; }

.kr-ul{ margin:6px 0 0; padding:0; }
.kr-ul li{ list-style:none; display:flex; gap:11px; font-size:15.5px; line-height:1.6; margin-bottom:11px; color:#33312c; }
.kr-ul li:before{ content:""; width:8px; height:8px; margin-top:8px; border-radius:2px; background:var(--gold2); flex-shrink:0; transform:rotate(45deg); }

.kr-cta-sec{ margin-top:8px; }
.kr-cta{ background:linear-gradient(150deg,#13503c,#0a2c22); border-radius:20px; padding:42px 32px; text-align:center; color:var(--bone); }
.kr-ctah{ font-family:'Outfit'; font-size:clamp(22px,3vw,29px); font-weight:800; margin:0 0 10px; }
.kr-ctap{ font-size:16px; line-height:1.6; color:rgba(244,241,232,.88); max-width:540px; margin:0 auto 22px; }

.kr-methods{ border-top:1px solid var(--line); padding-top:26px; }
.kr-methods .kr-h2{ font-size:19px; }
.kr-src{ margin:8px 0 16px; padding:0; }
.kr-src li{ list-style:none; font-size:13px; line-height:1.55; color:var(--muted); padding-left:16px; position:relative; margin-bottom:8px; }
.kr-src li:before{ content:"–"; position:absolute; left:0; color:var(--gold2); }
.kr-disc{ color:var(--muted); font-style:italic; }

.kr-foot{ background:#0a221a; color:rgba(244,241,232,.6); text-align:center; padding:26px; font-size:13px; margin-top:auto; }
.kr-foot b{ color:var(--gold); }

@media(max-width:900px){
  .kr-stats{ grid-template-columns:repeat(2,1fr); }
}
@media(max-width:760px){
  .kr-wrap{ padding:28px 22px 16px; }
  .kr-nav__lks,.kr-nav__act{ display:none; }
  .kr-burger{ display:flex; }
  .kr-baryear{ width:66px; }
}
`;
