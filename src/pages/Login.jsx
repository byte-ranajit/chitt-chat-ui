import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function Login() {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(userName, password);
      navigate("/chat");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.4),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.35),transparent_32%),radial-gradient(circle_at_60%_85%,rgba(16,185,129,0.2),transparent_28%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/75 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-indigo-300">Chitt Chat</p>
        <h2 className="mb-6 text-3xl font-bold text-white">Welcome back</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Username</span>
            <input
              type="text"
              placeholder="Enter your username"
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 p-3 text-slate-100 outline-none transition focus:border-indigo-300/70"
              value={userName}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-white/10 bg-slate-800/80 p-3 text-slate-100 outline-none transition focus:border-indigo-300/70"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="w-full rounded-xl bg-indigo-500 p-3 font-semibold text-white transition hover:bg-indigo-400">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
