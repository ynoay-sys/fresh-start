import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const STEPS = [
  {
    icon: null,
    logo: true,
    title: "ברוכים הבאים ל-Fresh Start! 🎉",
    body: "המערכת שתעזור לך לנהל את העסק שלך בקלות",
    btn: "בואו נתחיל ←",
  },
  {
    icon: "🏢",
    title: "שלב ראשון: פתיחת העסק",
    body: "נדריך אותך בכל הצעדים הנדרשים לפתיחת עסק חוקי בישראל",
    btn: "הבא ←",
  },
  {
    icon: "📁",
    title: "ניהול מסמכים חכם",
    body: "העלה, חתום וארגן את כל מסמכי העסק שלך במקום אחד",
    btn: "הבא ←",
  },
  {
    icon: "🤖",
    title: "עוזר AI אישי",
    body: "יש לך שאלות? עוזר המסמכים שלנו זמין 24/7 לענות על כל שאלה בנושא מסמכים ועסקים בישראל",
    btn: "סיים והתחל ←",
  },
];

async function markOnboardingComplete(profileId) {
  if (profileId) {
    await base44.entities.UserProfile.update(profileId, {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString().split("T")[0],
    });
  }
  // Keep localStorage as a fast client-side cache
  localStorage.setItem("welcomeShown", "true");
}

export default function WelcomeModal({ onComplete, profileId }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  async function finish() {
    await markOnboardingComplete(profileId);
    onComplete();
    navigate("/business-opening");
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else finish();
  }

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        {/* Logo / Icon */}
        {current.logo ? (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "#1E5FA8" }}>
            <span className="text-white font-bold text-2xl">FS</span>
          </div>
        ) : (
          <span className="text-6xl block mb-5">{current.icon}</span>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">{current.body}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: i === step ? "#1E5FA8" : "#D1D5DB" }} />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-3 rounded-xl text-white font-bold text-base mb-3"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          {current.btn}
        </button>

        {step > 0 && (
          <button onClick={finish} className="text-sm text-gray-400 hover:text-gray-600 underline">
            דלג
          </button>
        )}
      </div>
    </div>
  );
}