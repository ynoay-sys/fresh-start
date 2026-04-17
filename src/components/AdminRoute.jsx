import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin } from "@/lib/userRole";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  useEffect(() => {
    isAdmin().then(ok => setStatus(ok ? "allowed" : "denied"));
  }, []);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "denied") return <Navigate to="/dashboard" replace />;

  return children;
}