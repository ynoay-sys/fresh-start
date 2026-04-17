import BackButton from "../components/BackButton";

export default function Privacy() {
  const sections = [
    { title: "איסוף מידע", body: "אנו אוספים: פרטי חשבון (שם, אימייל, טלפון), מידע עסקי (שם עסק, סוג עסק), מסמכים שהעלאת, נתוני שימוש ואנליטיקה." },
    { title: "שימוש במידע", body: "המידע משמש לספק את השירות, לשפר את המוצר, ולתקשר איתך. אנו לא מוכרים מידע לצדדים שלישיים." },
    { title: "אבטחת מידע", body: "מספר תעודת זהות ופרטי בנק מוצפנים ב-AES-256. כל התקשורת מוצפנת ב-HTTPS. הנתונים מאוחסנים בישראל." },
    { title: "זכויות המשתמש", body: "יש לך זכות לעיין במידע שלך, לתקנו, ולמחוק את חשבונך. לפנייה: privacy@freshstart.co.il" },
    { title: "עוגיות", body: "אנו משתמשים ב-localStorage לשמירת העדפות ונתוני שימוש. אין שימוש בעוגיות של צדדים שלישיים." },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">מדיניות פרטיות</h1>
      <p className="text-xs text-gray-400 mb-8">עודכן לאחרונה: אפריל 2026</p>
      <div className="space-y-5">
        {sections.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-2">{i + 1}. {s.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-800 leading-relaxed">
          מדיניות זו עומדת בדרישות חוק הגנת הפרטיות הישראלי (5741-1981) ותקנות אבטחת מידע (2017).
        </p>
      </div>
    </div>
  );
}