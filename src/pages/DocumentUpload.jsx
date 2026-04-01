import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { FileText, FileImage, File, CheckCircle, XCircle, UploadCloud } from "lucide-react";
import { checkAndUnlockAchievements } from "../lib/achievements";

const ACCEPTED = ["pdf", "docx", "jpg", "jpeg", "png"];
const MAX_MB = 10;

const CATEGORIES = [
  { value: "contract", label: "חוזה" },
  { value: "invoice", label: "חשבונית" },
  { value: "license", label: "רישיון" },
  { value: "receipt", label: "קבלה" },
  { value: "form", label: "טופס ממשלתי" },
  { value: "other", label: "אחר" },
];

function getExt(name) {
  return name.split(".").pop().toLowerCase();
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ ext, size = 40 }) {
  if (ext === "pdf") return <div style={{ fontSize: size, lineHeight: 1 }} className="text-red-500">📄</div>;
  if (["jpg", "jpeg", "png"].includes(ext)) return <div style={{ fontSize: size, lineHeight: 1 }} className="text-green-500">🖼️</div>;
  return <div style={{ fontSize: size, lineHeight: 1 }} className="text-blue-500">📝</div>;
}

export default function DocumentUpload() {
  const navigate = useNavigate();
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function validate(f) {
    const ext = getExt(f.name);
    if (!ACCEPTED.includes(ext)) {
      return "סוג קובץ לא נתמך. יש להעלות PDF, Word, JPG או PNG בלבד.";
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      return `הקובץ גדול מדי. גודל מקסימלי: ${MAX_MB}MB.`;
    }
    return "";
  }

  function handleFile(f) {
    setSuccess(false);
    setUploadError("");
    const err = validate(f);
    if (err) { setError(err); setFile(null); return; }
    setError("");
    setFile(f);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  async function handleUpload() {
    if (!file || !category) return;
    setUploading(true);
    setUploadError("");
    setProgress(10);

    // Simulate progress while uploading
    const ticker = setInterval(() => {
      setProgress(p => p < 85 ? p + 10 : p);
    }, 300);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearInterval(ticker);
      setProgress(100);

      const ext = getExt(file.name);
      const fileType = ext === "jpeg" ? "jpg" : ext;

      await base44.entities.Document.create({
        file_name: file.name,
        file_type: fileType,
        file_size_kb: Math.round(file.size / 1024),
        storage_path: file_url,
        category,
        is_signed: false,
        status: "active",
      });

      checkAndUnlockAchievements().catch(() => {});
      setSuccess(true);
    } catch (e) {
      clearInterval(ticker);
      setUploadError("ההעלאה נכשלה. אנא נסה שוב.");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setCategory("");
    setError("");
    setProgress(0);
    setSuccess(false);
    setUploadError("");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">העלאת מסמך</h1>
      <p className="text-sm text-gray-500 mb-8">העלה חוזים, חשבוניות, רישיונות ומסמכים אחרים</p>

      {!success ? (
        <>
          {/* Drop Zone */}
          {!file && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center py-16 px-8 text-center"
              style={{ borderColor: dragOver ? "#1E5FA8" : "#CBD5E1", backgroundColor: dragOver ? "#EFF6FF" : "#FAFAFA" }}
            >
              <UploadCloud className="w-12 h-12 mb-4" style={{ color: "#1E5FA8" }} />
              <p className="text-lg font-semibold text-gray-700 mb-1">גרור קובץ לכאן</p>
              <p className="text-sm text-gray-400 mb-3">או לחץ לבחירת קובץ</p>
              <p className="text-xs text-gray-400">PDF, Word, JPG, PNG — עד 10MB</p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {/* Validation Error */}
          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* File Preview Card */}
          {file && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl space-y-4">
              <div className="flex items-center gap-4">
                <FileIcon ext={getExt(file.name)} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                </div>
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  dir="rtl"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
                >
                  <option value="">בחר קטגוריה...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Progress */}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>מעלה...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%`, backgroundColor: "#1E5FA8" }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <XCircle className="w-4 h-4" /> {uploadError}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!category || uploading}
                className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-50"
                style={{ backgroundColor: "#1E5FA8" }}
              >
                {uploading ? "מעלה..." : "העלה מסמך"}
              </button>
            </div>
          )}
        </>
      ) : (
        /* Success State */
        <div className="text-center py-16 px-8 bg-white rounded-2xl border border-gray-200">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">המסמך הועלה בהצלחה! ✓</h2>
          <p className="text-sm text-gray-500 mb-8">{file?.name}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              העלה מסמך נוסף
            </button>
            <button
              onClick={() => navigate("/documents")}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: "#1E5FA8" }}
            >
              עבור לארכיון ←
            </button>
          </div>
        </div>
      )}
    </div>
  );
}