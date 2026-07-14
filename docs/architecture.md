# ארכיטקטורה טכנית מורחבת

## סקירת המערכת

```
[מועמד] ←→ [Web App: Next.js]
                    ↕
              [Supabase DB]
                    ↕ (Webhook)
              [Make.com]
                    ↕
              [Monday.com CRM]
```

---

## Supabase — מבנה טבלאות מוצע

### `candidates`
| עמודה | סוג | תיאור |
|---|---|---|
| id | uuid | מזהה ייחודי |
| phone | text | מספר טלפון (לוגין) |
| name | text | שם מלא |
| stage | int | שלב נוכחי (1-6) |
| status | text | active / at_risk / blocked |
| created_at | timestamp | תאריך רישום |

### `tasks`
| עמודה | סוג | תיאור |
|---|---|---|
| id | uuid | מזהה ייחודי |
| candidate_id | uuid | FK → candidates |
| title | text | שם המשימה |
| stage | int | שייך לשלב מספר |
| completed | bool | האם הושלמה |
| attempts | int | מספר ניסיונות |
| completed_at | timestamp | מתי הושלמה |

### `chat_messages`
| עמודה | סוג | תיאור |
|---|---|---|
| id | uuid | מזהה ייחודי |
| candidate_id | uuid | FK → candidates |
| role | text | user / assistant |
| content | text | תוכן ההודעה |
| sentiment | text | positive / neutral / negative |
| created_at | timestamp | זמן שליחה |

---

## Make.com — Scenarios מרכזיים

### 1. Stagnation Detector
- **טריגר:** Supabase Webhook — חוסר עדכון ב-72 שעות
- **פעולה:** Claude API → ניתוח → עדכון Monday.com סטטוס ל-"At Risk"

### 2. Task Failure Handler
- **טריגר:** `tasks.attempts >= 3`
- **פעולה:** יצירת Task דחוף ב-Monday.com לרכזת

### 3. Sentiment Analyzer
- **טריגר:** הודעה חדשה ב-`chat_messages`
- **פעולה:** Claude API → ניתוח סנטימנט → אם שלילי: התרעה לרכזת

---

## Monday.com — מבנה Board

### Board: מועמדים פעילים
- **עמודות:** שם, שלב, סטטוס, רכזת אחראית, עדכון אחרון
- **סטטוסים:** חדש / פעיל / At Risk / חסום / רשום

### Board: משימות רכזות
- **עמודות:** מועמד, סוג התרעה, עדיפות, טופל
- **אוטומציה:** Nudge אוטומטי לרכזת כשנפתחת משימה דחופה

---

## Claude API — AI Co-pilot

- מודל מומלץ: `claude-sonnet-4-6`
- System prompt: מכיר את פרופיל המועמד, שלבו, ומשימותיו
- הודעות נשמרות ב-Supabase עם ניתוח סנטימנט
- ניתוח סנטימנט רץ על כל הודעת user

---

## Authentication

- Supabase Auth עם OTP בSMS (ללא סיסמה)
- המועמד מזדהה עם הטלפון שלו בלבד
