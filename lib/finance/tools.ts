/**
 * Static metadata for the five calculator tools under /tools/[tool]/.
 * Kept separate from the React components so the index page, the per-tool
 * page, the search index and the content validator (run via tsx, outside
 * Next) can share a single source of truth for the ids. Keep this file free
 * of React and "server-only" imports for that reason.
 *
 * Lessons that use a tool are resolved from lesson frontmatter (`tools:`)
 * via lib/content/tool-lessons.ts rather than being hardcoded here.
 */

export type ToolId = "compound" | "dcf" | "graham" | "multiples" | "margin-of-safety";

export interface ToolMeta {
  id: ToolId;
  name_he: string;
  tagline_he: string;
  method_he: string;
  limits_he: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: "compound",
    name_he: "מחשבון ריבית דריבית",
    tagline_he: "כמה יגדל סכום שמושקע לאורך זמן, עם או בלי הפקדות חודשיות.",
    method_he:
      "המחשבון מחשב ערך עתידי לפי צבירת ריבית דריבית שנתית (מומרת לחישוב חודשי מדויק), " +
      "כולל הפקדות חודשיות קבועות. הוא מציג טבלה שנתית וגרף צמיחה.",
    limits_he:
      "החישוב מניח תשואה קבועה לאורך כל התקופה, ולא כולל מיסוי, דמי ניהול או אינפלציה. " +
      "תשואות אמיתיות בשוק ההון משתנות משנה לשנה ואינן ליניאריות.",
  },
  {
    id: "dcf",
    name_he: "מחשבון DCF (היוון תזרימי מזומנים)",
    tagline_he: "הערכת שווי דו-שלבית לפי תזרימי מזומנים חזויים וערך טרמינלי.",
    method_he:
      "המחשבון מקרין תזרים מזומנים חופשי קדימה בקצב צמיחה קבוע למספר שנים, מהוון כל " +
      "שנה לערך נוכחי, ומוסיף ערך טרמינלי (מודל גורדון) עבור כל מה שמעבר לתקופת התחזית. " +
      "בסוף מפחית חוב נטו ומחלק במספר המניות, וכולל טבלת רגישות לשיעור ההיוון והצמיחה הטרמינלית.",
    limits_he:
      "מודל DCF רגיש מאוד להנחות: שינוי קטן בשיעור ההיוון או בצמיחה הטרמינלית יכול לשנות " +
      "את השווי המחושב באופן דרמטי. יש להשתמש בו כמסגרת חשיבה ולא כתשובה מדויקת.",
  },
  {
    id: "graham",
    name_he: "מחשבון נוסחת גרהאם",
    tagline_he: "שני קיצורי דרך שמרניים לאומדן שווי הוגן: נוסחת גרהאם ונוסחת הצמיחה שלו.",
    method_he:
      "נוסחת גרהאם המקורית היא שורש של 22.5 כפול רווח למניה כפול הון עצמי למניה — אומדן " +
      "שווי שמרני לחברות יציבות. נוסחת הצמיחה המורחבת מתאימה את השווי לפי קצב צמיחה " +
      "צפוי ותשואת אג\"ח קונצרני נוכחית.",
    limits_he:
      "שתי הנוסחאות פותחו לפני עשרות שנים בסביבת ריבית שונה, ומתאימות בעיקר לחברות " +
      "רווחיות ויציבות עם הון עצמי משמעותי — ופחות לחברות טכנולוגיה, חברות הפסדיות או " +
      "חברות עם נכסים בלתי מוחשיים דומיננטיים.",
  },
  {
    id: "multiples",
    name_he: "השוואת מכפילים",
    tagline_he: "השוואת עד 4 חברות זו לצד זו לפי P/E, P/B, P/S, EV/EBITDA, P/FCF ותשואת רווח.",
    method_he:
      "לכל חברה מזינים מחיר מניה, מספר מניות, חוב נטו ונתוני רווחיות בסיסיים, והמחשבון " +
      "מחשב את כל המכפילים המקובלים ומציג אותם זה לצד זה עם סרגלים חזותיים להשוואה מהירה.",
    limits_he:
      "מכפילים משווים חברות במנותק מהבדלי צמיחה, סיכון, מבנה הון ואיכות רווחים. מכפיל " +
      "נמוך אינו בהכרח \"זול\" — ייתכן שהשוק מתמחר כך בגלל סיכון אמיתי.",
  },
  {
    id: "margin-of-safety",
    name_he: "מרווח ביטחון",
    tagline_he: "כמה זול ביחס לשווי הפנימי, ומה מחיר הקנייה המומלץ במרווח ביטחון יעד.",
    method_he:
      "בהינתן שווי פנימי מוערך ומחיר שוק, המחשבון מחשב את אחוז מרווח הביטחון בפועל, " +
      "ואת מחיר הקנייה המקסימלי כדי לעמוד ביעד מרווח ביטחון שהוגדר מראש.",
    limits_he:
      "מרווח הביטחון טוב בדיוק כמו אומדן השווי הפנימי שעליו הוא מבוסס — הוא לא מפצה על " +
      "טעות שיטתית בהערכת השווי עצמה, רק על אי-ודאות סבירה סביבה.",
  },
];

export const TOOL_IDS: ToolId[] = TOOLS.map((t) => t.id);

export function isToolId(id: string): id is ToolId {
  return (TOOL_IDS as string[]).includes(id);
}

export function getToolMeta(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id);
}

/**
 * Shared guidance shown on every calculator page: the tools work in either
 * ₪ or $ (a display choice, switched via the toggle above each calculator),
 * but all inputs to a single calculation must use the same currency.
 */
export const CURRENCY_GUIDANCE_HE =
  "כל המחשבונים תומכים בהצגה בשקל (₪) או בדולר ($) — ניתן לעבור ביניהם בכפתור מעל " +
  "כל מחשבון. זהו שינוי תצוגה בלבד, ללא המרה של הערכים שהוזנו, ולכן חשוב להזין את כל " +
  "הנתונים של אותו חישוב באותו מטבע. חברות הנסחרות בבורסות בארה\"ב (כמו רוב מניות " +
  "הטכנולוגיה הגלובליות) מדווחות את הדוחות הכספיים שלהן בדולר — ולכן עבורן יש להזין " +
  "רווח למניה (EPS), הון עצמי למניה (BVPS) ותזרים מזומנים חופשי (FCF) בדולר. חברות " +
  "הנסחרות בבורסה בתל אביב מדווחות בשקל. ערבוב בין מטבעות בתוך אותו חישוב יפגע בתוקף " +
  "התוצאה והיחסים המחושבים.";
