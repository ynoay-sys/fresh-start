import { useState, useEffect, useRef } from "react";

const encouragements = [
  "כבר שעה רצופה של עבודה! אתה בדרך הקצרה למיליון 💰",
  "עצמאי אמיתי! ממשיך לעבוד כמו מכונה 🔥",
  "כל עבודה קטנה בונה את האימפריה הגדולה שלך 🏆",
  "אתה לא עצמאי — אתה בעל חברה עתידי 🚀",
  "המתחרים שלך עדיין ישנים. אתה כבר עובד 💪",
  "כל לקוח שתוסיף הוא צעד נוסף לחופש הכלכלי שלך ⭐",
];

// 30 active minutes in ms
const BUBBLE_INTERVAL_MS = 30 * 60 * 1000;

export default function EncouragementBubble({ breakModalVisible }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [fading, setFading] = useState(false);
  const activeMinutesRef = useRef(0);
  const lastEventRef = useRef(Date.now());
  const indexRef = useRef(0);
  const shownAtRef = useRef(0);

  // Track active time
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      if (now - lastEventRef.current < 60000) {
        activeMinutesRef.current += 1;
      }
      if (
        activeMinutesRef.current > 0 &&
        activeMinutesRef.current % 30 === 0 &&
        now - shownAtRef.current > BUBBLE_INTERVAL_MS - 5000 &&
        !breakModalVisible
      ) {
        showBubble();
        shownAtRef.current = now;
      }
    }, 60000);

    const onActivity = () => { lastEventRef.current = Date.now(); };
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      clearInterval(tick);
      events.forEach(e => window.removeEventListener(e, onActivity));
    };
  }, [breakModalVisible]);

  function showBubble() {
    const msg = encouragements[indexRef.current % encouragements.length];
    indexRef.current++;
    setMessage(msg);
    setFading(false);
    setVisible(true);
    setTimeout(() => dismiss(), 5000);
  }

  function dismiss() {
    setFading(true);
    setTimeout(() => setVisible(false), 400);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 72,
        zIndex: 200,
        maxWidth: 220,
        backgroundColor: "#1E5FA8",
        color: "white",
        fontSize: 13,
        borderRadius: 12,
        padding: "10px 12px",
        direction: "rtl",
        textAlign: "right",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        opacity: fading ? 0 : 1,
        transform: fading ? "scale(0.9)" : "scale(1)",
        transition: "opacity 0.4s, transform 0.4s",
        animation: !fading ? "bubbleIn 0.3s ease-out" : undefined,
      }}
    >
      {/* Triangle pointing right toward logo */}
      <div style={{
        position: "absolute",
        top: "50%",
        right: -8,
        transform: "translateY(-50%)",
        width: 0,
        height: 0,
        borderTop: "7px solid transparent",
        borderBottom: "7px solid transparent",
        borderLeft: "8px solid #1E5FA8",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
        <button
          onClick={dismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes bubbleIn {
          from { opacity: 0; transform: scale(0); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}