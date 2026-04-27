import { useState } from "react";

const CARDS = [
  {
    icon: "🧾",
    title: "עוסק פטור",
    frontBg: "#E6F4ED",
    backBg: "#1A7A4A",
    lines: [
      "מחזור עד ₪120,000 בשנה",
      "✓ פטור מגביית מע״מ",
      "✓ דוח שנתי בלבד",
      "✓ מתאים לפרילנסרים",
      "✗ לא ניתן לנכות מע״מ על הוצאות",
    ],
  },
  {
    icon: "📊",
    title: "עוסק מורשה",
    frontBg: "#EAF2FB",
    backBg: "#1E5FA8",
    lines: [
      "מחזור מעל ₪120,000 בשנה",
      "✓ גובה מע״מ 18% מלקוחות",
      "✓ מנכה מע״מ על הוצאות",
      "✓ מתאים לעסקים פעילים",
      "✗ דוח מע״מ כל חודשיים",
    ],
  },
  {
    icon: "👔",
    title: "שכיר + עצמאי",
    frontBg: "#FFF9E6",
    backBg: "#C25A00",
    lines: [
      "עובד שכיר עם הכנסה עצמאית נוספת",
      "✓ שני מקורות הכנסה חוקיים",
      "✓ המעסיק מנכה מס במקור",
      "✗ חובת דוח שנתי משולב",
      "✗ הפרשי ביטוח לאומי חודשיים",
    ],
  },
];

function FlipCard({ card }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flip-card${flipped ? " flipped" : ""}`}
      style={{ perspective: "1000px", cursor: "pointer", flex: 1, minWidth: 0 }}
      onClick={() => setFlipped(v => !v)}
    >
      <div
        className="flip-card-inner"
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%",
          transition: "transform 0.5s ease",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: card.frontBg,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            gap: 8,
          }}
        >
          <span style={{ fontSize: 40 }}>{card.icon}</span>
          <p style={{ fontWeight: "bold", fontSize: 16, color: "#111827", textAlign: "center" }}>{card.title}</p>
          <p style={{ fontSize: 12, color: "#6B7280" }}>לחץ למידע נוסף</p>
        </div>

        {/* Back */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundColor: card.backBg,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 16,
            gap: 6,
            transform: "rotateY(180deg)",
          }}
        >
          <p style={{ fontWeight: "bold", fontSize: 14, color: "white", marginBottom: 4 }}>{card.title}</p>
          {card.lines.map((line, i) => (
            <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.92)", lineHeight: 1.5 }}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BusinessTypeCards() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-800 mb-4">מה סוג העוסק שלי?</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {CARDS.map(card => (
          <FlipCard key={card.title} card={card} />
        ))}
      </div>
      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, textAlign: "center" }}>לחץ על כרטיס לפרטים נוספים</p>
    </div>
  );
}