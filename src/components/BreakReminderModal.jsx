import { useState, useEffect, useRef } from "react";

const nicknames = [
  "מכונת עבודה", "עצמאי נמר",
  "בעל עסק פנתר", "יזם על",
  "עסקאי בלתי נעצר", "אריה העסקים"
];

function HourglassAnim() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <svg width="60" height="80" viewBox="0 0 60 80">
        <style>{`
          @keyframes sandFall {
            0%   { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(30px); opacity: 0; }
          }
          @keyframes rotate {
            0%   { transform: rotate(0deg); }
            50%  { transform: rotate(180deg); }
            100% { transform: rotate(180deg); }
          }
          .hg-rotate { animation: rotate 10s ease-in-out infinite; transform-origin: 30px 40px; }
          .sand-particle { animation: sandFall 1.5s ease-in infinite; }
          .sand-particle:nth-child(2) { animation-delay: 0.3s; }
          .sand-particle:nth-child(3) { animation-delay: 0.6s; }
        `}</style>
        <g className="hg-rotate">
          {/* Hourglass body */}
          <path d="M10,5 L50,5 L35,40 L50,75 L10,75 L25,40 Z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
          {/* Top sand */}
          <polygon points="12,8 48,8 33,37" fill="#F59E0B" opacity="0.8" />
          {/* Bottom sand */}
          <polygon points="12,72 48,72 27,45" fill="#F59E0B" opacity="0.6" />
        </g>
        {/* Falling sand particles */}
        <circle className="sand-particle" cx="29" cy="40" r="2" fill="#F59E0B" />
        <circle className="sand-particle" cx="31" cy="38" r="1.5" fill="#F59E0B" />
        <circle className="sand-particle" cx="30" cy="42" r="1" fill="#F59E0B" />
      </svg>
    </div>
  );
}

function CrumblingText({ text, onDone }) {
  const letters = text.split("");
  const [fallen, setFallen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFallen(true), 100);
    const done = setTimeout(onDone, 3200);
    return () => { clearTimeout(t); clearTimeout(done); };
  }, []);

  return (
    <div style={{ textAlign: "center", marginBottom: 16 }}>
      <span style={{ fontSize: 18, fontWeight: "bold", color: "#111827" }}>
        {letters.map((ch, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              transition: `transform ${0.3 + i * 0.05}s ease-in, opacity ${0.3 + i * 0.05}s`,
              transitionDelay: `${i * 0.06}s`,
              transform: fallen ? "translateY(60px) rotate(15deg)" : "translateY(0)",
              opacity: fallen ? 0 : 1,
            }}
          >
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    </div>
  );
}

export default function BreakReminderModal({ onClose }) {
  const [phase, setPhase] = useState("ask"); // ask | crumble | flash | break | countdown
  const [countdown, setCountdown] = useState(0);
  const [nickname, setNickname] = useState("");
  const timerRef = useRef(null);

  function handleDecline() {
    setPhase("crumble");
  }

  function handleAccept() {
    setPhase("break");
  }

  function handleDurationSelect(mins) {
    const nick = nicknames[Math.floor(Math.random() * nicknames.length)];
    setNickname(nick);
    setCountdown(mins * 60);
    setPhase("countdown");
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { onClose(); return; }
    timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [phase, countdown]);

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
      zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} dir="rtl">
      <div style={{
        backgroundColor: "white", borderRadius: 20, padding: 32,
        maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        {phase === "ask" && (
          <>
            <HourglassAnim />
            <p style={{ fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 24 }}>
              לא הגיע הזמן למנוחה של כמה דקות? ⏳
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleAccept}
                style={{ padding: "12px 24px", borderRadius: 12, backgroundColor: "#1E5FA8", color: "white", fontWeight: "bold", fontSize: 16, border: "none", cursor: "pointer" }}>
                כן, אקח הפסקה! ☕
              </button>
              <button onClick={handleDecline}
                style={{ padding: "12px 24px", borderRadius: 12, backgroundColor: "#F3F4F6", color: "#374151", fontWeight: "bold", fontSize: 16, border: "none", cursor: "pointer" }}>
                לא, אמשיך לעבוד 💪
              </button>
            </div>
          </>
        )}

        {phase === "crumble" && (
          <>
            <HourglassAnim />
            <CrumblingText text="אתה עובד כל כך קשה 💪" onDone={() => setPhase("flash")} />
          </>
        )}

        {phase === "flash" && (
          <FlashMessage onDone={onClose} />
        )}

        {phase === "break" && (
          <>
            <p style={{ fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 20 }}>
              כמה זמן תרצה להפסיק?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[2, 5, 10].map(m => (
                <button key={m} onClick={() => handleDurationSelect(m)}
                  style={{ flex: 1, padding: "16px 8px", borderRadius: 12, backgroundColor: "#EAF2FB", color: "#1E5FA8", fontWeight: "bold", fontSize: 18, border: "2px solid #1E5FA8", cursor: "pointer" }}>
                  {m} דקות
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "countdown" && (
          <>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 8 }}>{nickname}!</p>
            <p style={{ fontSize: 14, color: "#374151", marginBottom: 20, lineHeight: 1.6 }}>
              כל דקת הפסקה היא בוסט של 10 דקות עבודה! 🔋
            </p>
            <div style={{ fontSize: 56, fontWeight: "bold", color: "#1E5FA8", fontVariantNumeric: "tabular-nums", marginBottom: 20 }}>
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
            <button onClick={onClose}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #E5E7EB", color: "#6B7280", backgroundColor: "white", cursor: "pointer", fontSize: 14 }}>
              סיים הפסקה
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FlashMessage({ onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 1000);
    return () => clearTimeout(t);
  }, []);
  return (
    <p style={{
      fontSize: 22, fontWeight: "bold", color: "#1E5FA8",
      opacity: visible ? 1 : 0, transition: "opacity 0.3s", padding: "20px 0"
    }}>
      הצלחה לפניך! 🚀
    </p>
  );
}