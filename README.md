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
צור קובץ `.env.local` (לא בגיט) עם:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

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
└── lib/                        # ממתין לחיבור Supabase

design_handoff_tech_career_2026/
├── README.md                   # מפרט עיצוב מלא + design tokens
├── App Screens.dc.html         # 14 מסכים אינטראקטיביים
└── Onboarding + Tech Exploration.dc.html
```

---

## מסכים — סטטוס

| מסך | סטטוס | הערות |
|-----|--------|-------|
| Dashboard שלבים 1-6 | ✅ מוכן | mock state, dev switcher לבדיקה |
| Bottom Nav | ✅ מוכן | UI מוכן, routes עוד ריקים |
| Login / OTP | ⏳ ממתין לישראל | תלוי Supabase Phone Auth |
| Onboarding | 🔄 הבא בתור | |
| Tech Exploration | 🔄 הבא בתור | |
| AI Chat | 🔄 הבא בתור | |
| Squad | 🔄 הבא בתור | |
| Contact / רכזת | 🔄 הבא בתור | |
| Completion | 🔄 הבא בתור | |

---

## מה צריך מישראל (Backend)

- [ ] **Supabase project** — צור פרויקט ב-supabase.com → URL + anon key → `.env.local`
- [ ] **Phone Auth** — הפעל SMS OTP ב-Supabase (Twilio/Vonage)
- [ ] **טבלאות** — הרץ את `supabase/schema.sql` (יוצר בקרוב)
- [ ] **חיבור state** — חבר `currentStage` + task completion ל-Supabase במקום mock
- [ ] **Webhooks** → Make.com (Nudge Logic לפי `docs/architecture.md`)

---

## לוג עדכונים

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
| Backend | ישראל בלבד — Supabase (לא נוגעים) |
| State כרגע | Mock מקומי בכל דף |
| ניווט | Bottom Nav: Dashboard / Chat / Squad / Contact |
| שם | techcareerly (זמני) |
| Demo user | נועה |
| Mobile | Mobile-first, max-width 390px, RTL (dir="rtl") |
| Deployment | Vercel — auto-deploy מכל push ל-master |
