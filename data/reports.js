/* Reports (Morning / Closing) — synthesized (news via web + vault wiki; data via Bloomberg).
   Generated 2026-06-11. Data sections (indices, key events) pull from EQ_CAL at render. */
window.EQ_REPORTS = {
 morning: {
  kind: "Morning Report",
  date: "Jun 11, 2026",
  date_long: "Thursday, Jun 11, 2026",
  subtitle: "overnight (Wed close → Thu open): hot CPI/PPI, Adobe tonight, SpaceX prices today",
  sections: [
   {type: "context", title: "Market context — the relief bounce vs the macro gate",
    bullets: [
     "<b>Wednesday was a rout:</b> Dow −950 pts, with a <b>hot May CPI</b> (headline <b>4.2% YoY</b> vs 3.8% April — hottest since May 2023; core ~2.9%) and an <b>even worse PPI</b> (+1.1% m/m vs +0.7% expected → <b>6.5% YoY at wholesale</b>). Add the Iran re-escalation (fresh strikes near Hormuz). Tech/semis led the drop.",
     "<b>Today (Thu) saw an intraday bounce</b> — Nasdaq +0.8%, Dow +0.5%, S&P +0.3% — but <b>futures opened lower</b> (E-mini S&P ~−0.8%, Nasdaq-100 ~−1.1%). Read: a relief bounce on a hot-but-not-catastrophic print, not a regime change.",
     "<b>⚠️ The macro gate:</b> the 6.5% wholesale PPI is the scary print — and the <b>FOMC on Jun 16-17 (Chair Warsh's debut)</b> is the event of the month. A hot CPI/PPI into the Fed is the cleanest threat to long-duration tech multiples.",
     "<b>SpaceX (SPCX) prices TODAY</b> (debuts Friday) — <b>&gt;$100B of retail demand</b>, the largest IPO in history. Investors freeing up cash for the event = extra technical pressure on the AI complex this week.",
     "<b>My frame:</b> three liquidity tests stacked — CPI/PPI (done, hot), SpaceX (prices today / debuts Friday), FOMC (next week). The AI complex doesn't need bad news to keep de-rating; it needs these three to pass."
    ]},
   {type: "movers", title: "Pre-market movers",
    html: "<b>No reliable covered-name movers table this morning.</b> The FMP sweep (~09:40 BRT) echoed Wednesday's close (rows flagged stale), so a movers table would just replay the prior session. The aggregate picture comes from <b>futures: broad risk-off</b> (S&P −0.8% / Nasdaq −1.1%), <b>heaviest in semis and high-multiple software</b> — memory read-through via <b>Samsung/SK Hynix down sharply in Seoul</b> (MU/SNDK). Pre-open snapshot, thin; the 8:30 ET PPI open can change everything."},
   {type: "news", title: "Daily News",
    items: [
     {head: "Oracle (ORCL) — reported Q4 FY26 (record) yesterday AMC", tag: "EARNINGS", bullets: [
       "<b>Record numbers:</b> revenue <b>$19.2B (+21%)</b>, cloud <b>$9.9B (+47%)</b>, non-GAAP EPS <b>$2.11 (+24%)</b>. <b>RPO jumped to $638B</b> — incl. <b>$75B of prepaid / BYO-GPU AI hardware</b> (attacks the funding-risk leg of the bear directly). Multicloud AI Database <b>+404%</b>, Oracle's fastest-growing business ever.",
       "<b>The question isn't demand, it's funding:</b> the $638B RPO faces its first real conversion test; FY27 confirmed at ~$90B, EPS guidance raised. But <b>TTM FCF is negative (~−$24B)</b> on ~$55B capex — the financing bridge (incl. the $20B ATM) is the point. <a class='rep-link' href='#' onclick=\"openCompany('ORCL');return false\">→ ORCL Earnings Review (preliminary)</a>"
     ]},
     {head: "Adobe (ADBE) — reports TONIGHT (Q2 FY26)", tag: "EARNINGS", bullets: [
       "<b>Street ~$6.45B revenue (~+10% YoY)</b>, with a <b>$25B buyback</b> in place. The question is <b>AI monetization durability</b> (Firefly/GenAI) and whether Digital Media ARR re-accelerates vs the disruption threat from image/video models. <a class='rep-link' href='#' onclick=\"openCompany('ADBE');return false\">→ ADBE Earnings Review</a> (I'll update after the print)."
     ]},
     {head: "Broadcom (AVGO) — AI XPV financing formalized (last week)", tag: "", bullets: [
       "The <b>AI XPV</b> ($35B first tranche, Apollo + Blackstone) funds the labs' custom-XPU expansion (Anthropic >1GW; targets >20GW through 2028). <b>So-what:</b> private-credit capital carries the data-center capex, so Broadcom's XPU/networking ramp <b>doesn't depend on the labs' balance sheets</b> — supports the FY27 &gt;$100B AI semi guide; and adds one more layer of <b>circular AI financing</b> the bears will flag. (deep color already in the AVGO wiki.)"
     ]},
     {head: "SpaceX (SPCX) — two days from the biggest IPO ever", tag: "", bullets: [
       "<b>Prices today</b> (~$135 ask), <b>debuts Friday on Nasdaq</b>. Gray-market signals softer (pre-IPO futures below the ask after 3 weeks of tech selling). Large retail allocation (&gt;$100B submitted). <b>Read:</b> whatever Friday prices, the deal has already been taxing the AI tape for two weeks — the cleaner trade is what happens to the complex <i>after</i> the liquidity event clears."
     ]},
     {head: "Memory (MU / SNDK) — the complex stays heavy", tag: "", bullets: [
       "Seoul followed the chip selloff — <b>Samsung and SK Hynix dropped sharply overnight</b>; the sell-side is split between 'buying opportunity' and 'momentum damage' on Micron. <b>MU reports Jun 24</b>; the HBM super-cycle thesis gets its update then. I'd rather let the print talk than chase the bounce-fade-bounce tape."
     ]}
    ]},
   {type: "events", title: "Key events"},
  ],
  footer: "Equity Project · synthesized morning report · generated Jun 11, 2026. Market data via Bloomberg; news color synthesized (web + vault wiki); hard news cited inline."
 },

 closing: {
  kind: "Closing Report",
  date: "Jun 10, 2026",
  date_long: "Wednesday, Jun 10, 2026 (close)",
  subtitle: "the macro-gate day: hot CPI/PPI + Iran sank the tape; Oracle reported AMC",
  sections: [
   {type: "context", title: "Closing context — the gate closed hot",
    bullets: [
     "<b>Second tech-led down day:</b> <b>Dow −950 pts</b>, S&P and Nasdaq heavy. The trigger was macro: <b>May CPI at 4.2% YoY</b> (hottest since May 2023) + <b>PPI at +1.1% m/m (6.5% YoY)</b> — well above expected. Info tech (−1.8%) and energy were the red sectors; the desks' read: momentum/CTA selling + cash freed up for Friday's SpaceX IPO.",
     "<b>Iran re-escalated:</b> fresh strikes near Hormuz broke the mid-April truce — the biggest exchange since. Oil held ~$88 (no panic spike), but the 10Y edged up to ~4.53%.",
     "<b>The setup:</b> three liquidity tests stacked — CPI/PPI (today, hot), SpaceX (prices Thu / debuts Fri), FOMC (Jun 16-17, Warsh debut). The AI complex is de-rating without needing bad news."
    ]},
   {type: "news", title: "Closing — what mattered",
    items: [
     {head: "Oracle (ORCL) — reported Q4 FY26 AMC (record, but funding is the question)", tag: "EARNINGS", bullets: [
       "Revenue <b>$19.2B (+21%)</b>, cloud <b>$9.9B (+47%)</b>, RPO <b>$638B</b> (+$75B prepaid/BYO-GPU), Multicloud AI DB <b>+404%</b>. The backlog is spectacular; the <b>negative FCF (~−$24B TTM)</b> + financing bridge are the bear's point. <a class='rep-link' href='#' onclick=\"openCompany('ORCL');return false\">→ ORCL Earnings Review</a>."
     ]},
     {head: "Memory / Semis — the epicenter of the drop", tag: "", bullets: [
       "Semis led the selloff (AI multiples are the most rate/duration-sensitive). Read-through to <b>MU/SNDK</b> via Asia. The circular AI-financing narrative (Oracle BYO-GPU, Broadcom AI XPV) starts getting questioned by the bears on a risk-off day."
     ]}
    ]},
   {type: "events", title: "Key events"},
  ],
  footer: "Equity Project · synthesized closing report · generated Jun 10, 2026 (after the close). Data via Bloomberg; news color synthesized (web + wiki); hard news cited inline."
 }
};
