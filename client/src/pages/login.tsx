import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Eye, EyeOff, ArrowRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import gymLogo from "@assets/asgard-logo.png";

type Step = "id" | "password";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>("id");
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [memberFirstName, setMemberFirstName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberId.trim() }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al verificar el ID");
        setLoading(false);
        return;
      }

      setMemberFirstName(data.firstName);

      if (data.requiresPassword) {
        setStep("password");
      } else {
        // Regular member: log in directly
        await doLogin(memberId.trim(), undefined);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);
    await doLogin(memberId.trim(), password);
    setLoading(false);
  }

  async function doLogin(id: string, pwd?: string) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: id, password: pwd }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error al iniciar sesión");
        return;
      }

      // Set auth cache directly so protected routes see user immediately
      queryClient.setQueryData(["/api/auth/me"], data);
      navigate(data.role === "admin" ? "/admin" : "/member");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-2">
            <img
              src={gymLogo}
              alt="Asgard"
              className="h-14 w-auto drop-shadow-[0_0_12px_rgba(220,38,38,0.6)]"
            />
            <span className="font-display text-4xl font-black tracking-tighter text-foreground">
              Asgard Gym App
            </span>
          </div>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Sistema de Acceso
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === "id" ? (
              <motion.div
                key="step-id"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold text-foreground">Bienvenido</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ingresa tu número de miembro
                  </p>
                </div>

                <form onSubmit={handleIdSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Ej: 1003"
                    value={memberId}
                    onChange={(e) => { setMemberId(e.target.value); setError(""); }}
                    className="text-center text-lg font-mono h-12 tracking-widest"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading || !memberId.trim()}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>Continuar <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold text-foreground">
                    Hola, {memberFirstName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ingresa la contraseña de acceso maestro
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="h-12 pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading || !password}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>Ingresar <Shield className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => { setStep("id"); setPassword(""); setError(""); }}
                  >
                    ← Cambiar ID
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
