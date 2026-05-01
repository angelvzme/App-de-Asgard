import { useState } from "react";
import { Bookmark, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Preset<T> {
  id: string;
  name: string;
  config: T;
}

function getStorageKey(type: string) { return `timer-presets-${type}`; }

export function loadPresets<T>(type: string): Preset<T>[] {
  try {
    const raw = localStorage.getItem(getStorageKey(type));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function savePresets<T>(type: string, presets: Preset<T>[]) {
  try { localStorage.setItem(getStorageKey(type), JSON.stringify(presets)); } catch {}
}

interface TimerPresetsProps<T> {
  type: string;
  currentConfig: T;
  onLoad: (config: T) => void;
}

export function TimerPresets<T>({ type, currentConfig, onLoad }: TimerPresetsProps<T>) {
  const [presets, setPresets] = useState<Preset<T>[]>(() => loadPresets<T>(type));
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    const preset: Preset<T> = { id: Date.now().toString(), name: name.trim(), config: currentConfig };
    const updated = [...presets, preset];
    setPresets(updated);
    savePresets(type, updated);
    setName("");
  };

  const remove = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    savePresets(type, updated);
  };

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Bookmark className="h-4 w-4" /> Presets guardados ({presets.length})
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border/50 p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del preset..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={e => e.key === "Enter" && save()}
            />
            <Button size="sm" variant="outline" onClick={save} disabled={!name.trim()} className="h-8 shrink-0">
              Guardar
            </Button>
          </div>
          {presets.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Sin presets guardados.</p>
          ) : (
            <div className="space-y-1">
              {presets.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/20">
                  <button
                    type="button"
                    className="text-sm text-left flex-1 hover:text-primary transition-colors"
                    onClick={() => { onLoad(p.config); setOpen(false); }}
                  >
                    {p.name}
                  </button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => remove(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
