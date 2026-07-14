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
├── app/           # Next.js App Router — דף לכל מסך
├── components/    # קומפוננטות משותפות
│   └── ui/        # MonogramBadge, Button, TaskCard, ProgressDots...
└── lib/           # constants, supabase client (ממתין לישראל)
design_handoff_tech_career_2026/   # קבצי העיצוב המקוריים
```

---

## לוג עדכונים

### 2026-07-14
- ✅ הוקם פרויקט Next.js + Tailwind v4
- ✅ CLAUDE.md, PRD.md, docs/architecture.md נוצרו
- ✅ design handoff מ-Claude Design נשמר
- ✅ GitHub הוקם
- 🔄 בתהליך: Tailwind tokens + קומפוננטות + Dashboard שלב 1

---

## מה צריך מישראל (Backend)
- [ ] פרויקט Supabase — URL + anon key → `.env.local`
- [ ] Phone Auth עם SMS (Twilio/Vonage דרך Supabase)
- [ ] יצירת טבלאות לפי `supabase/schema.sql`
- [ ] Webhooks ל-Make.com

---

## החלטות שנקבעו
| נושא | החלטה |
|------|--------|
| Framework | Next.js App Router |
| CSS | Tailwind v4 |
| Backend | ישראל — Supabase |
| State עכשיו | Mock מקומי |
| ניווט | Bottom Nav (Dashboard/Chat/Squad/Contact) |
| שם | techcareerly (זמני) |
| Demo user | נועה |
