# Handoff: טק-קריירה 2026 — Mobile App Design

## Overview
Design for "טק-קריירה 2026", a hybrid (digital + human-coordinator) mobile web app that guides Israeli candidates (ages 20-35) through a 6-stage journey into a tech career: onboarding, in-person intake, tech-domain exploration, study-track selection, financial/logistics prep, and final registration. Hebrew, RTL, mobile-first (390px design width).

## About the Design Files
The files in this bundle are **design references built in HTML** (a "Design Component" runtime — see Files section) — interactive prototypes showing intended look, content, and behavior. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React Native, React web, Vue, native iOS/Android, etc.) using its established component patterns, state management, and libraries. If no environment/framework exists yet for this product, choose the most appropriate one and implement the designs there.

The HTML files load two small runtime scripts (`support.js`, `deck-stage.js`) that are part of the prototyping tool only — do not port these; they have no equivalent in production.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, copy, and most interaction states are final or near-final. Recreate pixel-close using the target codebase's design system/libraries, adapting only what the platform requires (e.g. native form controls, native gestures).

## Design Tokens

**Colors**
- Primary (navy): `#023e8a` — headers, primary buttons, active progress states, links
- Accent (orange): `#fb8500` — completed progress, secondary CTAs, highlights, "in progress" badges
- Background (warm cream): `#f2ede6` (page/canvas) and `#fbf9f5` (card/sheet surface)
- Text primary: `#1c1c1c`
- Text secondary: `rgba(0,0,0,.5)` to `rgba(0,0,0,.65)` depending on emphasis
- Success (task complete): `#2e7d46` text on `#eef8f0` background, border `#6fbf8a`
- Warning/pending: `#8a5000` text on `#fff6ea` background, border `#fb8500`
- Error: `#c0392b`
- Card borders: `rgba(2,62,138,.08)` to `rgba(2,62,138,.15)` (navy at low opacity)
- Dark/monogram badge fills cycle through: `#023e8a` (navy), `#fb8500` (orange), `#1c1c1c` (charcoal)

**Typography**
- Headlines: `Noto Serif Hebrew`, weight 700
- Body/UI: `Noto Sans Hebrew`, weights 400-800
- Both loaded from Google Fonts. Minimum UI text size 11.5px (meta labels), body copy 13-15px, headlines 18-24px.

**Shape & Elevation**
- Corner radius: 10-16px on cards/inputs, 28-36px on the outer phone-frame sheet
- Card style is **flat**: thin `1px` navy-tinted borders, no heavy gradients or drop shadows beyond a soft ambient shadow on the outer phone frame (`0 20px 50px rgba(2,62,138,.16)`)
- No emoji anywhere in the UI. Iconography is either a solid-color monogram badge (2 letters, white bold text on navy/orange/charcoal) or a CSS-drawn glyph (play triangle, checkmark), never a pictograph emoji or a hand-drawn SVG illustration.
- Explicitly avoided: gradient-heavy "AI slop" hero blobs, glassmorphism, circular icon-badges with emoji — an earlier exploration used a dark glassmorphism direction (see `Dashboard.dc.html` turn 3) but the **chosen final direction is the flat cream/navy/orange style** used in `App Screens.dc.html` and the final state of `Onboarding + Tech Exploration.dc.html`.

**Progress indicator pattern (used on every Dashboard stage screen)**
Row of 6 circular dots connected by a horizontal line, RTL order:
- Completed stage: filled orange dot, orange connecting line before it
- Active stage: larger dot (26px vs 22px), white fill, 2px orange border, navy number
- Upcoming stage: small dot, translucent white fill (`rgba(255,255,255,.15)`), no border
Sits inside a navy (`#023e8a`) header block with a greeting line above it and a "שלב X מתוך 6 · <stage name>" caption below.

## Screens / Views

### 1. Login (`App Screens.dc.html`, slide 01)
- **Purpose:** phone-based authentication.
- **Layout:** single column, 22px side padding. Phone-number input (RTL, right-aligned text) → navy full-width button "שלח קוד".
- **Behavior:** tapping "שלח קוד" transitions to an OTP screen: back arrow, headline "הזיני את הקוד", 6 separate single-digit boxes (LTR order, 42×52px, navy border, auto no advance logic implemented in prototype — recommend auto-focus-next on digit entry in production), navy "אימות והמשך" button, "שלח קוד חדש" resend link.
- A richer version of this same flow (with a 4-digit single field OTP and inline error state "קוד שגוי — נסי שוב") lives in `Onboarding + Tech Exploration.dc.html`; the 6-box version in `App Screens.dc.html` is the intended final pattern — reconcile to 6 discrete boxes.

### 2 & 3. Onboarding questionnaire / Tech-domain exploration (reference slides)
Slides 02-03 in `App Screens.dc.html` are placeholder pointers — the actual screens are fully built in `Onboarding + Tech Exploration.dc.html`:
- **Onboarding flow:** Login → SMS OTP verify → 3-question baseline survey (age + region select; 1-10 familiarity slider; single-select "curiosity domain" chip grid of the 9 domains below) → waiting/prep screen (confirmation headline, 60-second team video placeholder with CSS play-button, Calendly-style day/time picker that confirms an intake meeting).
- **Tech exploration ("חקר תחומים"):** 2-column grid of the 9 domains (סייבר / קוד / אוטומציות AI / דאטה / UX/UI / שיווק דיגיטלי / הטמעת AI בארגונים / רשתות / QA), each a monogram badge + label; 3 of the 9 (סייבר, קוד, אוטומציות AI) are fully built with a realistic micro-task:
  - **קוד:** a broken JS function shown in a code block; user types a free-text diagnosis; checked via keyword matching.
  - **סייבר:** 5 mock server-log lines; user taps to flag the suspicious ones; checked against a known brute-force pattern (3 correct lines).
  - **אוטומציות AI:** 4 shuffled process steps; user taps them into the correct order; checked against the canonical order.
  - The other 6 domains show a "בקרוב" (coming soon) placeholder screen.
  - Every task screen has a "בקשת עזרה" (request help) button opening a bottom sheet with two support layers: **Layer 1 — AI Co-pilot**, canned scaffolded hints (never the answer) with a "רמז נוסף" button; **Layer 2 — human escalation**, offered after 3 wrong attempts or after all hints are exhausted, showing a "מדריך/ה יצטרפו לצ'אט בקרוב · מקום X בתור" queue message.
  - A collapsible "Payload ל-Make.com / Monday.com" panel shows the live JSON that would be sent to the counselor's dashboard: `{ selectedDomain, engagementLevel, hintsUsed, wrongAttempts, learningBlockers, status, timestamp }`. This is a **UI mock of the concept only** — no real integration exists in the prototype.

### 4. Dashboard — Stage 1 (Pre-intake)
Navy header with progress dots (1 of 6, "טרום אינטייק"). Task list: "הורדת האפליקציה" (done, struck through), "מילוי שאלון בסיס" (done), "המתנה לאישור הרכזת" (pending, orange "בתהליך" badge). Dashed-border info banner: "הרכזת תיצור איתך קשר בקרוב".

### 5. Dashboard — Stage 2 (Intake)
Progress 2/6, "אינטייק". White card: "המפגש הקרוב שלך — מפגש אינטייק עם דנה · יום ב׳ 14:00" with an orange "אישור הגעה" button (toggles to "הגעה אושרה" once tapped). Below: two open tasks ("הגעה למפגש הפתיחה", "חתימה על מפת הדרכים האישית").

### 6. Dashboard — Stage 3 (Exposure)
Progress 3/6, "חשיפה". Three task cards, each with a thin progress bar: "השלמת סימולציית קוד" (100%, navy fill), "השלמת סימולציית סייבר" (60%, orange fill), "קריאה על תחום הדאטה" (0%).

### 7. Dashboard — Stage 4 (Study track)
Progress 4/6, "מסלול לימודים". Highlighted navy-tinted card: "התחום שנבחר: פיתוח Full Stack". Three open tasks: חקר מוסדות לימוד / השוואת תוכניות לימוד / מפגש שלישי עם הרכזת.

### 8. Dashboard — Stage 5 (Logistics)
Progress 5/6, "לוגיסטיקה". Three open tasks: בדיקת זכאות למלגה / הכנת מסמכים פיננסיים / יצירת קשר עם המוסד.

### 9. Dashboard — Stage 6 (Registration)
Progress 6/6, "רישום". Green success-tinted card "כמעט שם! נשאר רק צעד אחד להשלמת ההרשמה". One task: "אימות רישום סופי". Orange full-width button "העלאת אישור רישום" (file upload in production).

### 10. Completion screen
Centered, no header/progress bar. Large navy circle with an animated CSS-drawn checkmark (SVG path, stroke-dasharray draw-on animation, ~500ms). Headline "כל הכבוד, נועה!", subtext "הפכת רשמית לסטודנטית רשומה". White summary card with institution name ("מכללת הייטק צפון") and chosen track ("פיתוח Full Stack"). Navy full-width button "הצטרפות לקהילת הבוגרים".

### 11. Learning — task screen
Task title, difficulty badge (קל/בינוני/מאתגר — shown here as "בינוני" on `#fff6ea`/`#8a5000`), estimated time, description card, a `<textarea>` for submission, orange "סיימתי" button that becomes "הוגש בהצלחה" once tapped.

### 12. AI Chat (Co-pilot)
Navy header bar "AI Co-pilot". Scrollable message list: AI bubbles left-aligned (white bg, navy text, radius `14px 14px 14px 4px`), user bubbles right-aligned (navy bg, white text, radius `14px 14px 4px 14px`). Below the thread: 3 quick-reply chips ("איך בוחרים תחום?", "מה עושה מפתח Full Stack?", "כמה מרוויחים בסייבר?") that append a new user bubble when tapped, plus a text input + "שלח" send button (send is non-functional in the prototype — wire to your chat backend).

### 13. Squad — inspiration wall
Feed of flat cards, each with a monogram avatar (initials, colored badge) and one line of anonymized activity copy: "אלון השלים את שלב 3 תוך 8 ימים", "מיכל נרשמה לבוטקאמפ קוד", "12 מועמדים נמצאים כרגע בשלב החשיפה".

### 14. Contact — coordinator
Centered profile card: circular monogram avatar ("ד"), name "דנה כהן", role caption. Three equal-width action buttons: "שליחת הודעה" (navy fill), "קביעת פגישה" (white/navy outline), "התקשרות" (orange-tinted outline). Below: "היסטוריית מפגשים" — a simple two-row list of past meetings with date.

## Interactions & Behavior Summary
- All navigation in the prototype is either simple state toggles (login → OTP, intro → task, etc.) or the deck's own slide navigation (arrow keys / thumbnail rail) — **the slide-deck mechanism itself is a prototyping/reviewing convenience only** and has no equivalent in the shipped app; in production each slide is simply its own screen/route.
- Card-tap task checkboxes are visual toggles only in the prototype; wire to real task-completion state and persist server-side.
- The domain-exploration micro-tasks (code/cyber/automation) use simple client-side string/order matching — production should likely validate more robustly and log attempts for the counselor-nudge payload.
- Animations: card entrances use a 300-350ms fade+slide-up; the success checkmark uses a ~500ms stroke-draw animation; a bottom-sheet help panel slides up with the same fade+slide-up treatment; a toast confirming a mocked payload send auto-dismisses after ~2.6s.

## State Management (per screen, high level)
- **Login/OTP:** phone string, otp digits array, mode flag (phone vs otp).
- **Onboarding questionnaire:** step index (0-4), age, location, familiarity (1-10), selected curiosity domain, calendar day/slot selection, meeting-confirmed flag.
- **Tech exploration:** selected domain key, task phase (intro/task), per-task answer state (code answer string / flagged log-line ids / ordered automation steps), wrong-attempt counter, help-panel open + layer (ai/human), hints-used counter, JSON-panel open flag.
- **Dashboard per stage:** task completion booleans, meeting-arrival-confirmed flag.
- **Learning:** submission text, submitted flag.
- **AI Chat:** message list (role + text), append on quick-reply tap.

## Assets
No photographic or icon assets used — all "imagery" is either a flat CSS-drawn shape (play-button triangle, checkmark path) or a solid-color monogram badge (2-letter initials). No SVG illustrations, no stock photos. If production needs real coordinator photos, team video, or app-store badges, source those separately — the prototype uses text/shape placeholders throughout.

## Files
- `App Screens.dc.html` — the 14-screen reviewable flow (Login, Dashboard stages 1-6, completion, Learning, AI Chat, Squad, Contact). Uses `deck-stage.js` for slide navigation (prototyping tool only).
- `Onboarding + Tech Exploration.dc.html` — full onboarding flow (login/OTP/questionnaire/waiting) and the 9-domain tech-exploration flow with the 3 built micro-tasks, help panel, and JSON payload preview.
- `Dashboard.dc.html` — design-exploration file with multiple earlier directions (turns 1-4) for the Dashboard/roadmap screen, ending in the flat navy/orange "map + human intake" combined layout that became the final direction (turn 4, option "4a"). Kept for design-rationale reference; **turn 3's dark-glassmorphism direction was explored and explicitly rejected in favor of the flat style** — do not implement it.
- `deck-stage.js`, `support.js` — prototyping-tool runtime files. Do not port to production.
