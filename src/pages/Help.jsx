import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import BackButton from "../components/BackButton";

const FAQ_DATA = [
  {
    section: "שאלות כלליות",
    items: [
      { q: "מהו Fresh Start?", a: "Fresh Start היא מערכת ניהול עסקי לעצמאים בישראל. המערכת מאפשרת לפתוח עסק, לנהל מסמכים, לקוחות, הזמנות ועוד — הכל במקום אחד." },
      { q: "האם Fresh Start מאושר על ידי רשות המיסים?", a: "Fresh Start היא פלטפורמה עצמאית שאינה קשורה לרשות המיסים. המערכת מדריכה אותך בתהליכים אך אינה מחליפה ייעוץ מקצועי מרואה חשבון." },
      { q: "כמה עולה השירות?", a: "הבסיס חינמי. תכונות מתקדמות זמינות בתשלום לפי שימוש. ראה את דף התמחור לפרטים נוספים." },
    ],
  },
  {
    section: "מסמכים וחתימות",
    items: [
      { q: "כיצד החתימה הדיגיטלית עובדת?", a: "Fresh Start משתמשת בחתימה אלקטרונית פשוטה (SES) — תמונת החתימה שלך מוטמעת במסמך. לצרכים משפטיים מורכבים, מומלץ להתייעץ עם עורך דין." },
      { q: "אילו סוגי קבצים נתמכים?", a: "PDF, Word (DOCX), JPG ו-PNG. גודל מקסימלי: 10MB." },
      { q: "איך בודקים אם מסמך דורש חתימה משפטית?", a: "בכל מסמך בארכיון יש כפתור \"בדוק אם נדרשת חתימה משפטית\". המערכת תנתח את המסמך ותציג אחוז סבירות. זוהי הערכת AI בלבד ואינה ייעוץ משפטי." },
    ],
  },
  {
    section: "פתיחת עסק",
    items: [
      { q: 'כיצד לפתוח תיק מע"מ?', a: 'עבור למסך "פתיחת עסק" ולחץ על "התחל מדריך" בשלב פתיחת תיק מע"מ. המערכת תדריך אותך שלב אחר שלב עם קישור ישיר לפורטל רשות המיסים.' },
      { q: "מה ההבדל בין עוסק מורשה לעוסק פטור?", a: "עוסק פטור — מחזור עד כ-₪120,000 לשנה, פטור מגביית מע\"מ מלקוחות. עוסק מורשה — מחזור מעל ₪120,000, גובה מע\"מ 17% ומגיש דוח תקופתי." },
      { q: "תוך כמה זמן צריך להירשם?", a: "תיק מע\"מ — תוך 30 יום מתחילת פעילות. ביטוח לאומי — תוך 90 יום. מס הכנסה — מיידי." },
    ],
  },
  {
    section: "פרטיות ואבטחה",
    items: [
      { q: "האם הנתונים שלי מאובטחים?", a: "כן. מספר תעודת הזהות ופרטי הבנק מוצפנים. הסיסמה שלך אינה נשמרת על ידי Fresh Start. הנתונים מאוחסנים בשרתים מאובטחים." },
      { q: "האם Fresh Start מוכר את המידע שלי?", a: "לא. Fresh Start לא מוכרת ולא משתפת מידע אישי עם צדדים שלישיים לצרכי פרסום." },
      { q: "כיצד למחוק את החשבון?", a: "עבור להגדרות ← מחיקת חשבון. שים לב כי המחיקה היא סופית ולא ניתנת לביטול." },
    ],
  },
  {
    section: "תשלומים",
    items: [
      { q: "כיצד מתבצע התשלום?", a: "התשלום מתבצע לפי שימוש בכרטיס אשראי. בגרסת הייצור יתבצע חיוב אמיתי דרך שער תשלומים מאובטח." },
      { q: "האם ניתן לקבל החזר?", a: "ניתן לפנות לתמיכה תוך 7 ימים מהתשלום לבקשת החזר בנסיבות מיוחדות." },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-3.5 text-right hover:bg-gray-50 transition-colors px-1 rounded"
      >
        <span className="text-sm font-semibold text-gray-800 text-right flex-1">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />}
      </button>
      {open && (
        <p className="text-sm text-gray-600 leading-relaxed pb-4 px-1">{a}</p>
      )}
    </div>
  );
}

export default function Help() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'עזרה | Fresh Start'; }, []);
  const [search, setSearch] = useState("");

  const q = search.toLowerCase().trim();

  const filtered = FAQ_DATA.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    ),
  })).filter(s => s.items.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">מרכז העזרה</h1>
      <p className="text-sm text-gray-500 mb-6">מצא תשובות לשאלות הנפוצות ביותר</p>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="חפש שאלה..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 mb-6 bg-white"
        dir="rtl"
      />

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">לא נמצאו תוצאות עבור "{search}"</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(section => (
            <div key={section.section} className="bg-white rounded-xl border border-gray-200 px-5 py-2">
              <h2 className="font-bold text-gray-900 text-base pt-3 pb-2 border-b border-gray-100 mb-1">{section.section}</h2>
              {section.items.map(item => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <h3 className="font-bold text-blue-900 text-base mb-1">לא מצאת תשובה?</h3>
        <p className="text-sm text-blue-700 mb-4">צור קשר עם הצוות שלנו</p>
        <a
          href="mailto:support@freshstart.co.il"
          className="inline-block px-6 py-2.5 rounded-lg text-white text-sm font-medium mb-3"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          שלח הודעה ←
        </a>
        <p className="text-xs text-blue-600">זמינים ימים א׳-ה׳, 9:00-18:00</p>
      </div>
    </div>
  );
}