# אפיון טכני ותרשימי זרימה - פרויקט טק-קריירה 2026

מסמך זה מכיל את תרשימי הזרימה של המערכת. ניתן לצפות בהם גרפית ב-VS Code באמצעות התוסף Mermaid Editor.

---

## 1. תרשים המסע ההיברידי (Hybrid Journey)

תרשים זה מתאר את 6 השלבים שהמועמד עובר, מהרישום ועד להפיכתו לסטודנט.

```mermaid
graph TD
    %% שלב 1: טרום אינטייק
    A[SMS/WhatsApp לינק הזמנה] -->|הורדת האפליקציה| B[אוןבורדינג ושאלון בסיס]
    B -->|ממתין להפעלה| C{מפגש אינטייק פרונטלי}

    %% שלב 2: אינטייק חי
    C -->|רכזת מאשרת במאנדיי| D[פתיחת מפת הדרכים באפליקציה]

    %% שלב 3: חשיפה
    D --> E[חשיפה וסימולציות מקצועיות]
    E -->|ניתוח AI| F{פגישה 2: בחירת תחום}

    %% שלב 4: מסלול לימודים
    F --> G[חקר מוסדות ואפיקי לימוד]
    G --> H{פגישה 3: נעילת מסלול}

    %% שלב 5: לוגיסטיקה
    H --> I[הכנה פיננסית ומלגות]

    %% שלב 6: רישום
    I --> J[אימות רישום סופי]
    J --> K((סטודנט רשום))

    style C fill:#fb8500,stroke:#333,stroke-width:2px
    style F fill:#fb8500,stroke:#333,stroke-width:2px
    style H fill:#fb8500,stroke:#333,stroke-width:2px
    style K fill:#023e8a,stroke:#fff,stroke-width:4px,color:#fff
```

---

## 2. מבנה המסכים באפליקציה (App Architecture)

זרימת המשתמש בין המסכים השונים בתוך ה-Web App.

```mermaid
graph LR
    Start((כניסה)) --> Login[מסך הזדהות]
    Login --> Dashboard[דאשבורד: מפת הדרכים]

    Dashboard --> Learning[מרכז למידה ומשימות]
    Dashboard --> AI_Chat[צ'אט AI Co-pilot]
    Dashboard --> Squad[קיר השראה וקהילה]
    Dashboard --> Contact[קשר עם הרכזת]

    Learning -->|סיום משימה| Dashboard
    AI_Chat -->|בקשת עזרה| Learning
```

---

## 3. ארכיטקטורת נתונים (Data Flow)

איך המידע עובר מהאפליקציה של המועמד אל הרכזת במאנדיי.

```mermaid
sequenceDiagram
    participant U as מועמד (App)
    participant S as Supabase (DB)
    participant M as Make.com (Logic)
    participant C as Monday.com (CRM)

    U->>S: ביצוע משימה / עדכון פרטים
    S-->>M: Webhook Event
    M->>M: עיבוד נתונים (AI Analysis)
    M->>C: עדכון סטטוס / התרעה לרכזת
    C-->>C: הקפצת Nudge לרכזת אם יש חסם
```

---

## 4. לוגיקת ה-AI (Nudge Logic)

מתי המערכת מחליטה להקפיץ התרעה לרכזת.

| טריגר (Trigger) | פעולת ה-AI | תוצאה במאנדיי |
|---|---|---|
| חוסר פעילות > 72 שעות | זיהוי "Stagnation" | שינוי סטטוס ל-"At Risk" |
| כישלון במשימה 3 פעמים | זיהוי "Technical Barrier" | יצירת משימה דחופה לרכזת |
| מילות תסכול בצ'אט | ניתוח סנטימנט שלילי | התרעת "Manual Intervention Required" |
