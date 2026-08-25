# Techcareerly

Web App שמלווה משתתפי טק-קריירה (יוצאי אתיופיה) במסע בחירת מסלול לימודים להייטק.

---

## קישורים מהירים
| | |
|---|---|
| **Production** | https://hasifaapp.vercel.app |
| **GitHub** | https://github.com/natirot86-coder/techcareerly |
| **Design Files** | `design_handoff_tech_career_2026/` |

---

## Stack
| שכבה | כלי | אחראי |
|------|-----|--------|
| Frontend | Next.js 16 + Tailwind v4 + TypeScript | נתי |
| DB + Auth | Supabase | **ישראל** |
| Automation | Make.com | **ישראל** |
| CRM | Monday.com | **ישראל** |
| AI Co-pilot | Claude API | שניהם |

---

## התחלה מהירה (ישראל — קרא את זה)

```bash
git clone https://github.com/natirot86-coder/techcareerly.git
cd techcareerly
npm install
npm run dev
```

פותח על `http://localhost:3000` — תראה את ה-Dashboard עם כל 6 השלבים.

### משתני סביבה
העתק את `.env.local.example` ל-`.env.local` (לא בגיט) ומלא עם הפרטים מה-Supabase project שלך:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
בלי הקובץ הזה האפליקציה עובדת ב-mock מקומי (localStorage) כרגיל — שום דבר לא נשבר.

### חיבור Supabase — שלב אחרון (ישראל)
1. צור פרויקט ב-[supabase.com](https://supabase.com) → Settings → API → העתק URL + anon key ל-`.env.local`
2. הרץ את `supabase/schema.sql` ב-SQL Editor של הפרויקט (יוצר את כל הטבלאות + RLS)
3. זהו — הדפים מתחברים אוטומטית (Onboarding, Dashboard, Explore) דרך `src/lib/candidate.ts`

הזהות של המשתמש מבוססת על **Supabase Anonymous Auth** (`auth.uid()` יציב לכל דפדפן) — כך שהנתונים כבר נשמרים אמיתית לפני שיש Phone/OTP. כשתחבר OTP אמיתי, אפשר לשדרג את אותו anonymous user בלי לאבד נתונים (Supabase identity linking).

---

## מבנה הפרויקט

```
src/
├── app/
│   ├── dashboard/page.tsx      # מרכז המסע — השלב נגזר ממה שקרה, לא מכפתור
│   ├── onboarding/page.tsx     # 6 מסכים + סיור (שמות שלבים מ-journey.ts)
│   ├── waiting/page.tsx        # מרחב ההמתנה לפגישה 1: ציר + שתי דקות + הכנה + צ'ק-אין
│   ├── contact/page.tsx        # קביעת פגישות 1/2/3 (Cal.com, בוחר לבד לפי מצב)
│   ├── paths/page.tsx          # שלב 4 — 9 מסכים
│   ├── plan/page.tsx           # שלב 5 — תוכנית, חשבון, ארון מסמכים, עדכון לרכזת
│   ├── reset/page.tsx          # מחיקת מצב מקומי לבדיקה מההתחלה
│   ├── map/                    # 3 תצוגות: תרשים · /flows מסע+צילומים · /grid
│   └── admin/                  # 4 לוחות: institutions · scholarships · courses · analytics
├── data/
│   ├── journey.ts              # מקור אמת יחיד לשמות ששת השלבים (שתי שפות)
│   ├── institutions.ts         # 69 מוסדות — מי שמלמד
│   ├── scholarships.ts         # 29 מלגות ותוכניות — מי שמממן/עוטף + דירוג שקוף
│   ├── courses.ts              # 12 קורסים = מוסד × מעטפת, מחזור נגזר מהתאריך
│   ├── meetings.ts             # שלוש הפגישות + קישורי Cal.com לכל רכז/ת
│   ├── plan.ts                 # מחולל תוכנית שלב 5 (משימות בגודל ישיבה אחת)
│   └── routes.ts / tech-professions.ts / map-flows.ts
├── components/ui/              # JourneyStrip, BottomNav, AllPaths, TrackDetail...
└── lib/candidate.ts            # Supabase: anonymous auth, tasks, simulations

supabase/migrations/001_stage4_stage5_analytics.sql  # ⚠️ ממתין להרצה
public/map-shots/               # צילומי מסך אוטומטיים ל-/map/flows ו-/map/grid
```

---

## מסכים — סטטוס (13.8.2026)

| מסך | סטטוס | הערות |
|-----|--------|-------|
| Onboarding (6 מסכים + סיור) | ✅ | RTL, חזרה בסיור, טקסט כן ("אתה קובע — לא מחכים לשיחה") |
| **מרחב ההמתנה** (`/waiting`) | ✅ | שתי הדקות נעולות עד קביעה · צ'ק-אין "איך היה?" · at-risk נאסף |
| קביעת פגישות (`/contact`) | ✅ | 3 פגישות, הדף בוחר לבד; פגישה 1 נוחתת ישר במרחב ההמתנה |
| שלב 3 — חקר תחומים | ✅ | networks+data מלאים · cyber חלקי · code חסר day/mystery/experience |
| **שלב 4** (`/paths`) | ✅ | 9 מסכים. מסך הקורסים העטופים למועמד — הבא בתור |
| **שלב 5** (`/plan`) | ✅ | תוכנית לפי חודשים, חשבון, ארון (בלי קבצים!), עדכון לרכזת |
| **4 לוחות ניהול** (`/admin/*`) | ✅ | אישור פרטני, תצוגת קריאה, פס "דורש טיפול", ייצוא JSON |
| **3 תצוגות מפה** (`/map*`) | ✅ | תרשים · מסע עם צילומים והסבר · גריד. נתי בוחר אחת |
| איפוס (`/reset`) | ✅ | לבדיקת המסע מההתחלה |
| חיבור שלבים 4–5 לסופאבייס | ⏳ | ממתין למיגרציה — הכל localStorage בינתיים |
| AI Chat / Squad | 🔄 | `chat_messages` ו-`nudges` קיימות בבסיס, לא מחוברות |

---

## מה צריך מישראל (Backend)

> ✅ **משתני הסביבה תוקנו ב-12.8.2026** — היו שמורים עם BOM ו-`\r\n`, החיבור אומת ועובד.

1. **להריץ את `supabase/migrations/001_stage4_stage5_analytics.sql`** — הדבקה אחת
   ב-SQL Editor. יוצר את טבלאות שלבים 3–5, funnel_events, ו-admin_stats()
2. **מפתח `service_role`** (לא בוואטסאפ! לא כ-`NEXT_PUBLIC_`) — נחוץ למסך
   הרכזת ול-webhook של Cal.com
3. **גישת Owner לנתי** בארגון ה-Supabase
4. **חצי שעה על `chat_messages` ו-`nudges`** — קיימות בבסיס ולא מחוברות לכלום

## לוג עדכונים

### 2026-08-24 — כל 9 התחומים מלאים · מבוא להייטק · מסך תוצאה 1a · Cal חי

- **טעימות ai/ux/marketing הושלמו** — day + מיני-פרויקט (מרפאה/גמ"ח/מספרה,
  החלטת נתי: בונים ולא מפענחים) + SCCT. מפות מסע נעולות דרך `TasteJourney`
  המשותפת. כל 9 התחומים מלאים.
- **מבוא לעולם ההייטק** החליף את סימולציית ה-AI במרחב ההמתנה — 7 כרטיסים
  בעקרון ניחוש-לפני-חשיפה, כל מספר מאומת עם מקור מוצג (רשות החדשנות 2026,
  למ"ס), שרשרת המוצר דרך Waze, AI על כל התעשייה, סיפורי בוגרים מ-ynet.
- **מסך תוצאת שלב 4 בעיצוב 1a** — רשת שוויונית עם כתר, 3 שורות השוואה
  קבועות, בחירה לא-מומלצת נמדדת (`track_choice`).
- **Cal.com רב-רכזות חי** — webhook + סוד בוורסל, אומת בהזמנת אמת; זיהוי
  רכזת לפי מייל ה-organizer; קישורי יומן פר-רכזת בסגל (מיגרציה 006).
- שעון זכאות משוחררים: מילואים פעיל = 10 שנים. 6 קורסי מחקר כישויות.

### 2026-08-11 — שלב 4 נבנה מחדש (מסלולי לימוד)

**מנוע ההמלצה**
- וטו-OR הוחלף בניקוד משוקלל. התואר מקבל יתרון בסיס וכל תיקו.
  אומת על כל 729 צירופי התשובות: **תואר עלה מ-5% ל-52%**, מה"ט 10%, הכשרה 38%
- שאלת הזמן נוסחה מחדש — מ"מתי אתה רוצה לעבוד" (משאלה שכולם עונים עליה אותו דבר)
  ל**רשת ביטחון כלכלית**, שהיא מגבלה אמיתית
- "ילדים" ו"מיקום" משפיעים על ההמלצה. קודם הן היו דקורטיביות

**מסכים חדשים** (`/paths`)
- **מסך החסמים** — כל מגבלה שהמשתמש הודה בה מקבלת מענה עם שם ותאריך שמחושב מול היום
- **כל הדרכים מכאן** — שלושה מסלולים כקווי רכבת, אורך הקו מייצג משך. רגע ההכנסה
  הוא הגיבור: הקו הופך ירוק ממנו ומטה. עיצוב 7a מ-Claude Design
- **מסך עומק לכל מסלול** — איך זה נכנס לשבוע, קבלה, מימון, מה קורה כשקשה, לאן זה מוביל
- **ערכת חקר** (אופציונלי) — למי לפנות, עם חיסון מראש מפני "אתה לא עומד בתנאים"
- **סיכום** — מפריד "לפני הפגישה" (מועדים שלא מחכים) מ"בפגישה", CTA מודע-מצב,
  ויציאה כנה של "אני צריך לחשוב"

**תוכן**
- רשימת המוסדות נכתבה מחדש ממחקר מאומת. אריאל הוסתרה (אין תשתית תמיכה לקהילה),
  קמפוס IL הוסתר (כלי העשרה, לא מסלול)
- האוניברסיטה הפתוחה עם אזהרה אדומה: 33% לא מגיעים לשנה ב׳ מול פחות מ-5% במקומות אחרים
- הוסרה קרן שלא קיימת. הוחלפה בתוכניות מאומתות
- מה"ט הועבר למקום האחרון וממוסגר לקריירה ביטחונית/ממשלתית/חומרה
- שדה `domains` לכל מוסד — UX מקבל את שנקר, לא את בן-גוריון

**תשתית**
- `src/data/institutions.ts` כמקור אמת יחיד · `/admin/institutions` לעריכה וייצוא
- `JourneyStrip` — מה הושלם / איפה אני / מה נשאר
- Vercel Analytics עם אירועי משפך, כולל נטישה ברזולוציית שאלה
- ניווט עליון לדסקטופ — קודם הניווט כולו היה ב-BottomNav שמוסתר ב-md
- `?reset=1` ו-`?demo=1&phase=X` לסקירה בלי לעבור את כל הזרימה

### 2026-07-19 — Supabase foundation
- ✅ `@supabase/supabase-js` הותקן
- ✅ `supabase/schema.sql` — candidates, tasks, domain_rankings, simulation_progress, chat_messages, nudges + RLS מלא
- ✅ `src/lib/supabase.ts` + `src/lib/candidate.ts` — client + helpers, כולל Anonymous Auth
- ✅ Onboarding, Dashboard, Explore מחוברים ל-Supabase (fallback ל-mock אם אין `.env.local`)
- ⏳ נשאר לישראל: יצירת הפרויקט האמיתי + הרצת ה-schema (ה-CLI לא זמין כאן, צריך supabase.com)

### 2026-07-14 — סבב 3
- ✅ GitHub repo הוקם: `natirot86-coder/techcareerly`
- ✅ Vercel production: https://hasifaapp.vercel.app
- ✅ ישראל (Israelman) הוזמן כ-collaborator
- ✅ README מלא + מסמכים מעודכנים

### 2026-07-14 — סבב 2
- ✅ Tailwind v4 design tokens (navy, orange, cream)
- ✅ Google Fonts: Noto Sans Hebrew + Noto Serif Hebrew
- ✅ קומפוננטות: MonogramBadge, Button, TaskCard, ProgressDots, NavyHeader, BottomNav
- ✅ Dashboard: כל 6 שלבי המסע עם mock state
- ✅ Viewport מוגדר למובייל (iOS + אנדרואיד)

### 2026-07-14 — סבב 1
- ✅ Next.js 16 + Tailwind v4 + TypeScript
- ✅ CLAUDE.md, PRD.md, docs/architecture.md
- ✅ design handoff מ-Claude Design

---

## החלטות שנקבעו
| נושא | החלטה |
|------|--------|
| Framework | Next.js 16, App Router |
| CSS | Tailwind v4 — tokens ב-`globals.css` |
| Backend | ישראל בלבד — Supabase |
| State כרגע | Supabase (Anonymous Auth) עם fallback ל-mock מקומי כשאין `.env.local` |
| ניווט | מובייל: Bottom Nav · דסקטופ: סרגל עליון. טאב "חקר" מודע-הקשר (→ `/paths` אחרי פגישה 2) |
| עמדה | **כלי עמדה, לא ניטרלי** — ממליצים על תואר במפורש, עם המקרים הכנים שבהם הוא לא נכון |
| נתוני מוסדות | מה שלא אומת מסומן `needs-check`. לא ממציאים טלפונים או סכומים |
| שם | techcareerly (זמני) |
| Demo user | נועה |
| Mobile | Mobile-first, max-width 390px, RTL (dir="rtl") |
| Deployment | Vercel — auto-deploy מכל push ל-master |
