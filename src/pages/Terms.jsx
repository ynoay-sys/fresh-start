import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();
  const sections = [
    { title: "כללי", body: "Fresh Start היא פלטפורמה לניהול עסקים לעצמאים בישראל. השימוש בשירות מהווה הסכמה לתנאים אלו." },
    { title: "החתימה האלקטרונית", body: "הפלטפורמה מספקת חתימה אלקטרונית פשוטה (SES). Fresh Start אינה אחראית לתוקף המשפטי של מסמכים חתומים. מומלץ להתייעץ עם עורך דין." },
    { title: "בינה מלאכותית", body: "תכונות ה-AI מספקות הערכות בלבד ואינן ייעוץ משפטי, חשבונאי או פיננסי. Fresh Start אינה אחראית להחלטות שהתקבלו על בסיס הערכות אלו." },
    { title: "תשלומים", body: "התשלומים מעובדים דרך ספק תשלומים מאובטח. Fresh Start שומרת את פרטי העסקאות בלבד." },
    { title: "פרטיות", body: "ראה מדיניות הפרטיות שלנו בכתובת /privacy" },
    { title: "שינויים בתנאים", body: "Fresh Start שומרת לעצמה את הזכות לעדכן תנאים אלו. המשך השימוש לאחר שינוי מהווה הסכמה." },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-medium mb-6" style={{ color: "#1E5FA8" }}>
        <ChevronLeft className="w-4 h-4" />חזרה
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">תנאי שימוש</h1>
      <p className="text-xs text-gray-400 mb-8">עודכן לאחרונה: אפריל 2026</p>
      <div className="space-y-5">
        {sections.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-2">{i + 1}. {s.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}