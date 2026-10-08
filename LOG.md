# Story Studio Portal — LOG

## 2026-05-28: Fixed login loop — switched from magic links to OTP codes

### What was requested
Danielle (RCSI NeuroInsight cohort) reported being stuck in a login loop — she'd get the magic link email, click it, and get redirected back to the login page endlessly.

### Root cause
Microsoft SafeLinks (enterprise email security at RCSI) was doing full GET requests on magic link URLs in emails, consuming the one-time token before the user could click it. When the user then clicked, Supabase returned "Email link is invalid or has expired". The login page didn't display this error, so it looked like a silent loop.

Evidence from Supabase auth logs showed IPs like `178.157.100.205`, `72.145.*`, `48.209.*` consuming tokens seconds after they were sent, before Danielle's IP (`193.1.229.2`) could use them.

A secondary issue: even without scanners, the PKCE `code_verifier` cookie was not being sent to the `/auth/callback` route, causing "PKCE code verifier not found in storage" errors.

### What changed
1. **Switched login from magic links to OTP code entry** — users now get an 8-digit code emailed to them and type it on the login page. No clickable links for scanners to consume.
2. **Added `auth_logs` table** in Supabase for debugging auth issues — logs every step: check-email, callback, middleware session checks.
3. **Added logging to all auth routes** — check-email, accept-terms, direct-login, callback, middleware.
4. **Created `/auth/confirm` page** (intermediate step, kept as fallback but not used in OTP flow).
5. **Updated Supabase email template** (Magic Link) to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

### Files modified
- `app/login/page.tsx` — rewrote login flow with OTP code entry (8 digits, auto-advance, paste support)
- `app/auth/callback/route.ts` — added detailed logging
- `app/auth/confirm/page.tsx` — new intermediate confirm page (fallback)
- `app/api/auth/check-email/route.ts` — added logging
- `app/api/auth/accept-terms/route.ts` — added logging
- `app/api/auth/direct-login/route.ts` — added logging
- `lib/supabase/middleware.ts` — added logging for no-session redirects
- `lib/authLog.ts` — new shared auth logging helper

### What was verified
- OTP login tested by Jonathan — code received, entered, logged in successfully
- Danielle's participant record confirmed active (expires 2027-05-18, terms accepted)

### Open items
- Danielle needs to try the new OTP flow (she's been notified)
- The `/auth/callback` and `/auth/confirm` routes are still present but no longer part of the primary login flow — could be cleaned up later
- Supabase access token (`sbp_...`) is expired — can't update auth config via API, only via dashboard

## 2026-08-19: Drafted UCD Ag & Food Science programme summary email (Georgina Dwyer)

- **Requested:** Email to Georgina Dwyer (UCD) explaining Story Studio, its offerings and the portal, opening with proposed October morning dates.
- **Changed:** Created a branded HTML Gmail draft as a reply in the existing "Introduction - Research and storytelling" thread (msg 1a0191124f140bec). No code changes.
- **Content:** 3 episodes, 7/14/21 Oct mornings, 2 in person + 1 online, €3,500, 12–16 participants (max 20), portal access for 1 year.
- **Open risks:** Participant cap (12–16/20) was a judgement call — the Research Ireland proposal states 8–10; recent cohorts ran at 17 (TCD) and 23 (RCSI). No live portal URL included as none is confirmed in the repo.

## 2026-08-19: Created Story Studio design briefing doc

- **Requested:** Full briefing doc for Claude.ai/design covering product, audience, design style, facilitator, outcomes, wording style, slide design.
- **Created:** `Story Studio - Design Briefing.md` in the project root (11 sections).
- **Sources used:** Story_Studio_Knowledgebase.docx, story_studio_complete.docx, Research Ireland proposal PDF, Episode 3 Walkers deck (pages rendered and inspected), storystudio-web/app/globals.css brand tokens, logo PNGs.
- **Noted discrepancy:** deck navy is #0D1B4A, portal globals.css uses #0F1A3E. Briefing names #0D1B4A canonical and flags aligning the portal.

## 2026-08-19: Sourced and built client logo set

- **Requested:** Logos for the client strip in the Claude.ai/design redesign (SFI, RCSI, Trinity, UCD, Galway, MTU, Teagasc, British Council), 1:1 plus a ratio matching the design's upload boxes.
- **Created:** `Client Logos/` with colour and white-knockout sets at 800x800 (1:1) and 1040x400 (2.6:1), plus `_source/` originals, contact-sheet previews and README.
- **Verified:** every logo rendered and visually checked against the official mark; sources are the institutions' own site assets or the official Wikipedia files.
- **Open risks:** white versions are generated, not officially supplied. Teagasc and Galway sources are ~450px wide so are upscaled. Client permission for logo use may need confirming.

## 2026-08-19: Built slide-materials collage for the PRACTICE image slot

- **Requested:** Replace the stock workshop photo in the website's PRACTICE section with a collage of slide materials.
- **Created:** `Website Images/story-studio-materials-navy.png` and `-cream.png`, 3000x1260 (2.38:1, matching the image slot), plus `make-collage.py` to regenerate.
- **Built from:** real Episode 3 Walkers slides, the printable Content Tool and a worksheet page, rendered from the PDFs and composed with rotation and shadows.
- **Excluded deliberately:** the INTERVIEW QUESTIONS slide (names the client "Walkers"), the ADAPTIVE STRATEGY slide (first letter of each bullet missing in the flattened PDF), the closing RECAP slide (labels Episode 2 as "EPISODE 3").

## 2026-09-01: Session report system (block library + builder + skill)

- **Requested:** Stop retyping recurring advice. A master block library in Jonathan's language, plus a skill that turns a spoken session description into a branded PDF session report.
- **Created:** `Session Reports/SESSION-BLOCKS.md` (64 advice blocks), `build_report.py` (JSON -> branded A4 PDF via headless Chrome), `sessions/`, `out/`, bundled Montserrat and Inter, and `.claude/skills/session-report/SKILL.md`.
- **Sources mined:** 36 docs in the session notes archive, the Story Studio Knowledgebase frameworks, How to Be Interviewed.pdf, and the EURETINA media training course notes (secondary source, rewritten in Jonathan's voice, contradictions rejected).
- **Rejected from the secondary source:** "don't over-prepare", the "10% naturals / 10% no-hopers" claim (contradicts "communication is a skill, not a talent"), and all agency-specific references.
- **First output:** Maria Pobre (J&J), 6 pages, marked confidential.
- **Open item:** the intro paragraph is neutral because Jonathan has not yet said how she performed.

## 2026-09-01: María Pobre session report + tone rules

- **Verified:** name and title from J&J's own announcement of 27 Aug 2026: María Pobre, General Manager, Johnson & Johnson Innovative Medicine Ireland, Commercial Operations. Session was IIEA event prep, briefed via Ogilvy (Amy Pilgrim) and Carmel Mulroy (J&J).
- **Skill updated:** added a "who actually reads this" tone section (participant + manager + PR): support and suggest, never patronise, lead with what works, never frame a cultural or personal characteristic as a deficiency, say the development point once.
- **Blocks added:** `opening`, `humanity-pass`, `register` (70 blocks total).
- **Builder:** added optional `role` field to the masthead, two-column covered list so it stays on page one.
- **Output:** 6-page confidential report.

## 2026-09-01: Language corrections and library rewrite

- **Requested:** stop rephrasing Jonathan's advice; where a session note already covers a topic, use his exact words. Banned phrases: "land/lands/landing", "where I'd push", "that's on me", "honest/honestly" as filler.
- **Recorded:** banned-phrase list and the "use his exact sentences" rule added to the global CLAUDE.md Language section and to the session-report skill.
- **Rewritten:** 30 blocks now carry his verbatim wording from the archive and the Walkers deck (blocking and quick responses lifted from slides 30 and 31).
- **Bug found and fixed:** the first rewrite pass used re.S in a regex that then matched to end of file, so the new bodies were appended as orphan text instead of replacing the blocks. The file reported success while nothing changed. Truncated the orphans, rewrote in place with a split-on-headers approach, verified block count at 70 and checked the rendered output.
- **Report:** María Pobre intro now uses Jonathan's own sentences from his session description.

## 2026-09-01: PDF rendered blank in some viewers (Type 3 fonts)

- **Symptom:** Jonathan's viewer showed the navy masthead, swatches and the confidential chip, but no text at all.
- **Cause:** the build used variable font files (Inter[opsz,wght], Montserrat[wght]). Chrome cannot embed variable faces directly, so Skia fell back to Type 3 fonts, one object per style per page, 60+ in total. Poppler and macOS Quick Look render Type 3, other viewers draw nothing.
- **Fix:** generated static instances with fontTools (Inter Regular 400 opsz 18, Inter SemiBold 600, Montserrat ExtraBold 800) and referenced those per weight. Fonts now embed as CID TrueType, 3 faces. File size dropped from 1.5MB to 69KB.
- **Guard added:** build_report.py now runs pdffonts after every build and fails the build if any Type 3 font appears.
- **Verified in three engines:** poppler (pdftoppm), macOS PDFKit (qlmanage) and Chrome PDFium.

## 2026-09-01: Editable draft step before PDF

- **Requested:** a way to edit the notes before printing to PDF.
- **Built:** `build_report.py <session.json> --draft` writes `drafts/<date>-<name>.md`, the whole report as plain markdown (front matter, intro, covered list, every section expanded, follow up, closing). Jonathan edits it, then `build_report.py drafts/<file>.md` renders the PDF from the edited draft.
- **Also:** slugify now strips accents, so María gives maria-pobre rather than mar-a-pobre.
- **Verified:** round trip tested by editing the draft and confirming the change appeared in the PDF text layer.
- **Skill updated:** the draft is now the deliverable at step 5; the PDF is built from the draft, not the JSON. If a block edit is a general improvement, it gets copied back into SESSION-BLOCKS.md.

## 2026-09-01: Jonathan's draft edits folded back in

- **Diffed** his edited draft against the generated one and applied the changes in three places.
- **Library:** 9 blocks updated with his wording (opening, humanity check, personal stories, body language, voice, smiling, blocking, disclaimer, register). "The humanity pass" renamed "The humanity check".
- **Style guide (skill):** new section "What his edits change, every time", covering fewer and fuller paragraphs, only sections actually covered, no blanket reassurance, describe the environment not the person, never "less natural", state that a trait is not a problem then give the audience-side reason, keep conversational asides, protect the reader's autonomy with comfort-zone qualifiers.
- **Two typing slips fixed** in his draft: "Yyou" and "audience relate".
- **Printed:** 5 pages, CID TrueType fonts, Type 3 guard passed.

## 2026-09-14: RCSI Scholars cohort added to portal, closing email sent

- **Requested:** read Laura Anderson's email with participant addresses, add them to the portal, send the usual thank-you email with portal access and an explanation of what is in it.
- **Source:** Laura Anderson, 14 Sept, six addresses: RachelGrainger, gozieoffiah, clairetimon, aoife.gallagher, Fdoyle4, jenniferryan (all @rcsi.ie). Session was Friday 11 September.
- **Portal:** inserted six rows into `participants` on Supabase project fftvpz**** as cohort "RCSI Scholars 2026", organisation "RCSI", status active, expires 2027-09-14. Verified none existed beforehand and all six returned after insert. Names left null, consistent with every other cohort.
- **Verified before sending:** portal returns HTTP 200 at https://storystudio-omega.vercel.app/, and the six rows exist, so the access promised in the email is real.
- **Email sent** (not drafted, as instructed) to the six participants, cc Laura Anderson and Aileen Moon as Jonathan had promised them. Branded HTML following the established pattern, with the OTP login explained, the three episodes, the six tools and the downloads.
- **Open risks:** no cohort Dropbox folder link was included, as none exists for this group. The portal's own downloads cover the handbook, worksheet and Content Tool.

## 2026-09-23: Academic brochure (HTML draft)

- **Requested:** rebuild the 2023 Story Studio brochure for an academic audience, in the current brand system, portal instead of PDF handbook, his original brochure wording.
- **Built:** `Brochure/Story Studio for Researchers.html` (9 A4 pages, Montserrat/Inter static fonts, assets in `Brochure/assets/`). Added a learning outcomes page and "at a glance" table. New pricing: €4,500 for up to 22, one day in person or two days online.
- **Testimonials:** mined from Gmail (read only). Only Catriona Boyle (Teagasc) and Lydia Lynch are cleared for public use; Goljanek-Whysall, O'Meara and Offiah came from private emails and need permission.
- **Open:** awaiting approval before printing to PDF.
- **Later same day:** switched to Montserrat throughout (embedded in the HTML), replaced the stat boxes with the 8 years / 1,200+ / 40+ / 30+ / 700+ Research Ireland sentence, rewrote learning outcomes in formal descriptor style, updated delivery to one day in person or blended (1 x 3hr in person + 2 x 2.5hr online), replaced bio with Jonathan's newer bio verbatim plus a credentials strip (Futureproof, Ten Things, SCI:COM, POI2 Governance Committee, SMC Ireland advisory board). Still awaiting approval, evaluation files, and a decision on formalising the other headings.
- **Evaluations read:** Teagasc Aug 2022 survey (5 responses) and UCD Conway Sept 2024 form (10 responses). CPO-CY05625 PDF is a UCD purchase order, not feedback. Added a Conway evaluation panel (9/10 recommend, 9/10 trainer 5/5, 10/10 prefer multi-session) to the testimonials page. One Conway respondent criticised a Repeal-the-8th remark as partisan; flagged to Jonathan privately.
- **Evaluations anonymised** (no institution named). **Recognition panel** added under the bio photo: 25 awards (24 on storystudiocourse.com/kudos + IMRO Specialist Speech 2026), six Specialist Speech wins, NYF Gold, European Science TV Gold, ATU Fellowship 2022. Removed the outdated '11 awards' line.
- **Fees** now per participant: €220 (group of 22) to €450 (minimum 6), sliding scale; €4,500 headline removed. **Delivery** wording set to Jonathan's: three sessions one week apart, online, hybrid or single full day in person (page 3 kept consistent). Recognition band expanded (ATU Fellowship, NYF three wins and a Silver, six Specialist Speech, European Science TV Gold). Images and fonts embedded in the HTML so they render in any viewer. Awaiting final approval to print PDF.
- **Printed:** 'Story Studio Brochure AC 2026.pdf' (9 pages A4, 1.7MB, Montserrat Bold/Regular embedded as CID TrueType, images 200-300 ppi). Private-email quotes now attributed by role and institution only; evaluation unattributed.

## 2026-09-23: Alt version from external feedback brief
- **Source:** ~/Downloads/brochure-update-prompt.md (buyer-focused rewrite). Applied to a copy: `Brochure/Story Studio for Researchers alt version.html` -> 'Story Studio Brochure AC 2026 alt version.pdf' (9 pages, 1.8MB). Original untouched.
- **Changed:** cover tag, page 2 headline + four buyer situations, page 3 copy and delivery (2.5hr sessions), page 4 buyer line [TO CONFIRM], page 5 benefits as moments, page 7 scale tiles + small eval note, page 8 bio cut to five sentences (Get Started With AI removed), page 9 booking CTA (storystudiocourse.com/contact-1).
- **Deviation from brief:** avoided 'land' (banned phrase).
