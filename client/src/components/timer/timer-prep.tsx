import { motion, AnimatePresence } from "framer-motion";

export function TimerPrep({ remaining }: { remaining: number }) {
  const sec = Math.ceil(remaining);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <p className="text-yellow-400 font-semibold uppercase tracking-widest text-sm">Preparación</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={sec}
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.15 }}
          className="font-mono font-black text-yellow-400 tabular-nums leading-none"
          style={{ fontSize: "clamp(5rem, 22vw, 9rem)" }}
        >
          {sec}
        </motion.div>
      </AnimatePresence>
      <p className="text-muted-foreground text-sm">El timer comenzará pronto…</p>
    </div>
  );
}
