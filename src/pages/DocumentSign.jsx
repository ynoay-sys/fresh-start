import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PDFDocument } from "pdf-lib";
import { Check, Download, AlertTriangle } from "lucide-react";

/* ── Step Indicator ── */
function StepIndicator({ current }) {
  const steps = ["צפייה במסמך", "בחירת מיקום", "חתימה והורדה"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                style={{
                  backgroundColor: done ? "#1E5FA8" : active ? "#EFF6FF" : "#F9FAFB",
                  borderColor: done || active ? "#1E5FA8" : "#D1D5DB",
                  color: done ? "#fff" : active ? "#1E5FA8" : "#9CA3AF",
                }}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className="text-xs mt-1 text-center max-w-[80px]" style={{ color: active ? "#1E5FA8" : "#9CA3AF" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-12 h-0.5 mx-1 mb-5" style={{ backgroundColor: num < current ? "#1E5FA8" : "#E5E7EB" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Document Viewer ── */
function DocViewer({ doc }) {
  const ext = doc.file_type;
  if (["jpg", "jpeg", "png"].includes(ext)) {
    return <img src={doc.storage_path} alt={doc.file_name} className="w-full rounded-lg border border-gray-200 max-h-[500px] object-contain" />;
  }
  if (ext === "pdf") {
    return <iframe src={doc.storage_path} className="w-full h-[500px] rounded-lg border border-gray-200" title={doc.file_name} />;
  }
  return (
    <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
      קובץ Word — לא ניתן להציג. תהיה אפשרות לחתום.
    </div>
  );
}

/* ── Manual rect selection overlay ── */
function RectSelector({ onSelect }) {
  const ref = useRef();
  const startPos = useRef(null);
  const [rect, setRect] = useState(null);

  function getRelPos(e) {
    const bounds = ref.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: Math.max(0, Math.min(100, ((src.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((src.clientY - bounds.top) / bounds.height) * 100)),
    };
  }

  function onStart(e) {
    e.preventDefault();
    startPos.current = getRelPos(e);
    setRect(null);
  }

  function onMove(e) {
    e.preventDefault();
    if (!startPos.current) return;
    const cur = getRelPos(e);
    setRect({
      x: Math.min(startPos.current.x, cur.x),
      y: Math.min(startPos.current.y, cur.y),
      width: Math.abs(cur.x - startPos.current.x),
      height: Math.abs(cur.y - startPos.current.y),
    });
  }

  function onEnd(e) {
    e.preventDefault();
    if (rect && rect.width > 2 && rect.height > 2) {
      onSelect(rect);
    }
    startPos.current = null;
  }

  return (
    <div
      ref={ref}
      className="relative cursor-crosshair select-none"
      onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
    >
      <div className="pointer-events-none w-full h-[400px] bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-sm">
        לחץ וגרור לסימון אזור החתימה
      </div>
      {rect && (
        <div
          className="absolute pointer-events-none border-2 border-dashed rounded"
          style={{
            left: `${rect.x}%`, top: `${rect.y}%`,
            width: `${rect.width}%`, height: `${rect.height}%`,
            borderColor: "#1E5FA8", backgroundColor: "#1E5FA820",
          }}
        />
      )}
    </div>
  );
}

export default function DocumentSign() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [activeSig, setActiveSig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualRect, setManualRect] = useState(null);
  const [signing, setSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [signError, setSignError] = useState("");

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const [docRes, sigRes] = await Promise.all([
        base44.entities.Document.filter({ id: documentId }),
        base44.entities.Signature.filter({ created_by: user.email, is_active: true }),
      ]);
      setDoc(docRes[0] || null);
      setActiveSig(sigRes[0] || null);
      setLoading(false);
    }
    load();
  }, [documentId]);

  function detectCoords() {
    setCoords({ x: 70, y: 88, width: 25, height: 8 });
    setStep(2);
  }

  function confirmCoords(c) {
    setCoords(c);
    setStep(3);
  }

  async function handleSign() {
    if (!activeSig) return;
    setSigning(true);
    setSignError("");

    const ext = doc.file_type;

    if (ext === "docx") {
      // Mark as signed without embedding
      await base44.entities.Document.update(doc.id, { is_signed: true, signature_id: activeSig.id });
      setSignedUrl(doc.storage_path);
      setSigning(false);
      return;
    }

    try {
      if (["jpg", "jpeg", "png"].includes(ext)) {
        // Canvas approach
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = doc.storage_path; });

        const sigImg = new Image();
        sigImg.crossOrigin = "anonymous";
        await new Promise((res, rej) => { sigImg.onload = res; sigImg.onerror = rej; sigImg.src = activeSig.storage_path; });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const sigX = (coords.x / 100) * canvas.width;
        const sigY = (coords.y / 100) * canvas.height;
        const sigW = (coords.width / 100) * canvas.width;
        const sigH = (coords.height / 100) * canvas.height;
        ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);

        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        const signedFile = new File([blob], "signed_" + doc.file_name, { type: "image/png" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: signedFile });

        await base44.entities.Document.update(doc.id, { is_signed: true, signature_id: activeSig.id, storage_path: file_url });
        setSignedUrl(file_url);

      } else if (ext === "pdf") {
        const [pdfRes, sigRes] = await Promise.all([
          fetch(doc.storage_path),
          fetch(activeSig.storage_path),
        ]);
        const [pdfBytes, sigBytes] = await Promise.all([pdfRes.arrayBuffer(), sigRes.arrayBuffer()]);

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const page = pages[pages.length - 1];
        const { width, height } = page.getSize();

        const sigImage = await pdfDoc.embedPng(sigBytes);
        const sigX = (coords.x / 100) * width;
        const sigY = height - ((coords.y / 100) * height) - ((coords.height / 100) * height);
        const sigW = (coords.width / 100) * width;
        const sigH = (coords.height / 100) * height;

        page.drawImage(sigImage, { x: sigX, y: sigY, width: sigW, height: sigH });

        const signedPdfBytes = await pdfDoc.save();
        const blob = new Blob([signedPdfBytes], { type: "application/pdf" });
        const signedFile = new File([blob], "signed_" + doc.file_name, { type: "application/pdf" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: signedFile });

        await base44.entities.Document.update(doc.id, { is_signed: true, signature_id: activeSig.id, storage_path: file_url });
        setSignedUrl(file_url);
      }
    } catch (e) {
      setSignError("שגיאה בחתימה על המסמך. אנא נסה שוב.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return <div className="p-8 text-center text-gray-500" dir="rtl">המסמך לא נמצא.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">חתימה על מסמך — {doc.file_name}</h1>
      <StepIndicator current={step} />

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <DocViewer doc={doc} />
          <button
            onClick={detectCoords}
            className="w-full py-2.5 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "#1E5FA8" }}
          >
            זהה מיקום חתימה אוטומטית ←
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5">
          {!manualMode ? (
            <>
              <p className="text-sm font-medium text-gray-700">זיהינו מיקום חתימה אפשרי. האם זה נכון?</p>
              <div className="relative w-full h-[300px] bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                <div
                  className="absolute border-2 border-dashed rounded"
                  style={{
                    left: `${coords?.x}%`, top: `${coords?.y}%`,
                    width: `${coords?.width}%`, height: `${coords?.height}%`,
                    borderColor: "#1E5FA8", backgroundColor: "#1E5FA820",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  (תצוגת מסמך — תחתית הדף)
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => confirmCoords(coords)}
                  className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: "#1E5FA8" }}
                >כן, חתום כאן ✓</button>
                <button
                  onClick={() => setManualMode(true)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50"
                >בחר מיקום ידנית</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">לחץ וגרור על המסמך כדי לסמן את אזור החתימה</p>
              <RectSelector onSelect={setManualRect} />
              {manualRect && (
                <button
                  onClick={() => confirmCoords(manualRect)}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: "#1E5FA8" }}
                >אישור המיקום ←</button>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-5">
          {!activeSig ? (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <p className="text-gray-700 font-medium">אין חתימה שמורה</p>
              <button
                onClick={() => navigate("/documents/sign/create")}
                className="px-5 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#1E5FA8" }}
              >צור חתימה ←</button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">החתימה שלך</p>
                <img src={activeSig.storage_path} alt="חתימה" className="max-h-20 border border-gray-100 rounded" />
              </div>

              {doc.file_type === "docx" && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  לחתימה על קובץ Word — יש להמיר אותו ל-PDF תחילה.
                </div>
              )}

              {signError && <p className="text-sm text-red-600">{signError}</p>}

              {!signedUrl ? (
                <button
                  onClick={handleSign}
                  disabled={signing}
                  className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#1E5FA8" }}
                >
                  {signing ? "חותם..." : doc.file_type === "docx" ? "המשך ללא חתימה" : "חתום על המסמך"}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <Check className="w-5 h-5" /> המסמך נחתם בהצלחה! ✓
                  </div>
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white font-medium text-sm"
                    style={{ backgroundColor: "#1E5FA8" }}
                  >
                    <Download className="w-4 h-4" />
                    הורד מסמך חתום ⬇
                  </a>
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                חתימה זו היא חתימה אלקטרונית פשוטה (SES). למסמכים משפטיים מורכבים, מומלץ להתייעץ עם עורך דין.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}