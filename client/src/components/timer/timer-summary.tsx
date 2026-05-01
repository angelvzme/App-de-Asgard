import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface TimerSummaryProps {
  title: string;
  lines: { label: string; value: string }[];
  onRepeat: () => void;
  onExit: () => void;
}

export function TimerSummary({ title, lines, onRepeat, onExit }: TimerSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <div className="h-24 w-24 rounded-full bg-green-500/10 ring-4 ring-green-500/30 flex items-center justify-center">
        <CheckCircle2 className="h-14 w-14 text-green-400" />
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-foreground">¡Entrenamiento completado!</p>
        <p className="text-muted-foreground mt-1">{title}</p>
      </div>
      <div className="w-full max-w-xs bg-card border border-border rounded-2xl divide-y divide-border">
        {lines.map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-5 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="outline" className="flex-1 rounded-2xl" onClick={onExit}>Salir</Button>
        <Button className="flex-1 rounded-2xl" onClick={onRepeat}>Repetir</Button>
      </div>
    </motion.div>
  );
}
