# Handoff: "כל הדרכים מכאן" — Cyber career paths as transit signs (variant 6b)

## Overview
A single mobile screen (Hebrew, RTL) for an app that guides young Ethiopian-Israeli adults choosing a study path into tech. It answers one question — "how do you get to a first job in cyber?" — by showing three study paths as three separate transit-style line signs, stacked vertically.

The design's central idea: **the station where income starts is the hero.** A degree should stop reading as "three years with nothing" and start reading as "a year and a half until you start earning". In variant 6b this is expressed by the route line itself turning green (#059669) from the income station downwards — the message is "from here on", not a single point.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes of the intended look and behaviour, not production code to copy directly. Recreate them in the target codebase's existing environment (React, React Native, Vue, SwiftUI, native Android…) using its established patterns, component library and tokens. If no environment exists yet, pick the most appropriate framework and implement there.

`CyberLinesSign.jsx` is a working React + Tailwind implementation that can be used as-is or as a reference; pass `heroStyle="line"` for variant 6b.

## Fidelity
**High-fidelity.** Colors, type sizes, weights and pixel offsets below are final. Recreate pixel-perfectly with the codebase's own libraries.

## Screens / Views

### Screen: "כל הדרכים מכאן" (All the ways from here)
- **Purpose**: the user compares three study paths and sees, for each one, when income starts and where the path ends.
- **Layout**: single column, 390px wide, RTL, vertical scroll. Screen background `#f2ede4`, padding 24px top / 18px sides / 26px bottom. Title, then three sign cards in a flex column with 16px gap.
- **Title**: "כל הדרכים מכאן" — 26px / 900, `#1a1a1a`, 2px side padding, 18px bottom padding.

### Component: Sign card (one per path, three total)
Card: background `#fbf9f5`, radius 18px, padding 16px 18px 14px, shadow `0 6px 20px rgba(2,62,138,.07)`.
Border: `1px solid #e6e0d6`; the recommended line (קו 1) instead gets `1.5px solid <lineColor>`.

1. **Header row** (flex, align-center, gap 8px):
   - 16×16 rounded-4 square filled with the line color
   - "<badge> · <name>" — 13px / 700, line color
   - duration — 12px / 400, `#8a8177`, pushed to the far end (`margin-inline-start:auto`)
   - recommended chip (קו 1 only): "מומלץ", 10.5px / 700, line color on the line's tint, radius 10px, padding 2px 7px
2. **Destination block** (margin-top 10px, line-height 1.25):
   - "מגיעים ל" — 15px / 600, `#8a8177`, own line
   - destination — 21px / 900, `#1a1a1a`
3. **Track** (position:relative; height = lastStationY + 40, or + 74 when the last station also carries a transfer; margin-top 16px). All children absolutely positioned, offsets measured **from the right edge** (RTL):
   - **Route line**: 4px wide at `right:100`. Runs from y=6 to the income station's centre in the line color, then from the income centre to the last station's centre in green `#059669`. (This colour split is what makes 6b 6b.)
   - **"אתה כאן" row** at y=0: hollow dot (12×12, 3px border in line color, fill `#fbf9f5`) at `right:96`; chip at `right:124`, `top:-3`, background = line color, white 12px / 700, radius 4px, padding 3px 9px.
   - **Stations**: uniform 46px vertical step (schematic, not to scale), first station at y=46.
     - normal dot 12×12 hollow, centred on the line at `right:96`
     - income dot 16×16 **filled** `#059669` with a 3px `#fbf9f5` ring, at `right:94`
     - station name at `right:124`, width 206px, 17px, `top: y-5`; weight 500 normally, **900** for the terminal station and for the income station; color `#1a1a1a`, and `#059669` for the income station
   - **Income margin label**: "מכאן מרוויחים" at `right:0`, width 88px, `top: y-4`, 11.5px / 700, `#059669`, text-align to the outer edge.
   - **Transfers** (always in the margin, never on the line or in the name column): a 12px connector at `right:88`, `top: y+5`, and a label at `right:0`, width 80px, `top: y-3`, 11px, line-height 1.25.
     - incoming (מכינה, on קו 1 · קבלה): `2px solid #8a8177`, label `#5c554c`
     - outgoing (אפשר לחזור לתואר, on קו 2 · השמה): `2px solid <lineColor>`, label `#5c554c`
     - weak (מעבר חלקי לתואר, on קו 3 · השמה): `2px dashed #b9b3a8`, label `#a09889` — deliberately faint, because that transfer really is weaker than people assume
     - when the transfer sits on the income station, it is offset 30px below that row so the two margin items don't stack
4. **Note** (one short line per card, below a hairline): `border-top:1px solid #ece6dc`, padding-top 11px, 13px, `#5c554c`, line-height 1.45.

### Exact content
**קו 1 · תואר אקדמי · 3-4 שנים** (recommended, `#023e8a`, tint `#e8eef7`)
מגיעים ל: מהנדס/ת אבטחה
אתה כאן → קבלה (transfer in: "מכינה") → שנה א׳ → **משרת סטודנט** ★ income → **תואר + ניסיון** (terminal)
note: נפתח למחקר, ארכיטקטורה ותפקידים בכירים

**קו 2 · הכשרה טכנולוגית · 6 חודשים** (`#fb8500`, tint `#fff1e0`)
מגיעים ל: אנליסט/ית SOC
אתה כאן → מיון → הקורס → הסמכות → **השמה** ★ income + terminal (transfer out: "אפשר לחזור לתואר")
note: כניסה מצוינת. להתקדם למחקר צריך להמשיך ללמוד

**קו 3 · מה״ט / הנדסאי · 2-3 שנים** (`#64748b`, tint `#eef1f4`)
מגיעים ל: הנדסאי/ת מערכות ואבטחה
אתה כאן → קבלה → לימודי ערב → תעודת הנדסאי → **השמה** ★ income + terminal (transfer weak: "מעבר חלקי לתואר")
note: חזק בגופים ביטחוניים וממשלתיים

## Design rules to preserve
1. Destination is declared in the card header, above the stations — the user knows where the line goes before reading a single station.
2. "אתה כאן" sits at the top; reading downwards means moving forward in time. No arrows.
3. Transfers live in the outer margin only. The route line and the station-name column stay completely clean.
4. **Zero text density**: station rows carry a name and nothing else. Never add descriptions under stations. The only prose is the single note under each card.
5. Terminal station is marked by bold weight alone — no special graphics.
6. Uniform spacing between stations; schematic, not to scale. Duration lives in the card header instead.
7. The income station is the one deliberate exception to the quiet language: filled green dot, green station name, and the line green from there down.
8. No retro metro styling — no roundels, no 45° angles. Take the grammar, not the ornament.

## Interactions & Behavior
The reference is static. Suggested behaviour when productionising:
- Whole card tappable → path detail screen; use the codebase's standard press state (e.g. 0.97 scale or a subtle overlay), no hover states (mobile).
- Optional: on first view, animate the green segment drawing downwards from the income station (300–400ms, ease-out) once per session. Respect `prefers-reduced-motion`.
- No loading, error or form states in this screen.
- Responsive: content is designed at 390px. Scale fluidly by letting the card and name column stretch; keep the line at a fixed offset from the right edge and keep the 46px station step constant.
- Accessibility: the sign is a list — expose each line as a list with an accessible name ("קו 1, תואר אקדמי, 3-4 שנים, מגיעים ל מהנדס/ת אבטחה"), and announce the income station explicitly ("משרת סטודנט — מכאן מתחילים להרוויח"). Do not rely on color alone: the bold weight and the margin label carry the same message. Minimum tap target 44px if stations become interactive.

## State Management
None required — the screen is data-driven and stateless. Data shape (see `CyberLinesSign.jsx`):
```ts
type Station = { label: string; income?: boolean; terminal?: boolean;
                 transfer?: { text: string; mode: "in" | "out" | "weak" } };
type Line = { id: string; badge: string; name: string; duration: string;
              color: string; tint: string; destination: string;
              recommended?: boolean; note: string; stations: Station[] };
```
Props: `title`, `lines: Line[]`, `heroStyle: "dot" | "line" | "chip"` (use `"line"` for 6b).

## Design Tokens
- Colors: navy `#023e8a` (degree line) · orange `#fb8500` (bootcamp) · slate `#64748b` (practical engineer) · green `#059669` (income) · screen bg `#f2ede4` · card bg `#fbf9f5` · card border `#e6e0d6` · hairline `#ece6dc` · text `#1a1a1a` · secondary text `#5c554c` · muted `#8a8177` · faint `#a09889` · dashed transfer `#b9b3a8` · tints `#e8eef7` / `#fff1e0` / `#eef1f4`
- Type: Heebo (fallback Noto Sans Hebrew). 26/900 title · 21/900 destination · 17/500 station · 17/900 terminal & income · 15/600 "מגיעים ל" · 13/700 line badge · 13/400 note · 12/700 "אתה כאן" · 12/400 duration · 11.5/700 income label · 11/400 transfer label · 10.5/700 recommended chip
- Spacing: screen padding 24/18/26 · card padding 16/18/14 · card gap 16 · station step 46 · track top margin 16 · note padding-top 11
- Radii: card 18 · chip 4 · recommended chip 10 · color square 4 · dots 50%
- Shadow: `0 6px 20px rgba(2,62,138,.07)`
- Line geometry (from the right edge): line x 100, width 4 · dot centre 102 · station name x 124, width 206 · margin labels x 0, width 80–88 · transfer connector x 88, width 12

## Assets
None. No images, icons or SVG — every mark is a div with a background color, border or dashed border. The only external dependency is the Heebo web font (Google Fonts).

## Files
- `6b-reference.html` — the design reference: the full 390px screen, variant 6b, standalone (open in a browser)
- `CyberLinesSign.jsx` — working React + Tailwind implementation, data as props (`heroStyle="line"` = 6b)
