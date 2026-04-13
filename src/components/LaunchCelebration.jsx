import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

export default function LaunchCelebration({ onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    const end = Date.now() + 3000;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#1E5FA8', '#1A7A4A', '#ffffff'] });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#1E5FA8', '#1A7A4A', '#ffffff'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  function handleDismiss() {
    localStorage.setItem("launchCelebrated", "true");
    onDismiss();
    navigate("/dashboard");
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #1E5FA8 0%, #1A7A4A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} dir="rtl">
      <div style={{ textAlign: 'center', color: 'white', maxWidth: 480, width: '100%' }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>העסק שלך פועל!</h1>
        <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 32 }}>כל הגדרות העסק הושלמו בהצלחה</p>

        <div style={{ background: 'white', borderRadius: 16, padding: '24px 32px', marginBottom: 32, color: '#111827', textAlign: 'right' }}>
          {[
            "פרופיל הושלם",
            "כל שלבי פתיחת העסק הושלמו",
            "הלקוח הראשון נוסף",
            "החזון הוגדר",
          ].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ color: '#1A7A4A', fontWeight: 'bold', fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'white', color: '#1E5FA8',
            border: 'none', borderRadius: 12,
            padding: '14px 36px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
          }}
        >
          בואו נתחיל לעבוד! ←
        </button>
      </div>
    </div>
  );
}