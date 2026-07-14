# Techcareerly

Web App שמלווה משתתפי טק-קריירה (יוצאי אתיופיה) במסע בחירת מסלול לימודים להייטק.

---

## Stack
- **Frontend:** Next.js 16 + Tailwind CSS v4 + TypeScript
- **DB/Auth:** Supabase *(ישראל מטפל)*
- **Automation:** Make.com
- **CRM:** Monday.com
- **AI Co-pilot:** Claude API

---

## קישורים
- **Production:** https://hasifaapp.vercel.app
- **GitHub:** https://github.com/natirot86-coder/techcareerly

## התחלה מהירה

```bash
npm install
npm run dev
```

פותח על `http://localhost:3000`

---

## מבנה הפרויקט

```
src/
├── app/
│   ├── layout.tsx          # root layout: RTL, Noto Hebrew fonts
│   ├── page.tsx            # redirect → /dashboard
│   └── dashboard/page.tsx  # Dashboard כל 6 שלבים (mock state)
├── components/ui/
│   ├── MonogramBadge.tsx   # avatar עם אותיות (navy/orange/charcoal)
│   ├── Button.tsx          # primary / orange / outline
│   ├── TaskCard.tsx        # כרטיסיית משימה (done/pending/in-progress + progress bar)
│   ├── ProgressDots.tsx    # 6 נקודות שלבים עם קו מחבר
│   ├── NavyHeader.tsx      # header כחול עם greeting + ProgressDots
│   └── BottomNav.tsx       # ניווט תחתון (Dashboard/Chat/Squad/Contact)
└── lib/                    # (ריק — ממתין לישראל)
design_handoff_tech_career_2026/   # קבצי העיצוב המקוריים מ-Claude Design
```

---

## לוג עדכונים

### 2026-07-14 — סבב 2
- ✅ Tailwind v4 design tokens: navy #023e8a, orange #fb8500, cream #f2ede6
- ✅ Google Fonts: Noto Sans Hebrew + Noto Serif Hebrew
- ✅ Layout: dir="rtl", lang="he", mobile-first
- ✅ קומפוננטות: MonogramBadge, Button, TaskCard, ProgressDots, NavyHeader, BottomNav
- ✅ Dashboard: כל 6 שלבי המסע עם mock state + dev switcher
- ✅ Build עובד ללא שגיאות
- 🔄 הבא: GitHub push + Vercel deploy + מסכי Chat / Squad / Contact

### 2026-07-14 — סבב 1
- ✅ הוקם פרויקט Next.js + Tailwind v4 + TypeScript
- ✅ CLAUDE.md, PRD.md, docs/architecture.md נוצרו
- ✅ design handoff מ-Claude Design נשמר ב-design_handoff_tech_career_2026/
- ✅ README + .gitignore + git init

---

## מה צריך מישראל (Backend)
- [ ] פרויקט Supabase — URL + anon key → `.env.local`
- [ ] Phone Auth עם SMS (Twilio/Vonage דרך Supabase)
- [ ] יצירת טבלאות לפי `supabase/schema.sql` (עוד לא נוצר)
- [ ] Webhooks ל-Make.com (Nudge Logic)
- [ ] חיבור `currentStage` ו-task completion ל-Supabase במקום mock

---

## מסכים — סטטוס

| מסך | סטטוס | הערות |
|-----|--------|-------|
| Dashboard שלבים 1-6 | ✅ מוכן | mock state, dev switcher |
| Bottom Nav | ✅ מוכן | links עובדים, pages עוד לא |
| Login / OTP | ⏳ ממתין | תלוי Supabase Auth |
| Onboarding | 🔄 הבא בתור | |
| Tech Exploration | 🔄 הבא בתור | |
| AI Chat | 🔄 הבא בתור | |
| Squad | 🔄 הבא בתור | |
| Contact | 🔄 הבא בתור | |
| Completion | 🔄 הבא בתור | |

---

## החלטות שנקבעו
| נושא | החלטה |
|------|--------|
| Framework | Next.js 16, App Router |
| CSS | Tailwind v4 (tokens ב-globals.css) |
| Backend | ישראל בלבד — Supabase |
| State כרגע | Mock מקומי בכל דף |
| ניווט | Bottom Nav: Dashboard / Chat / Squad / Contact |
| שם | techcareerly (זמני) |
| Demo user | נועה |
| פריסה | Vercel (אוטומטי מ-GitHub) |
| Mobile | Mobile-first, max-width 390px, RTL |
