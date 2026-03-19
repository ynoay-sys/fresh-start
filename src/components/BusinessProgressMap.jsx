import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const STEP_LABELS = {
  bank_account: "חשבון בנק",
  vat_file: 'מע"מ',
  tax_file: "מס הכנסה",
  nii: "ביטוח לאומי",
};

const STEP_ORDER = ["bank_account", "vat_file", "tax_file", "nii"];

export default function BusinessProgressMap({ steps, mini = false }) {
  const navigate = useNavigate();
  const completedCount = steps.filter(s => s.status === "completed").length;
  const pct = Math.round((completedCount / 4) * 100);

  const getStatus = (key) => steps.find(s => s.step_key === key)?.status || "not_started";

  const nodeSize = mini ? "w-9 h-9" : "w-12 h-12";
  const fontSize = mini ? "text-xs" : "text-sm";

  return (
    <div>
      {/* Journey Map */}
      <div className="flex items-center justify-between relative px-2 mb-4">
        {/* Connecting line */}
        <div className="absolute top-5 right-4 left-4 h-0.5 bg-gray-200 z-0" />
        {mini && <div className="absolute top-4 right-4 left-4 h-0.5 bg-gray-200 z-0" />}

        {STEP_ORDER.map((key, i) => {
          const status = getStatus(key);
          const done = status === "completed";
          const active = status === "in_progress";

          return (
            <div key={key} className="flex flex-col items-center gap-2 z-10">
              <div
                className={`${nodeSize} rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "border-blue-700 text-white"
                    : active
                    ? "border-blue-500 bg-white animate-pulse"
                    : "border-gray-300 bg-white"
                }`}
                style={done ? { backgroundColor: "#1E5FA8", borderColor: "#1E5FA8" } : active ? { borderColor: "#1E5FA8" } : {}}
              >
                {done ? (
                  <Check className={`${mini ? "w-4 h-4" : "w-5 h-5"} text-white`} />
                ) : (
                  <span className={`font-bold ${mini ? "text-xs" : "text-sm"} ${active ? "text-blue-600" : "text-gray-400"}`}>{i + 1}</span>
                )}
              </div>
              <span className={`${fontSize} text-gray-600 text-center max-w-[60px] leading-tight`}>{STEP_LABELS[key]}</span>
            </div>
          );
        })}
      </div>

      {/* Percentage */}
      <p className={`text-center text-gray-500 ${mini ? "text-xs" : "text-sm"} mb-3`}>
        השלמת <span className="font-bold" style={{ color: "#1E5FA8" }}>{pct}%</span> מהשלבים לפתיחת העסק
      </p>

      {pct === 0 && !mini && (
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/business-opening")}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            התחל את המסע שלך ←
          </button>
        </div>
      )}

      {mini && (
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/business-opening")}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            המשך →
          </button>
        </div>
      )}
    </div>
  );
}