import { useNavigate } from "react-router-dom";

export default function BackButton({ label = "חזרה למסך הראשי", to = "/dashboard" }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        color: '#1E5FA8',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'Rubik, sans-serif',
        padding: '8px 0',
        marginBottom: '16px',
        fontWeight: '500'
      }}
    >
      <span>→</span>
      <span>{label}</span>
    </button>
  );
}