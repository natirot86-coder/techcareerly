# Handoff: "כל הדרכים מכאן" — three cyber study paths on one mobile screen (variant 7a)

## Overview
One mobile screen (Hebrew, RTL, 390×844, no scroll) for an app that guides young Ethiopian-Israeli adults choosing a study path into tech. It answers "how do you get to a first job in cyber?" by putting three study paths side by side as three vertical transit-style lines that all start from the same point — today.

Three ideas the design exists to serve:
1. **The moment income starts is the hero**, not the end of the path. A degree should stop reading as "three years with nothing".
2. **The three paths do not end in the same place.** The destination cards differ in visual weight on purpose.
3. **Line length communicates duration** — degree longest, practical engineer next, bootcamp shortest. Compressed, deliberately NOT a true time scale (a true scale would make the short path look automatically better).

Audience note: many users are first-generation higher-education students, some struggle with academic Hebrew. Clarity beats cleverness — short phrases, minimal text on the diagram.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes of the intended look and behaviour, not production code to ship. Recreate them in the target codebase's existing environment (React, React Native, Vue, SwiftUI, native Android…) using its established patterns, components and tokens. If no environment exists yet, choose the most appropriate framework and implement there.

`AllPathsScreen.jsx` is a working React + Tailwind implementation with the data as props; use it as-is or as reference.

## Fidelity
**High-fidelity.** Colors, type sizes, weights and pixel offsets below are final.

## Screens / Views

### Screen: "כל הדרכים מכאן"
- **Purpose**: compare three study paths at a glance; see for each one when income starts and where it leads.
- **Canvas**: 390×844, RTL, no scroll. Background `#f2ede4`, padding 26px top / 16px sides / 20px bottom.
- **Vertical order**: title → subtitle → "אתה כאן" band → three columns → legend.

**1. Title / subtitle**
- "כל הדרכים מכאן" — 24px / 900, `#1a1a1a`
- "שלושה מסלולים, מסך אחד." — 13px, `#5c554c`, margin-top 4px

**2. "אתה כאן" band** (shared start point for all three paths)
- Container: background `#e6e0d4`, radius 10px, padding 7px 11px, margin 14px 0 16px, flex, gap 9px, align-center
- Chip: "אתה כאן", background `#1a1a1a`, white, 11px / 700, radius 4px, padding 2px 8px
- Text: "היום · אותה נקודת התחלה", 13px / 600, `#1a1a1a`

**3. Three path columns** — flex row, `align-items:flex-start`, gap 14px, each column 110px wide.

Per column:
- **Header**: 12×12 rounded-3 square in the path color + name 13px / 900 in the path color; below it duration 10.5px `#8a8177`, with " · מומלץ" appended for the recommended path; margin-bottom 12px.
- **Track**: `position:relative`, height **300px** for all three columns (so the destination cards line up even though the lines end at different heights). Offsets are measured **from the right edge** (RTL). All children absolutely positioned.
  - Route line: 4px wide at `right:14`.
    - dotted prep segment (degree only): `border-right:4px dotted <pathColor>`, `opacity:.5`, from y=6, height 46 — dashed because not everyone needs psychometric / mechina / bagrut completion
    - solid path color from `start+6` to the optional station (or to the income station if there is none)
    - `#6ee7b7` (light green) from the optional station to the income station — earning is *possible* here
    - `#059669` from the income station to the last station — earning is *certain* here
    - 2px `#059669` at `opacity:.35` from the last station to y=286 — "you are already working"
  - Station dots, centred on the line:
    - normal: 11×11, fill `#fbf9f5`, `3px solid <pathColor>`, at `right:10.5`, `top: y+6`
    - income: 16×16, **filled** `#059669`, `3px solid #fbf9f5` ring, at `right:8`, `top: y+3`
    - optional: 14×14, fill `#fbf9f5`, `2.5px dashed #059669`, at `right:9`, `top: y+4`
  - Station label: `right:30`, width 78px, `top: y`, 12.5px, line-height 1.25. Weight 500 normally, **900** for income and terminal stations, 600 for the optional one. Color `#1a1a1a`, `#059669` for income, `#0f9f74` for optional.
    - Sub-labels are **nested inside the label block** (never absolutely positioned — names wrap to two lines):
      - income: "₪ מכאן שכר" — 10.5px / 700, margin-top 2px
      - optional: "אפשרי · כבר בשכר" — 10px / 600, `#0f9f74`, margin-top 2px
  - Prep caption (degree only): `right:30`, width 78, `top:0`, 9.5px, `#8a8177`, line-height 1.3
- **Destination card** (directly under the track): radius 12px, padding 10px 11px, `min-height:74px`.
  - recommended path: background = path color, caption `rgba(255,255,255,.75)`, role white
  - others: background = path tint, `1px solid #e6e0d6`, caption `#8a8177`, role `#1a1a1a`
  - caption "מגיעים ל" 9.5px; role 13px / 900, line-height 1.25, margin-top 2px

**4. Legend** — margin-top 14px, `border-top:1px solid #ddd5c7`, padding-top 12px, flex column gap 7px. Each row: swatch + 12px `#5c554c` text.
- filled 14px `#059669` circle → "ירוק מלא = מכאן מקבלים שכר."
- 14px circle, fill `#fbf9f5`, `2.5px dashed #059669` → "ירוק בהיר = אפשר להתחיל להרוויח כבר בזמן הלימודים."
- 14px `3px dotted #8a8177` rule → "מקווקו אפור = שלב שלא כולם צריכים."

### Exact content and station Y positions

**תואר · 3-4 שנים · מומלץ** — color `#023e8a`, tint `#e8eef7`, destination **מהנדס/ת אבטחה**
prep (dotted, height 46): "פסיכומטרי · מכינה · בגרויות"
- קבלה — y 46
- משרת סטודנט — y 120 — **optional** (dashed light-green dot, "אפשרי · כבר בשכר")
- תואר + ניסיון — y 214
- השמה — y 262 — **income** ("₪ מכאן שכר")

**הכשרה · 6 חודשים** — color `#fb8500`, tint `#fff1e0`, destination **אנליסט/ית SOC**
- מיון — y 0
- קבלה — y 30
- הקורס — y 62 (certifications are part of the course, not a separate stop)
- השמה — y 118 — **income**

**הנדסאי · 2-3 שנים** — color `#64748b`, tint `#eef1f4`, destination **הנדסאי/ת מערכות ואבטחה**
- קבלה — y 0
- תעודת הנדסאי — y 150
- השמה — y 190 — **income**

The Y values are authored per path, not generated from a step constant: they are what makes the three lines visibly different lengths in the right order.

## Interactions & Behavior
- **Each column is tappable** → opens a detail screen for that path (entry requirements, scholarships, transfers between paths, real timing). The comparison screen intentionally stays thin; depth lives in the detail screen. `onSelect(pathId)` in the reference component.
- Press state: use the codebase's standard (e.g. 0.98 scale or a 6% overlay on the column). No hover — mobile.
- Optional first-view animation: draw the green segments downwards, 300–400ms ease-out, once per session. Respect `prefers-reduced-motion`.
- No loading, error or form states.
- **Responsive**: authored at 390px. Below ~360px reduce the column gap to 10px before shrinking type. On wider screens keep the 390px measure centred rather than stretching the columns.
- **Accessibility**: expose each column as a button with a full accessible name, e.g. "תואר, 3-4 שנים, מומלץ. מקבלים שכר מהשמה. מגיעים ל מהנדס/ת אבטחה". Never rely on color alone — the ₪ sub-label and the bold weight carry the same message as the green. Tap target is the whole column (≥44px wide). Minimum on-screen text size in this design is 9.5px for the prep caption; if the platform's accessibility settings scale text, let the track height grow rather than clipping.

## State Management
Stateless and data-driven. Shape:
```ts
type Station = { label: string; y: number; income?: boolean; optional?: boolean };
type Path = { id: string; name: string; duration: string; color: string; tint: string;
              recommended?: boolean; destination: string;
              prep?: { height: number; label: string }; stations: Station[] };
```
Props: `title`, `subtitle`, `paths: Path[]`, `onSelect(pathId)`.

## Design Tokens
- Colors: navy `#023e8a` (degree) · orange `#fb8500` (bootcamp) · slate `#64748b` (practical engineer) · income green `#059669` · possible-income green `#6ee7b7` · optional-station text `#0f9f74` · screen bg `#f2ede4` · band bg `#e6e0d4` · card/dot fill `#fbf9f5` · card border `#e6e0d6` · legend hairline `#ddd5c7` · text `#1a1a1a` · secondary `#5c554c` · muted `#8a8177` · tints `#e8eef7` / `#fff1e0` / `#eef1f4`
- Type: Heebo (fallback Noto Sans Hebrew). 24/900 title · 13/400 subtitle · 13/600 band text · 13/900 path name & destination · 12.5/500–900 station · 12/400 legend · 11/700 "אתה כאן" · 10.5/400 duration · 10.5/700 "₪ מכאן שכר" · 10/600 "אפשרי · כבר בשכר" · 9.5 prep caption & "מגיעים ל"
- Spacing: screen padding 26/16/20 · band padding 7/11, margin 14/0/16 · column width 110, gap 14 · track height 300 · destination card padding 10/11, min-height 74 · legend padding-top 12, gap 7
- Radii: destination card 12 · band 10 · chip 4 · path square 3 · dots 50%
- Line geometry (from the right edge): line x 14, width 4 · dot centre x 16 · label x 30, width 78

## Assets
None. No images, icons or SVG — every mark is a div with a background, border or dashed border. Only external dependency: the Heebo web font (Google Fonts).

## Files
- `7a-reference.html` — the design reference: the complete 390×844 screen, standalone (open in a browser)
- `AllPathsScreen.jsx` — working React + Tailwind implementation, data as props, `onSelect` hook for the detail screen
- `7a-screenshot.png` — 2× capture of the reference screen (780×1688), for quick visual comparison
