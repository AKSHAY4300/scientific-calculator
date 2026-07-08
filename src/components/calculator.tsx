import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Moon,
  Sun,
  Github,
  Linkedin,
  Trash2,
  History as HistoryIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { evaluateExpression, math, type AngleMode } from "@/lib/calculator-engine";
import { useTheme } from "@/hooks/use-theme";
import { useScrollHide } from "@/hooks/use-scroll-hide";
import { useIsAtBottom } from "@/hooks/use-is-at-bottom";

type Mode = "basic" | "scientific" | "stats" | "matrix";

interface HistoryItem {
  expr: string;
  result: string;
}

const KEY_MAP: Record<string, string> = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  ".": ".",
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "(": "(",
  ")": ")",
  "^": "^",
  "%": "%",
};

export function Calculator() {
  const { theme, toggle } = useTheme();
  const barVisible = useScrollHide();
  const isAtBottom = useIsAtBottom();
  const [expr, setExpr] = useState("");
  const [output, setOutput] = useState("0");
  const [angle, setAngle] = useState<AngleMode>("deg");
  const [inv, setInv] = useState(false);
  const [mode, setMode] = useState<Mode>("scientific");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userName, setUserName] = useState("Student");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("novaSciUserName");
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNamePrompt(true);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const append = useCallback((s: string) => {
    setError(null);
    setExpr((e) => e + s);
  }, []);

  const backspace = useCallback(() => setExpr((e) => e.slice(0, -1)), []);
  const clearAll = useCallback(() => {
    setExpr("");
    setOutput("0");
    setError(null);
  }, []);

  const equals = useCallback(() => {
    if (!expr.trim()) return;
    try {
      const r = evaluateExpression(expr, angle);
      setOutput(r);
      setHistory((h) => [{ expr, result: r }, ...h].slice(0, 50));
      setError(null);
    } catch (err) {
      setError((err as Error).message || "Error");
      setOutput("Error");
    }
  }, [expr, angle]);

  // Keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        equals();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearAll();
        return;
      }
      const mapped = KEY_MAP[e.key];
      if (mapped) {
        e.preventDefault();
        append(mapped);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [append, backspace, clearAll, equals]);

  const memOp = (op: "MC" | "MR" | "MS" | "M+" | "M-") => {
    if (op === "MC") setMemory(0);
    else if (op === "MR") append(String(memory));
    else {
      try {
        const v = expr ? Number(evaluateExpression(expr, angle)) : Number(output);
        if (isNaN(v)) return;
        if (op === "MS") setMemory(v);
        else if (op === "M+") setMemory((m) => m + v);
        else if (op === "M-") setMemory((m) => m - v);
      } catch {
        /* ignore */
      }
    }
  };

  const factorial = () => {
    try {
      const v = math.factorial(Number(expr ? evaluateExpression(expr, angle) : output));
      setExpr(String(v));
      setOutput(String(v));
    } catch {
      setError("Error");
      setOutput("Error");
    }
  };

  const displayExpr = expr || "\u00a0";

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Name Prompt Popup */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-background p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Welcome to Nova Sci</h2>
            <p className="text-sm opacity-70 mb-4 text-foreground">
              Please enter your name to continue.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = (fd.get("name") as string).trim() || "Student";
                setUserName(name);
                localStorage.setItem("novaSciUserName", name);
                setShowNamePrompt(false);
              }}
            >
              <input
                autoFocus
                name="name"
                placeholder="Your Name"
                className="w-full px-4 py-2 rounded-lg bg-muted text-foreground border mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium transition hover:opacity-90"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="shrink-0 z-40 glass-bar border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              <span className="opacity-70">Hey</span>{" "}
              <span className="bg-gradient-to-r from-key-accent to-key-fn bg-clip-text text-transparent">
                {userName}
              </span>
              <span className="ml-2 hidden sm:inline text-xs uppercase tracking-widest opacity-60">
                Nova Sci
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex glass-key rounded-full p-1">
              {(["basic", "scientific", "stats", "matrix"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-full transition ${
                    mode === m ? "bg-key-fn text-white" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="glass-key rounded-full p-2.5"
              aria-label="History"
            >
              <HistoryIcon className="h-4 w-4" />
            </button>
            <button
              onClick={toggle}
              className="glass-key rounded-full p-2.5"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="glass-key rounded-full p-2.5"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 flex flex-col px-2 sm:px-6 py-2 sm:py-4">
        <div className="flex-1 min-h-0 w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-2 sm:gap-6">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Screen */}
            <div
              ref={inputRef}
              className="shrink-0 bg-screen text-screen-foreground rounded-3xl p-4 sm:p-6 border shadow-2xl"
              style={{
                boxShadow:
                  "0 30px 80px -30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-widest opacity-60 mb-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setAngle(angle === "deg" ? "rad" : "deg")}
                    className="hover:opacity-100"
                  >
                    {angle.toUpperCase()}
                  </button>
                  <span>{inv ? "INV" : ""}</span>
                  {memory !== 0 && <span>M</span>}
                </div>
                <span>{mode}</span>
              </div>
              <div className="digital text-right text-lg sm:text-xl opacity-80 min-h-[1.8rem] break-all">
                {displayExpr}
              </div>
              <div className="digital text-right text-4xl sm:text-6xl font-medium break-all mt-2">
                {error ? <span className="text-key-op">{error}</span> : output}
              </div>
            </div>

            {/* Keypad */}
            <div className="flex-1 min-h-0 mt-3 sm:mt-4 grid grid-cols-6 gap-1.5 sm:gap-3">
              {/* Row 1 - memory & mode */}
              {(["MC", "MR", "MS", "M+", "M-"] as const).map((m) => (
                <Key key={m} onClick={() => memOp(m)} variant="fn" small>
                  {m}
                </Key>
              ))}
              <Key onClick={() => setInv((v) => !v)} variant={inv ? "accent" : "fn"} small>
                INV
              </Key>

              {/* Scientific row */}
              {mode !== "basic" && (
                <>
                  <Key onClick={() => append(inv ? "asin(" : "sin(")} variant="fn">
                    {inv ? "sin⁻¹" : "sin"}
                  </Key>
                  <Key onClick={() => append(inv ? "acos(" : "cos(")} variant="fn">
                    {inv ? "cos⁻¹" : "cos"}
                  </Key>
                  <Key onClick={() => append(inv ? "atan(" : "tan(")} variant="fn">
                    {inv ? "tan⁻¹" : "tan"}
                  </Key>
                  <Key onClick={() => append("ln(")} variant="fn">
                    ln
                  </Key>
                  <Key onClick={() => append("log(")} variant="fn">
                    log
                  </Key>
                  <Key onClick={() => append("^")} variant="fn">
                    xʸ
                  </Key>

                  <Key onClick={() => append("sinh(")} variant="fn">
                    sinh
                  </Key>
                  <Key onClick={() => append("cosh(")} variant="fn">
                    cosh
                  </Key>
                  <Key onClick={() => append("tanh(")} variant="fn">
                    tanh
                  </Key>
                  <Key onClick={() => append("e^(")} variant="fn">
                    eˣ
                  </Key>
                  <Key onClick={() => append("10^(")} variant="fn">
                    10ˣ
                  </Key>
                  <Key onClick={factorial} variant="fn">
                    n!
                  </Key>

                  <Key onClick={() => append("√(")} variant="fn">
                    √
                  </Key>
                  <Key onClick={() => append("∛(")} variant="fn">
                    ∛
                  </Key>
                  <Key onClick={() => append("^2")} variant="fn">
                    x²
                  </Key>
                  <Key onClick={() => append("^3")} variant="fn">
                    x³
                  </Key>
                  <Key onClick={() => append("π")} variant="fn">
                    π
                  </Key>
                  <Key onClick={() => append("e")} variant="fn">
                    e
                  </Key>
                </>
              )}

              {/* Common core */}
              <Key onClick={() => append("(")}>(</Key>
              <Key onClick={() => append(")")}>)</Key>
              <Key onClick={() => append("%")} variant="op">
                %
              </Key>
              <Key onClick={clearAll} variant="op">
                AC
              </Key>
              <Key onClick={backspace} variant="op">
                DEL
              </Key>
              <Key onClick={() => append("÷")} variant="op">
                ÷
              </Key>

              <Key onClick={() => append("7")}>7</Key>
              <Key onClick={() => append("8")}>8</Key>
              <Key onClick={() => append("9")}>9</Key>
              <Key onClick={() => append("i")} variant="fn">
                i
              </Key>
              <Key onClick={() => append(",")}>,</Key>
              <Key onClick={() => append("×")} variant="op">
                ×
              </Key>

              <Key onClick={() => append("4")}>4</Key>
              <Key onClick={() => append("5")}>5</Key>
              <Key onClick={() => append("6")}>6</Key>
              <Key onClick={() => append("[")} variant="fn">
                [
              </Key>
              <Key onClick={() => append("]")} variant="fn">
                ]
              </Key>
              <Key onClick={() => append("−")} variant="op">
                −
              </Key>

              <Key onClick={() => append("1")}>1</Key>
              <Key onClick={() => append("2")}>2</Key>
              <Key onClick={() => append("3")}>3</Key>
              <Key onClick={() => append("mean(")} variant="fn">
                x̄
              </Key>
              <Key onClick={() => append("std(")} variant="fn">
                σ
              </Key>
              <Key onClick={() => append("+")} variant="op">
                +
              </Key>

              <Key onClick={() => append("0")} className="col-span-2">
                0
              </Key>
              <Key onClick={() => append(".")}>.</Key>
              <Key onClick={() => append("EE")} variant="fn">
                EE
              </Key>
              <Key onClick={equals} variant="equals" className="col-span-2">
                =
              </Key>
            </div>
          </div>

          {/* History side panel */}
          <aside
            className={`w-full lg:w-[320px] shrink-0 lg:shrink flex flex-col min-h-0 rounded-3xl border p-4 sm:p-5 bg-surface-2/70 backdrop-blur-xl ${
              showHistory ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="shrink-0 flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-70">History</h2>
              <button
                onClick={() => setHistory([])}
                className="opacity-60 hover:opacity-100"
                aria-label="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm opacity-50 shrink-0">No calculations yet.</p>
            ) : (
              <ul className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <li key={i}>
                    <button onClick={() => setExpr(h.expr)} className="w-full text-right group">
                      <div className="digital text-xs opacity-60 truncate">{h.expr}</div>
                      <div className="digital text-lg group-hover:text-key-accent transition">
                        = {h.result}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 glass-footer z-30 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs sm:text-sm">
          <p className="opacity-60">
            © {new Date().getFullYear()} Nova Sci · Built by{" "}
            <span className="font-semibold">Akshay S</span>
          </p>
          <div className="flex items-center gap-3 opacity-70">
            <a
              href="https://github.com/AKSHAY4300"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 flex items-center gap-1.5"
            >
              <Github className="h-4 w-4" /> <span className="hidden sm:inline">GitHub</span>
            </a>
            <a
              href="https://www.linkedin.com/in/akshay14370"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-100 flex items-center gap-1.5"
            >
              <Linkedin className="h-4 w-4" /> <span className="hidden sm:inline">LinkedIn</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Key({
  children,
  onClick,
  variant = "num",
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "num" | "op" | "fn" | "accent" | "equals";
  className?: string;
  small?: boolean;
}) {
  const variantClass = useMemo(() => {
    switch (variant) {
      case "op":
        return "text-white";
      case "fn":
        return "text-key-fn";
      case "accent":
        return "bg-key-accent/80 text-white";
      case "equals":
        return "bg-key-equals text-white";
      default:
        return "";
    }
  }, [variant]);

  const bg =
    variant === "op"
      ? { backgroundColor: "var(--color-key-op)" }
      : variant === "equals"
        ? { backgroundColor: "var(--color-key-equals)" }
        : {};

  return (
    <button
      onClick={onClick}
      className={`glass-key rounded-xl sm:rounded-2xl flex items-center justify-center h-full w-full ${small ? "text-[10px] sm:text-xs" : "text-base sm:text-lg"} font-medium active:scale-95 transition-transform ${variantClass} ${className}`}
      style={bg}
    >
      {children}
    </button>
  );
}
