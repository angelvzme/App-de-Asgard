import { Link } from "wouter";
import { ArrowLeft, Timer, Repeat, Clock, Zap, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import gymLogo from "@assets/asgard-logo.png";

const TYPES = [
  {
    href: "/timer/amrap",
    icon: Repeat,
    name: "AMRAP",
    desc: "As Many Rounds As Possible",
    color: "from-primary/20 to-primary/5 border-primary/30",
    iconColor: "text-primary",
  },
  {
    href: "/timer/fortime",
    icon: Timer,
    name: "For Time",
    desc: "Completa los rounds en el menor tiempo",
    color: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    iconColor: "text-orange-400",
  },
  {
    href: "/timer/emom",
    icon: Clock,
    name: "EMOM",
    desc: "Every Minute On the Minute",
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    href: "/timer/tabata",
    icon: Zap,
    name: "Tabata",
    desc: "20s trabajo / 10s descanso",
    color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    iconColor: "text-yellow-400",
  },
  {
    href: "/timer/mix",
    icon: Layers,
    name: "MIX",
    desc: "Intervalos personalizados en cualquier orden",
    color: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    iconColor: "text-purple-400",
  },
];

export default function TimerHome() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/member">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <img src={gymLogo} alt="Asgard" className="h-6 w-auto drop-shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
          <span className="font-bold text-base">Timer de entrenamiento</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-4">
        <p className="text-muted-foreground text-sm text-center mb-2">Selecciona el tipo de timer</p>

        {TYPES.map((t, i) => (
          <motion.div
            key={t.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={t.href}>
              <div className={`flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform ${t.color}`}>
                <div className={`h-12 w-12 rounded-xl bg-background/40 flex items-center justify-center shrink-0 ${t.iconColor}`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg leading-tight">{t.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </main>
    </div>
  );
}
