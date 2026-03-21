import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send } from "lucide-react";
import { format } from "date-fns";
import PaywallMessage from "./PaywallMessage";

const FREE_CHAT_LIMIT = 20;

const SYSTEM_CONTEXT = `You are a helpful assistant for Israeli self-employed professionals using the Fresh Start platform.

You answer questions about:
- Israeli government documents and forms
- Tax filings (מס הכנסה)
- VAT requirements (מע"מ)
- National Insurance (ביטוח לאומי)
- Business registration processes
- Document requirements for freelancers and small businesses

Rules:
- Always respond in Hebrew unless the user writes in English
- Be specific: name the exact form and authority when relevant
- Keep answers concise and practical (3–5 sentences max)
- If unsure: say so and recommend contacting the authority directly
- Never give legal advice — recommend professionals for legal questions
- Do not make up form numbers or deadlines you are not sure about`;

const STARTER_QUESTIONS = [
  "אילו מסמכים אני צריך לפתיחת עסק?",
  "מתי צריך להגיש דוח שנתי?",
  "מה ההבדל בין עוסק מורשה לעוסק פטור?",
];

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-3 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

export default function DocumentChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [usageRecord, setUsageRecord] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    async function loadUsage() {
      const user = await base44.auth.me();
      const records = await base44.entities.UserFeatureUsage.filter({
        created_by: user.email,
        feature_key: "ai_query",
      });
      if (records.length > 0) {
        setUsageRecord(records[0]);
        const count = records[0].usage_count || 0;
        setUsageCount(count);
        if (count >= FREE_CHAT_LIMIT) setLimitReached(true);
      }
    }
    loadUsage();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading || limitReached) return;
    const userMsg = { role: "user", content: text, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].slice(-10);
    const historyText = history.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    const prompt = `${SYSTEM_CONTEXT}\n\nConversation so far:\n${historyText}\n\nRespond to the last user message only.`;

    let aiContent;
    try {
      aiContent = await base44.integrations.Core.InvokeLLM({ prompt });
    } catch {
      aiContent = "השירות אינו זמין כרגע. אנא נסה שוב בעוד מספר דקות.";
    }

    setMessages(prev => [...prev, { role: "assistant", content: aiContent, ts: new Date() }]);
    setLoading(false);

    // Update usage
    const newCount = usageCount + 1;
    const user = await base44.auth.me();
    if (usageRecord) {
      await base44.entities.UserFeatureUsage.update(usageRecord.id, { usage_count: newCount });
    } else {
      const created = await base44.entities.UserFeatureUsage.create({
        user_id: user.id,
        feature_key: "ai_query",
        usage_count: 1,
      });
      setUsageRecord(created);
    }
    setUsageCount(newCount);
    if (newCount >= FREE_CHAT_LIMIT) {
      setLimitReached(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "הגעת למכסת השאלות החינמיות (20). שאלות נוספות יהיו זמינות בגרסת התשלום.",
        ts: new Date(),
      }]);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-20 left-4 md:bottom-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full text-white shadow-lg text-sm font-medium transition-all hover:shadow-xl"
        style={{ backgroundColor: "#1E5FA8" }}
      >
        <MessageCircle className="w-4 h-4" />
        עוזר מסמכים
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-20 left-4 md:bottom-20 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
          style={{ height: 480 }}
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 rounded-t-2xl" style={{ backgroundColor: "#1E5FA8" }}>
            <div>
              <p className="text-white font-semibold text-sm">עוזר המסמכים 🤖</p>
              <p className="text-white/70 text-xs">שאל שאלות על מסמכים וטפסים ממשלתיים</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center mb-3">בחר שאלה להתחלה:</p>
                {STARTER_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="w-full text-right px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                  style={msg.role === "user"
                    ? { backgroundColor: "#1E5FA8", color: "#fff" }
                    : { backgroundColor: "#F3F4F6", color: "#111827" }}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {format(msg.ts, "HH:mm")}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="bg-gray-100 rounded-xl">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100">
            {limitReached ? (
              <PaywallMessage usedCount={usageCount} freeQuota={FREE_CHAT_LIMIT} featureNameHebrew="עוזר מסמכים" />
            )
        </div>
      )}
    </>
  );
}