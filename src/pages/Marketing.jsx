import { useState } from "react";
import { Link } from "react-router-dom";

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1E5FA8" }}>
            <span className="text-white font-bold text-xs">FS</span>
          </div>
          <span className="font-bold text-gray-900">Fresh Start | התחלה טריה</span>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">תכונות</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">תמחור</a>
          <Link to="/help" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">עזרה</Link>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">כניסה</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#1E5FA8" }}>התחל חינם ←</Link>
        </div>
        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 text-gray-600">
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3" dir="rtl">
          <a href="#features" className="block text-sm text-gray-700 py-2">תכונות</a>
          <a href="#pricing" className="block text-sm text-gray-700 py-2">תמחור</a>
          <Link to="/help" className="block text-sm text-gray-700 py-2">עזרה</Link>
          <div className="flex gap-3 pt-2">
            <Link to="/login" className="flex-1 text-center py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">כניסה</Link>
            <Link to="/register" className="flex-1 text-center py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "#1E5FA8" }}>התחל חינם</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSVG() {
  return (
    <svg width="420" height="320" viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto">
      {/* Desk */}
      <rect x="60" y="220" width="300" height="18" rx="4" fill="#E2E8F0"/>
      <rect x="90" y="238" width="12" height="50" rx="3" fill="#CBD5E1"/>
      <rect x="318" y="238" width="12" height="50" rx="3" fill="#CBD5E1"/>
      {/* Monitor */}
      <rect x="140" y="120" width="140" height="100" rx="8" fill="#1E3A5F"/>
      <rect x="148" y="128" width="124" height="84" rx="4" fill="#EAF2FB"/>
      {/* Screen content - document lines */}
      <rect x="158" y="140" width="60" height="5" rx="2" fill="#1E5FA8"/>
      <rect x="158" y="150" width="90" height="3" rx="1.5" fill="#94A3B8"/>
      <rect x="158" y="157" width="80" height="3" rx="1.5" fill="#94A3B8"/>
      <rect x="158" y="164" width="70" height="3" rx="1.5" fill="#94A3B8"/>
      <rect x="158" y="174" width="40" height="8" rx="3" fill="#1E5FA8"/>
      {/* Monitor stand */}
      <rect x="202" y="220" width="16" height="16" rx="2" fill="#94A3B8"/>
      <rect x="185" y="233" width="50" height="6" rx="2" fill="#94A3B8"/>
      {/* Documents on desk */}
      <rect x="75" y="195" width="55" height="26" rx="3" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>
      <rect x="80" y="201" width="30" height="3" rx="1" fill="#94A3B8"/>
      <rect x="80" y="207" width="40" height="2" rx="1" fill="#CBD5E1"/>
      <rect x="80" y="212" width="35" height="2" rx="1" fill="#CBD5E1"/>
      {/* Hebrew text on doc */}
      <rect x="78" y="199" width="8" height="3" rx="1" fill="#1E5FA8"/>
      {/* Second document */}
      <rect x="290" y="192" width="55" height="30" rx="3" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>
      <rect x="295" y="198" width="30" height="3" rx="1" fill="#94A3B8"/>
      <rect x="295" y="204" width="40" height="2" rx="1" fill="#CBD5E1"/>
      <rect x="295" y="209" width="35" height="2" rx="1" fill="#CBD5E1"/>
      <rect x="295" y="214" width="25" height="2" rx="1" fill="#CBD5E1"/>
      {/* Checkmark badge */}
      <circle cx="340" cy="188" r="12" fill="#1A7A4A"/>
      <path d="M334 188l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Person */}
      <circle cx="210" cy="75" r="28" fill="#FED7AA"/>
      <path d="M160 165 Q160 135 210 130 Q260 135 260 165" fill="#1E5FA8"/>
      {/* Arms */}
      <path d="M165 155 Q140 175 145 210" stroke="#FED7AA" strokeWidth="14" strokeLinecap="round"/>
      <path d="M255 155 Q280 175 275 210" stroke="#FED7AA" strokeWidth="14" strokeLinecap="round"/>
      {/* Face details */}
      <circle cx="200" cy="70" r="3" fill="#92400E"/>
      <circle cx="220" cy="70" r="3" fill="#92400E"/>
      <path d="M202 82 Q210 88 218 82" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Star decoration */}
      <circle cx="370" cy="80" r="8" fill="#FEF3C7"/>
      <text x="366" y="85" fill="#F59E0B" fontSize="10">★</text>
      <circle cx="50" cy="130" r="6" fill="#EAF2FB"/>
      <text x="46" y="134" fill="#1E5FA8" fontSize="8">✓</text>
    </svg>
  );
}

function FeatureCard({ emoji, title, description }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow" dir="rtl">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default function Marketing() {
  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-rubik)", direction: "rtl" }}>
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                🚀 פלטפורמה #1 לעצמאים בישראל
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                נהל את העסק שלך<br />
                <span style={{ color: "#1E5FA8" }}>בקלות</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                הפלטפורמה החכמה לעצמאים בישראל —
                מפתיחת עסק ועד ניהול לקוחות, הכל במקום אחד
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register"
                  className="px-6 py-3 rounded-xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: "#1E5FA8" }}>
                  התחל חינם — ללא כרטיס אשראי
                </Link>
                <a href="#features"
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-base hover:bg-gray-50 transition-colors">
                  צפה בהדגמה ←
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-4">✓ ללא כרטיס אשראי  ✓ הגדרה בדקות  ✓ בעברית מלאה</p>
            </div>
            <div className="flex justify-center">
              <HeroSVG />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">הכל שצריך לנהל עסק עצמאי</h2>
            <p className="text-gray-500">כלים חכמים שחוסכים לך זמן וכסף</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              emoji="📁"
              title="ניהול מסמכים חכם"
              description="העלה, חתום וארגן את כל מסמכי העסק שלך במקום אחד. חתימה דיגיטלית כלולה."
            />
            <FeatureCard
              emoji="🏢"
              title="פתיחת עסק מודרכת"
              description={`נדריך אותך בכל שלבי הרישום — מע"מ, מס הכנסה וביטוח לאומי — שלב אחר שלב.`}
            />
            <FeatureCard
              emoji="🤖"
              title="עוזר AI אישי"
              description="שאל כל שאלה על מסמכים, טפסים ממשלתיים ודרישות חוקיות. זמין 24/7."
            />
          </div>

          {/* Additional features row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { emoji: "👥", label: "ניהול לקוחות" },
              { emoji: "📅", label: "לוח זמנים" },
              { emoji: "📊", label: "מעקב מטרות" },
              { emoji: "🔔", label: "התראות חגים" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">{f.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">מחיר פשוט — שלם רק על מה שאתה משתמש</h2>
          <p className="text-gray-500 mb-10">בסיס חינמי לתמיד. שדרג רק כשצריך.</p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
            <div className="space-y-4">
              {[
                "✓ בסיס חינמי לתמיד",
                "✓ טפסים ממשלתיים מ-₪9",
                "✓ עוזר AI — 20 שאלות חינם",
                "✓ ניהול עד 50 מסמכים",
                "✓ ניהול לקוחות ואנשי קשר ללא הגבלה",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-base text-gray-700">
                  <span style={{ color: "#1A7A4A" }}>{item.startsWith("✓") ? "✓" : ""}</span>
                  <span>{item.replace("✓ ", "")}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/pricing"
            className="inline-flex items-center px-6 py-3 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            ראה את כל המחירים ←
          </Link>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4" style={{ backgroundColor: "#1E5FA8" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">מוכן להתחיל?</h2>
          <p className="text-blue-100 mb-8">הצטרף לאלפי עצמאים שכבר מנהלים את עסקם עם Fresh Start</p>
          <Link to="/register"
            className="inline-flex items-center px-8 py-4 rounded-xl bg-white font-bold text-base hover:bg-blue-50 transition-colors"
            style={{ color: "#1E5FA8" }}>
            התחל חינם עכשיו ←
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1E5FA8" }}>
                <span className="text-white font-bold text-xs">FS</span>
              </div>
              <div>
                <p className="text-white font-bold">Fresh Start</p>
                <p className="text-xs text-gray-500">הפלטפורמה לעצמאים בישראל</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link to="/terms" className="text-sm hover:text-white transition-colors">תנאי שימוש</Link>
              <Link to="/privacy" className="text-sm hover:text-white transition-colors">מדיניות פרטיות</Link>
              <Link to="/help" className="text-sm hover:text-white transition-colors">עזרה</Link>
              <a href="mailto:support@freshstart.co.il" className="text-sm hover:text-white transition-colors">צור קשר</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-600">כל הזכויות שמורות © Fresh Start 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}