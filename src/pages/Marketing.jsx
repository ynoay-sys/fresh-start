import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
        {/* Mobile hamburger + back button on mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#1E5FA8', cursor: 'pointer', fontSize: '13px', fontFamily: 'Rubik, sans-serif', padding: '4px 0', fontWeight: '500' }}
          >
            <span>→</span><span>חזור</span>
          </button>
          <button onClick={() => setMobileOpen(v => !v)} className="p-2 text-gray-600">
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
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
    <svg width="100%" viewBox="0 0 680 480" role="img" xmlns="http://www.w3.org/2000/svg" className="w-full">
      <title>הר עם מדרגות ואדם מגיע לפסגה</title>

      {/* Background */}
      <rect width="680" height="480" fill="#EAF2FB"/>

      {/* Clouds */}
      <g fill="white" opacity="0.7">
        <ellipse cx="130" cy="110" rx="28" ry="13"/>
        <ellipse cx="152" cy="105" rx="22" ry="11"/>
        <ellipse cx="108" cy="108" rx="16" ry="9"/>
        <ellipse cx="530" cy="95" rx="25" ry="12"/>
        <ellipse cx="552" cy="90" rx="20" ry="10"/>
        <ellipse cx="510" cy="93" rx="15" ry="8"/>
      </g>

      {/* Mountain left face (lighter) */}
      <polygon points="340,55 115,375 340,375" fill="#2E6FB8"/>

      {/* Mountain right face (darker) */}
      <polygon points="340,55 565,375 340,375" fill="#164E97"/>

      {/* Mountain center overlay for depth */}
      <polygon points="340,55 230,375 450,375" fill="#1E5FA8" opacity="0.6"/>

      {/* SPIRAL PATH around mountain */}
      <path d="M 490,355 Q 340,390 190,355" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 190,355 Q 140,300 165,250" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 165,250 Q 280,220 420,250" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 420,250 Q 460,200 430,160" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 430,160 Q 340,130 255,155" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 255,155 Q 230,120 280,90" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>
      <path d="M 280,90 Q 320,70 338,62" fill="none" stroke="#4A9FE8" strokeWidth="2.5" strokeDasharray="8,5"/>

      {/* STAIRS on right slope - dark navy */}
      <g fill="#0D3B6E" stroke="#081F3A" strokeWidth="0.5">
        <rect x="535" y="358" width="42" height="7" rx="1"/>
        <rect x="518" y="343" width="40" height="7" rx="1"/>
        <rect x="500" y="328" width="38" height="7" rx="1"/>
        <rect x="482" y="313" width="36" height="7" rx="1"/>
        <rect x="464" y="298" width="34" height="7" rx="1"/>
        <rect x="447" y="283" width="32" height="7" rx="1"/>
        <rect x="430" y="268" width="30" height="7" rx="1"/>
        <rect x="413" y="253" width="28" height="7" rx="1"/>
        <rect x="396" y="238" width="26" height="7" rx="1"/>
        <rect x="379" y="223" width="24" height="7" rx="1"/>
        <rect x="363" y="208" width="22" height="7" rx="1"/>
        <rect x="347" y="193" width="20" height="7" rx="1"/>
        <rect x="352" y="178" width="18" height="7" rx="1"/>
        <rect x="348" y="163" width="16" height="7" rx="1"/>
        <rect x="345" y="148" width="14" height="7" rx="1"/>
        <rect x="342" y="133" width="12" height="7" rx="1"/>
        <rect x="340" y="118" width="10" height="7" rx="1"/>
        <rect x="339" y="103" width="8"  height="7" rx="1"/>
        <rect x="339" y="88"  width="6"  height="7" rx="1"/>
        <rect x="339" y="73"  width="4"  height="7" rx="1"/>
      </g>

      {/* PERSON on final stairs near summit */}
      <g>
        <line x1="340" y1="100" x2="336" y2="110" stroke="#A8D4FF" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="344" y1="100" x2="347" y2="110" stroke="#A8D4FF" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="335" y="88" width="10" height="12" rx="3" fill="#A8D4FF"/>
        <line x1="335" y1="92" x2="329" y2="84" stroke="#A8D4FF" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="345" y1="91" x2="341" y2="80" stroke="#A8D4FF" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="340" cy="83" r="6" fill="#C8E8FF"/>
      </g>

      {/* Summit flag/marker */}
      <rect x="339" y="48" width="2" height="14" fill="#FFD700"/>
      <polygon points="341,48 355,53 341,58" fill="#FFD700"/>

      {/* Ground line */}
      <rect x="90" y="373" width="500" height="5" rx="2" fill="#1E5FA8" opacity="0.3"/>

      {/* Trees at base */}
      <g fill="#164E97" opacity="0.6">
        <rect x="148" y="358" width="4" height="16" rx="1"/>
        <ellipse cx="150" cy="356" rx="9" ry="7"/>
        <rect x="175" y="361" width="3" height="13" rx="1"/>
        <ellipse cx="176" cy="359" rx="7" ry="6"/>
        <rect x="510" y="360" width="4" height="14" rx="1"/>
        <ellipse cx="512" cy="358" rx="9" ry="7"/>
        <rect x="535" y="363" width="3" height="11" rx="1"/>
        <ellipse cx="536" cy="361" rx="7" ry="5"/>
      </g>
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
                  לחץ כאן לתקופת ניסיון
                </Link>
                <a href="#features"
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium text-base hover:bg-gray-50 transition-colors">
                  צפה בהדגמה ←
                </a>
              </div>

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
            <h2 className="text-3xl font-bold text-gray-900 mb-3">כל מה שצריך כדי לנהל עסק עצמאי</h2>
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
          <h3 className="text-xl font-bold text-gray-800 mt-12 mb-4 text-center">כלים נוספים</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "👥", label: "ניהול לקוחות" },
              { emoji: "📅", label: "לוח זמנים" },
              { emoji: "📊", label: "מעקב מטרות" },
              { emoji: "🔔", label: "תזכורות חכמות" },
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
          <h2 className="text-3xl font-bold text-gray-900 mb-3">מודל פשוט - לשלם רק על מה שאתם משתמשים</h2>
          <p className="text-gray-500 mb-10">בסיס חינמי. שדרגו רק כשצריך</p>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
            <div className="space-y-4">
              {[
                "שירות ללא עלות",
                "פתיחת וביטול עוסק",
                "מעקב אחר הזמנות מספקים",
                "ניהול לקוחות ואנשי קשר ללא הגבלה",
                'מילוי דו"חות אוטומטי',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-base text-gray-700">
                  <span style={{ color: "#1A7A4A" }}>✓</span>
                  <span>{item}</span>
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