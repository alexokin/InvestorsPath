/**
 * Static content for the interactive company-analysis worksheet at
 * /tools/checklist/. Wording is derived from the chapter 11 "practical
 * toolkit" lessons (pre-purchase checklist, red flags, when to sell) and the
 * chapter 4 economic-moat lesson. Kept free of React so it can be imported
 * by both the client component and (later, if needed) content tooling.
 */

export type WorksheetItem = {
  id: string;
  label_he: string;
  hint_he: string;
};

export type WorksheetSection = {
  id: string;
  title_he: string;
  items: WorksheetItem[];
};

export const WORKSHEET_SECTIONS: WorksheetSection[] = [
  {
    id: "business",
    title_he: "הבנת העסק",
    items: [
      {
        id: "business-one-sentence",
        label_he: "אני יכול להסביר במשפט אחד פשוט איך החברה מרוויחה כסף",
        hint_he:
          "אם התשובה דורשת הסברים מסובכים או ניחושים, כדאי לעצור — הבנה בסיסית של מנוע הרווח היא תנאי הכרחי לכל שלב הבא.",
      },
      {
        id: "business-circle-of-competence",
        label_he: "העסק נמצא בתחום שאני מבין באמת, לא רק שמעתי עליו",
        hint_he: "השקעה מחוץ לתחום ההתמחות שלי מקשה להעריך את הסיכונים וההנחות בצורה מהימנה.",
      },
      {
        id: "business-revenue-drivers",
        label_he: "אני יודע מהם המניעים המרכזיים של ההכנסות והרווח (מוצר, לקוח, ענף)",
        hint_he: "מי הלקוחות, מה קונים ולמה, ומה עלול לשנות את זה בעתיד.",
      },
      {
        id: "business-industry-trend",
        label_he: "בדקתי לאן הענף כולו נוטה — צמיחה, שינוי טכנולוגי או תחרות מחריפה",
        hint_he: "עסק מצוין בענף מתכווץ שונה מעסק בינוני בענף צומח.",
      },
    ],
  },
  {
    id: "moat",
    title_he: "חפיר תחרותי",
    items: [
      {
        id: "moat-type-identified",
        label_he: "זיהיתי אם לחברה יש יתרון תחרותי, ומאיזה סוג מבין החמישה",
        hint_he:
          "נכסים בלתי מוחשיים (מותג, פטנט, רישיון), עלויות מעבר, אפקט רשת, יתרון עלות, או יתרון גודל יעיל.",
      },
      {
        id: "moat-durability",
        label_he: "היתרון התחרותי נראה בר-קיימא לשנים קדימה, לא רק יתרון זמני",
        hint_he: "מוט אמיתי מגן על הרווחיות באופן מבני, לא רק בזכות מזל או מחזור עסקים חיובי.",
      },
      {
        id: "moat-profitability-evidence",
        label_he: "הרווחיות (למשל ROIC) גבוהה ויציבה לאורך כמה שנים, לא רק בשנה בודדת",
        hint_he: "רווחיות עודפת עקבית לאורך זמן היא הראייה הטובה ביותר לקיומו של חפיר אמיתי.",
      },
      {
        id: "moat-competitors",
        label_he: "בדקתי מי המתחרים העיקריים ומה מונע מהם לשחוק את היתרון של החברה",
        hint_he: "אם קל למתחרה חדש להיכנס ולהשתלט על נתח שוק, החפיר עשוי להיות חלש יותר משנדמה.",
      },
    ],
  },
  {
    id: "management",
    title_he: "איכות ההנהלה",
    items: [
      {
        id: "management-communication",
        label_he: "ההנהלה תקשרה בעבר בצורה כנה עם המשקיעים, כולל בתקופות קשות",
        hint_he: "חפשו האם דוחות והודעות עבר היו כנים גם כשהתוצאות היו פחות טובות.",
      },
      {
        id: "management-capital-allocation",
        label_he: "הקצאת ההון של ההנהלה (דיבידנדים, רכישות עצמיות, רכישות חברות) הייתה הגיונית",
        hint_he: "בדקו האם רכישות עבר יצרו ערך בפועל או רק הגדילו את החברה.",
      },
      {
        id: "management-compensation",
        label_he: "מבנה התגמול של ההנהלה מיישר קו עם האינטרס של בעלי המניות לטווח ארוך",
        hint_he: "תגמול שמבוסס בעיקר על מדדים לטווח קצר עלול לעודד החלטות לא רצויות.",
      },
      {
        id: "management-related-party",
        label_he: "בדקתי בביאורים אם קיימות עסקאות בעלי עניין משמעותיות ומה תנאיהן",
        hint_he:
          "עסקאות בין החברה לבעלי שליטה, נושאי משרה או קרוביהם עלולות ליצור ניגוד עניינים.",
      },
      {
        id: "management-turnover",
        label_he: "אין חילופים תכופים או בלתי מוסברים של מנכ\"לים, סמנכ\"לי כספים או רואי חשבון",
        hint_he: "חילופים כאלה, במיוחד ללא הסבר סביר, הם דגל אדום שדורש בירור.",
      },
    ],
  },
  {
    id: "financials",
    title_he: "מאזן ותזרים",
    items: [
      {
        id: "financials-debt-survivability",
        label_he: "בדקתי את יחסי המינוף והנזילות ואת יכולת החברה לשרוד תקופה קשה",
        hint_he: "Debt/Equity, יחס שוטף ויחס כיסוי ריבית מגלים האם החברה עלולה להיקלע לקשיים במיתון.",
      },
      {
        id: "financials-cash-flow-gap",
        label_he: "השוויתי בין הרווח הנקי לתזרים המזומנים מפעילות שוטפת לאורך כמה שנים",
        hint_he:
          "פער עקבי שבו הרווח החשבונאי גבוה משמעותית מהתזרים לאורך זמן מרמז לעיתים על איכות רווחים נמוכה.",
      },
      {
        id: "financials-covenants",
        label_he: "בדקתי אם החברה קרובה להפרת התניות אשראי בהסכמי החוב שלה",
        hint_he: "הפרת התניה עלולה להוביל לדרישת פירעון מיידי ולהגבלות תפעוליות.",
      },
      {
        id: "financials-receivables",
        label_he: "החייבים לא גדלים בקצב מהיר בהרבה מקצב גידול המכירות",
        hint_he: "גידול חריג בחייבים עלול להעיד על הכרה מוקדמת מדי בהכנסה או קשיי גבייה.",
      },
    ],
  },
  {
    id: "valuation",
    title_he: "הערכת שווי ומרווח ביטחון",
    items: [
      {
        id: "valuation-range",
        label_he: "חישבתי טווח שווי סביר, לפי מכפילים והשוואה לענף או לפי מודל DCF",
        hint_he: "עדיף להתייחס לטווח שווי ולא למספר בודד — אי-הוודאות היא חלק מהותי מהתהליך.",
      },
      {
        id: "valuation-margin-of-safety",
        label_he: "קיים מרווח ביטחון משמעותי בין השווי הפנימי המוערך למחיר השוק",
        hint_he: "מרווח הביטחון הוא כרית מפני טעויות בהערכה ואי-ודאות עתידית, לא רק מחיר \"זול\" יחסית.",
      },
      {
        id: "valuation-not-priced-for-perfection",
        label_he: "המחיר הנוכחי לא כבר מגלם תרחיש אופטימי מדי לגבי הצמיחה או השוליים",
        hint_he: "אם המחיר מניח שהכול ילך מצוין, אין הרבה מרווח לטעויות.",
      },
      {
        id: "valuation-sensitivity",
        label_he: "בדקתי כמה השווי המחושב רגיש לשינוי בהנחות המרכזיות (שיעור היוון, קצב צמיחה)",
        hint_he: "שינוי קטן בהנחות יכול לשנות את השווי המחושב באופן דרמטי, במיוחד במודל DCF.",
      },
    ],
  },
  {
    id: "risks",
    title_he: "סיכונים ודגלים אדומים",
    items: [
      {
        id: "risks-thesis-written",
        label_he: "כתבתי בכתב את התזה: למה קונים, מה הציפיות, ומה יגרום לשנות את הדעה",
        hint_he: "תיעוד לפני הקנייה מאפשר בעתיד לבחון את ההחלטה בצורה הוגנת ולא בדיעבד.",
      },
      {
        id: "risks-red-flags-cumulative",
        label_he: "אין הצטברות של כמה דגלים אדומים יחד (פער תזרים-רווח, עסקאות בעלי עניין, חילופי הנהלה)",
        hint_he: "דגל בודד לא בהכרח פוסל השקעה, אך כמה דגלים יחד מצדיקים משנה זהירות משמעותית.",
      },
      {
        id: "risks-single-points-of-failure",
        label_he: "בדקתי תלות מסוכנת בספק יחיד, לקוח יחיד או רגולציה משתנה",
        hint_he: "ריכוזיות כזו עלולה לפגוע בעסק גם אם שאר הפרמטרים נראים טובים.",
      },
      {
        id: "risks-sell-criteria",
        label_he: "קבעתי מראש מה יגרום לי לשקול מכירה: שבירת התזה, הגעה לשווי הוגן, או הזדמנות עדיפה",
        hint_he: "קריטריון ברור שנקבע מראש הוא ההבדל בין מכירה מנומקת לבריחה רגשית.",
      },
    ],
  },
];

export function findItem(itemId: string): { section: WorksheetSection; item: WorksheetItem } | undefined {
  for (const section of WORKSHEET_SECTIONS) {
    const item = section.items.find((i) => i.id === itemId);
    if (item) return { section, item };
  }
  return undefined;
}

export function allItemIds(): string[] {
  return WORKSHEET_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
}
