# זיכרון פרויקט — Techcareerly

## מצב הפרויקט
- שלב: **פיתוח פרונטאנד** (ללא בקאנד)
- Next.js + Tailwind v4 + TypeScript הוקם ✓
- GitHub: עוד לא הוקם

## שם האפליקציה
- **techcareerly** (זמני, יתעדכן)
- קהל: יוצאי אתיופיה בתוכנית טק-קריירה
- מטרה: למצוא מסלול לימודים אידיאלי להייטק

## Stack שנקבע
- **Frontend:** Next.js (App Router) + Tailwind CSS v4 + TypeScript
- **DB/Auth:** Supabase — ישראל מטפל, לא מיישמים כרגע
- **Automation:** Make.com
- **CRM:** Monday.com
- **AI:** Claude API

## החלטות שנקבעו
- בקאנד (Supabase, Auth, SMS OTP) — ישראל בלבד
- כל ה-state הוא mock מקומי לעת עתה
- Bottom Nav — כן, צריך (Dashboard / Chat / Squad / Contact)
- גישה: שלב שלב, לא הכל בבת אחת
- GitHub + README חי שמתעדכן עם כל שינוי
- דמו user: נועה

## Design Tokens (Tailwind v4 — ב-globals.css)
- Navy: #023e8a
- Orange: #fb8500
- Cream canvas: #f2ede6
- Card surface: #fbf9f5
- Success: #2e7d46 / bg #eef8f0
- Warning: #8a5000 / bg #fff6ea
- Fonts: Noto Serif Hebrew (headlines) + Noto Sans Hebrew (body)

## מסכים (14 סה"כ, לפי העיצוב ב-design_handoff_tech_career_2026/)
1. Login (phone + OTP) — בקאנד תלוי, ישראל מטפל
2. Onboarding (3 שאלות + המתנה)
3. Tech Exploration (גריד + 3 משימות + HelpPanel)
4. Dashboard שלבים 1-6
5. Learning / Task submission
6. AI Chat
7. Squad
8. Contact / רכזת
9. Completion

**מתחילים מ: Dashboard שלב 1**

## קבצים חשובים
- `PRD.md` — מקור האמת לתרשימים
- `CLAUDE.md` — הוראות לקלוד
- `docs/architecture.md` — ארכיטקטורה מורחבת
- `design_handoff_tech_career_2026/README.md` — מפרט עיצוב מלא
- `design_handoff_tech_career_2026/App Screens.dc.html` — 14 מסכים
- `design_handoff_tech_career_2026/Onboarding + Tech Exploration.dc.html`

## העדפות עבודה
- תגובות בעברית, קוד באנגלית
- שלב שלב — לא להקדים בנייה לפני אישור
- לפני כל תחילת עבודה: לשקף מה עשינו + מה הולך
- README.md מתעדכן אחרי כל שלב
