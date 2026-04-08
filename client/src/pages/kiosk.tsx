import { useState, useRef, useEffect } from 'react';
import { useKioskCheckIn } from '@/hooks/use-members';
import { CheckCircle2, XCircle, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import gymLogo from '@assets/asgard-logo.png';

export default function KioskPage() {
  const [memberId, setMemberId] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const checkIn = useKioskCheckIn();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and reset
  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  // Auto-reset after success/error
  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        setStatus('idle');
        setMemberId('');
        setResult(null);
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim()) return;

    checkIn.mutate(memberId, {
      onSuccess: (data) => {
        setResult(data);
        setStatus('success');
      },
      onError: (err) => {
        setErrorMsg(err.message);
        setStatus('error');
      },
    });
  };

  const padInput = (val: string) => {
    setMemberId(prev => prev + val);
    inputRef.current?.focus();
  };

  const clearInput = () => {
    setMemberId('');
    inputRef.current?.focus();
  };

  const backspaceInput = () => {
    setMemberId(prev => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[180px]" />
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl z-10"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center mb-4">
                <img 
                  src={gymLogo} 
                  alt="Asgard Gym Logo" 
                  className="w-56 md:w-72 drop-shadow-[0_0_24px_rgba(220,38,38,0.4)]"
                />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-3 tracking-tight">
                BIENVENIDO A <span className="text-primary">ASGARD GYM</span>
              </h1>
              <p className="text-xl text-muted-foreground">Ingresa tu ID de Miembro para iniciar sesión</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-red-900 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-card rounded-2xl p-2 border border-border">
                  <div className="flex items-center px-4">
                    <Hash className="w-6 h-6 text-muted-foreground mr-4" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      placeholder="INGRESAR ID"
                      className="w-full bg-transparent border-none text-4xl md:text-5xl font-mono font-bold text-white placeholder:text-muted-foreground/30 focus:ring-0 py-6 uppercase tracking-wider"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => padInput(num.toString())}
                    className="h-20 text-3xl font-bold rounded-xl bg-secondary/50 hover:bg-secondary text-white transition-colors border border-white/5 active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearInput}
                  className="h-20 text-lg font-bold rounded-xl bg-red-900/20 hover:bg-red-900/30 text-red-400 transition-colors border border-red-500/10"
                >
                  BORRAR
                </button>
                <button
                  type="button"
                  onClick={() => padInput('0')}
                  className="h-20 text-3xl font-bold rounded-xl bg-secondary/50 hover:bg-secondary text-white transition-colors border border-white/5 active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={backspaceInput}
                  className="h-20 text-lg font-bold rounded-xl bg-secondary/50 hover:bg-secondary text-white transition-colors border border-white/5 active:scale-95"
                >
                  ⌫
                </button>
              </div>

              <Button 
                type="submit" 
                disabled={checkIn.isPending || !memberId}
                className="w-full h-24 text-2xl font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
              >
                {checkIn.isPending ? "VERIFICANDO..." : "REGISTRAR ENTRADA"} <ChevronRight className="ml-2 w-8 h-8" />
              </Button>
            </form>
          </motion.div>
        ) : status === 'success' ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center z-10 p-12 bg-card/50 backdrop-blur-xl rounded-3xl border border-green-500/20 shadow-2xl shadow-green-900/20"
          >
            <div className="inline-flex items-center justify-center p-6 bg-green-500/10 rounded-full mb-8 ring-1 ring-green-500/30">
              <CheckCircle2 className="w-24 h-24 text-green-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">ACCESO CONCEDIDO</h2>
            <p className="text-xl md:text-2xl text-green-400 mb-8 font-medium">¡Bienvenido de nuevo, {result?.member?.firstName}!</p>
            
            {!result?.isUnlimited && (
              <div className={`rounded-2xl p-8 border ${result?.lastSessionWarning ? 'bg-orange-500/10 border-orange-500/30' : 'bg-secondary/50 border-white/5'}`}>
                <p className="text-muted-foreground text-xs mb-2 uppercase tracking-widest font-semibold">Sesiones Restantes</p>
                <p className={`text-6xl font-bold ${result?.lastSessionWarning ? 'text-orange-400' : 'text-white'}`}>{result?.remainingSessions}</p>
                {result?.lastSessionWarning && (
                  <p className="text-orange-400 text-sm mt-2 font-medium">⚠ Esta es tu última sesión</p>
                )}
              </div>
            )}


            <div className="mt-8 h-1 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="text-center z-10 p-12 bg-card/50 backdrop-blur-xl rounded-3xl border border-red-500/20 shadow-2xl shadow-red-900/20 max-w-lg"
          >
            <div className="inline-flex items-center justify-center p-6 bg-red-500/10 rounded-full mb-8 ring-1 ring-red-500/30">
              <XCircle className="w-24 h-24 text-red-500" />
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">ACCESO DENEGADO</h2>
            <p className="text-xl text-red-400 mb-8">{errorMsg}</p>

            
            <div className="mt-8 h-1 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 text-xs text-muted-foreground/30 font-mono">
        ASGARD GYM APP v1.0
      </div>
    </div>
  );
}
