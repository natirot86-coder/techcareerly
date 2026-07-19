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
│   ├── layout.tsx              # root: RTL, Noto Hebrew, viewport mobile
│   ├── page.tsx                # redirect → /dashboard
│   └── dashboard/page.tsx      # כל 6 שלבי המסע (mock state כרגע)
├── components/ui/
│   ├── MonogramBadge.tsx       # avatar עם אותיות (navy/orange/charcoal)
│   ├── Button.tsx              # primary / orange / outline
│   ├── TaskCard.tsx            # כרטיסיית משימה + progress bar
│   ├── ProgressDots.tsx        # 6 נקודות שלבים
│   ├── NavyHeader.tsx          # header כחול + ProgressDots
│   └── BottomNav.tsx           # ניווט תחתון
└── lib/
    ├── supabase.ts              # Supabase client (no-op אם אין env vars)
    └── candidate.ts             # anonymous auth + phone OTP + candidate/tasks/rankings helpers

src/app/login/page.tsx           # מסך טלפון + OTP — לא מקושר עדיין מהניווט הראשי

supabase/
└── schema.sql                   # כל הטבלאות + RLS — מריצים פעם אחת ב-SQL Editor

design_handoff_tech_career_2026/
├── README.md                   # מפרט עיצוב מלא + design tokens
├── App Screens.dc.html         # 14 מסכים אינטראקטיביים
└── Onboarding + Tech Exploration.dc.html
```

---

## מסכים — סטטוס

| מסך | סטטוס | הערות |
|-----|--------|-------|
| Dashboard שלבים 1-6 | ✅ מוכן | מחובר ל-Supabase (candidate + current_stage), dev switcher לבדיקה |
| Bottom Nav | ✅ מוכן | UI מוכן, routes עוד ריקים |
| Onboarding | ✅ מוכן | כותב ל-Supabase (`candidates`) בסיום |
| Login / OTP (`/login`) | ✅ קוד מוכן | טלפון → קוד SMS → `/dashboard`. משדרג משתמש Anonymous קיים באותו id (לא מאבד נתוני Onboarding). **ממתין**: הפעלת Phone provider + Test OTP ב-Supabase Dashboard (בתהליך אצל ישראל), ולא מקושר עדיין מהניווט הראשי |
| Tech Exploration (דירוג תחומים) | ✅ מוכן | כותב ל-Supabase (`domain_rankings`) |
| סימולציות (Data/Marketing/AI/Cyber/UX) | ✅ מוכן | UI מוכן — התקדמות עדיין לא נשמרת ל-`simulation_progress` |
| Login / OTP | ⏳ ממתין לישראל | תלוי Supabase Phone Auth — עד אז כל משתמש הוא Anonymous Auth |
| AI Chat | 🔄 הבא בתור | טבלת `chat_messages` מוכנה בסכימה |
| Squad | 🔄 הבא בתור | |
| Contact / רכזת | 🔄 הבא בתור | |
| Completion | 🔄 הבא בתור | |

---

## מה צריך מישראל (Backend)

- [x] **Supabase project** — נוצר, `.env.local` מוגדר
- [x] **הרצת schema** — `supabase/schema.sql` רץ בהצלחה (6 טבלאות + RLS), נבדק end-to-end
- [x] **Anonymous Auth** — מופעל (Authentication → Sign In / Providers)
- [ ] **Phone Auth** — קוד ה-Login מוכן (`/login`, `src/lib/candidate.ts: sendPhoneOtp/verifyPhoneOtp`). עדיין תקוע: קריאה ל-API מחזירה `phone_provider_disabled` — הטוגל "Enable phone provider" ב-Authentication → Sign In/Providers → Phone לא נשמר בפועל. בינתיים יש bypass זמני בקוד למספר בדיקה קבוע (`545603636` / קוד `12345`) שלא תלוי ב-Supabase
- [x] **קישור `/login` לניווט** — הוחלט: רק ל"משתמש חוזר" (לא ב-flow הראשי, כי Anonymous Auth כבר נותן זהות שקופה). מקושר מ-Onboarding Step0 ("כבר יש לך חשבון?") ומ-Dashboard (באנר "אבטח את החשבון שלך" למשתמשי Anonymous)
- [ ] **Webhooks** → Make.com (Nudge Logic לפי `docs/architecture.md`) — טבלאות `nudges` + `chat_messages` מוכנות, אין עדיין חיבור בפועל ל-Make.com/Monday.com
- [ ] **task-level sync** — Stage1-6 בדשבורד עדיין עם TaskCard סטטיים (הרדקודד); טבלת `tasks` מוכנה בסכימה אבל אף קומפוננטה לא קוראת/כותבת אליה
- [ ] **simulation_progress** — טבלה מוכנה בסכימה, אבל דפי הסימולציה (Data/Marketing/AI/Cyber/UX) לא כותבים אליה — כרגע ה-state שלהן רק בזיכרון, נעלם ב-refresh
- [ ] **Monday.com CRM** — אין עדיין חיבור/API key; זה מה שיהפוך נתוני `nudges`/`status` לדבר שרכזת רואה בפועל

---

## לוג עדכונים

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
| ניווט | Bottom Nav: Dashboard / Chat / Squad / Contact |
| שם | techcareerly (זמני) |
| Demo user | נועה |
| Mobile | Mobile-first, max-width 390px, RTL (dir="rtl") |
| Deployment | Vercel — auto-deploy מכל push ל-master |
