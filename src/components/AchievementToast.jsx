import { useEffect, useState } from "react";
import { registerAchievementToastHandler, nextToast } from "../lib/achievements";

export default function AchievementToast() {
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    registerAchievementToastHandler((achievement) => {
      if (achievement) {
        setCurrent(achievement);
        setVisible(true);
      } else {
        setVisible(false);
        setTimeout(() => setCurrent(null), 400);
      }
    });
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => {
      nextToast();
    }, 400);
  }

  useEffect(() => {
    if (!visible || !current) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => nextToast(), 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [current, visible]);

  if (!current) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 z-50 w-80 rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-4 transition-all duration-400"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "100px"})`,
        opacity: visible ? 1 : 0,
        background: "linear-gradient(135deg, #1E5FA8, #5C1A8A)",
        transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
      }}
      dir="rtl"
    >
      <div className="text-5xl flex-shrink-0 leading-none mt-1">{current.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-xs font-medium mb-0.5">🏆 הישג חדש!</p>
        <p className="text-white font-bold text-lg leading-tight">{current.title}</p>
        <p className="text-white/70 text-sm mt-0.5">{current.description}</p>
      </div>
      <button
        onClick={dismiss}
        className="text-white/60 hover:text-white text-xl leading-none flex-shrink-0 mt-0.5"
      >
        ×
      </button>
    </div>
  );
}