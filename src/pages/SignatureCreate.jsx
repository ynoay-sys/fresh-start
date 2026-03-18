import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, XCircle } from "lucide-react";

const TABS = [
  { key: "draw", label: "צייר" },
  { key: "upload", label: "העלה תמונה" },
  { key: "type", label: "הקלד" },
];

// Inject Dancing Script font
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap";

function injectFont() {
  if (!document.querySelector(`link[href="${FONT_LINK}"]`)) {
    const el = document.createElement("link");
    el.rel = "stylesheet";
    el.href = FONT_LINK;
    document.head.appendChild(el);
  }
}

/* ── Draw Tab ── */
function DrawTab({ canvasRef }) {
  const drawing = useRef(false);
  const lastPos = useRef(null);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    lastPos.current = getPos(e, canvas);
  }

  function move(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1A1A2E";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    lastPos.current = pos;
  }

  function end(e) {
    e.preventDefault();
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border border-gray-200 rounded-lg cursor-crosshair touch-none w-full"
        style={{ maxWidth: 400, background: "#fff" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button onClick={clear} className="text-sm text-gray-500 hover:text-red-500 transition-colors">נקה</button>
    </div>
  );
}

/* ── Upload Tab ── */
function UploadTab({ onImageData }) {
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      onImageData(ev.target.result);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file" accept=".png,.jpg,.jpeg"
        onChange={handleFile}
        className="text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {preview && (
        <img src={preview} alt="preview" className="max-h-32 border border-gray-200 rounded-lg" />
      )}
    </div>
  );
}

/* ── Type Tab ── */
function TypeTab({ text, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={text}
        onChange={e => onChange(e.target.value)}
        placeholder="הקלד את שמך..."
        dir="rtl"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <div
        className="min-h-[100px] border border-gray-100 rounded-lg bg-white flex items-center justify-center p-4"
        style={{ fontFamily: "'Dancing Script', cursive", fontSize: 42, color: "#1A1A2E", direction: "ltr" }}
      >
        {text || <span className="text-gray-300 text-base" style={{ fontFamily: "Rubik" }}>תצוגה מקדימה</span>}
      </div>
    </div>
  );
}

export default function SignatureCreate() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("draw");
  const canvasRef = useRef();
  const [uploadedDataUrl, setUploadedDataUrl] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { injectFont(); }, []);

  async function handleSave() {
    setSaving(true);
    setError("");

    let blob;
    let type;

    if (tab === "draw") {
      const canvas = canvasRef.current;
      blob = await new Promise(res => canvas.toBlob(res, "image/png"));
      type = "drawn";
    } else if (tab === "upload") {
      if (!uploadedDataUrl) { setError("יש לבחור קובץ תמונה."); setSaving(false); return; }
      const res = await fetch(uploadedDataUrl);
      blob = await res.blob();
      type = "uploaded";
    } else {
      if (!typedText.trim()) { setError("יש להקליד שם."); setSaving(false); return; }
      // Render typed text to canvas
      const offscreen = document.createElement("canvas");
      offscreen.width = 400; offscreen.height = 150;
      const ctx = offscreen.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 150);
      ctx.font = "42px 'Dancing Script', cursive";
      ctx.fillStyle = "#1A1A2E";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, 200, 75);
      blob = await new Promise(res => offscreen.toBlob(res, "image/png"));
      type = "typed";
    }

    const file = new File([blob], "signature.png", { type: "image/png" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const user = await base44.auth.me();
    // Deactivate previous signatures
    const existing = await base44.entities.Signature.filter({ created_by: user.email, is_active: true });
    for (const s of existing) {
      await base44.entities.Signature.update(s.id, { is_active: false });
    }
    await base44.entities.Signature.create({ type, storage_path: file_url, is_active: true });

    setSaving(false);
    setSuccess(true);
    setTimeout(() => navigate("/documents"), 1500);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">צור חתימה</h1>
      <p className="text-sm text-gray-500 mb-6">צור את החתימה הדיגיטלית שלך לחתימה על מסמכים</p>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-blue-700 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            style={tab === t.key ? { borderColor: "#1E5FA8", color: "#1E5FA8" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        {tab === "draw" && <DrawTab canvasRef={canvasRef} />}
        {tab === "upload" && <UploadTab onImageData={setUploadedDataUrl} />}
        {tab === "type" && <TypeTab text={typedText} onChange={setTypedText} />}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
          <XCircle className="w-4 h-4" />{error}
        </div>
      )}

      {success ? (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <Check className="w-5 h-5" /> החתימה נשמרה! ✓
        </div>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50"
          style={{ backgroundColor: "#1E5FA8" }}
        >
          {saving ? "שומר..." : "שמור חתימה"}
        </button>
      )}
    </div>
  );
}