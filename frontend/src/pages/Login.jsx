import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError("Please enter your PIN.");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/admin/login", { pin });
      localStorage.setItem("admin_token", res.data.token);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Something went wrong. Try again.";
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      {/* Subtle dot/grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Soft glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-violet-100 opacity-50 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-13 h-13 w-[52px] h-[52px] rounded-[14px] bg-slate-900 flex items-center justify-center shadow-lg">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">
              SMTP Middleware
            </h1>
            <p className="text-[13px] text-slate-400 mt-1.5">
              smtp.vinasai.ca · Admin Portal
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className={` ${shake ? "[animation:shake_0.5s_ease-in-out]" : ""}`}
        >
          <style>{`
            @keyframes shake {
              0%,100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-5px); }
              80% { transform: translateX(5px); }
            }
          `}</style>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.09em]">
                Admin PIN
              </label>
              <input
                type="password"
                placeholder="· · · · · ·"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                maxLength={10}
                autoFocus
                className={`w-full px-5 py-3.5 rounded-xl border bg-slate-50 text-slate-900 text-center text-2xl tracking-[0.55em] placeholder:text-slate-300 placeholder:text-lg placeholder:tracking-[0.1em] transition-all duration-150 outline-none focus:bg-white focus:ring-[3px] ${
                  error
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
                }`}
              />
              {error && (
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-red-400 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-[12.5px] text-red-500 font-medium">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold tracking-wide transition-all duration-150 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 opacity-70"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Verifying…
                </>
              ) : (
                <>
                  Sign in
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Secure access · Authorized personnel only
        </p>
      </div>
    </div>
  );
}
