import { motion } from "framer-motion";

interface TimerDisplayProps {
  time: string;
  label?: string;
  sublabel?: string;
  color?: "default" | "work" | "rest" | "prep" | "finish";
  round?: string;
}

const colorMap = {
  default: "text-foreground",
  work: "text-primary",
  rest: "text-blue-400",
  prep: "text-yellow-400",
  finish: "text-green-400",
};

export function TimerDisplay({ time, label, sublabel, color = "default", round }: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      {round && (
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{round}</span>
      )}
      {label && (
        <span className={`text-base font-semibold uppercase tracking-wider ${colorMap[color]}`}>{label}</span>
      )}
      <motion.div
        key={time}
        initial={{ opacity: 0.6, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.05 }}
        className={`font-mono font-black tabular-nums leading-none ${colorMap[color]}`}
        style={{ fontSize: "clamp(5rem, 22vw, 9rem)" }}
      >
        {time}
      </motion.div>
      {sublabel && (
        <span className="text-sm text-muted-foreground">{sublabel}</span>
      )}
    </div>
  );
}
