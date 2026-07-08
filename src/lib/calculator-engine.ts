import { create, all, type MathJsInstance } from "mathjs";

const math: MathJsInstance = create(all, { number: "number" });

export type AngleMode = "deg" | "rad";

// Better trig handling: rewrite by scanning parens
function convertTrig(expr: string, angle: AngleMode): string {
  if (angle !== "deg") return expr;
  const fns = ["asin", "acos", "atan", "sin", "cos", "tan", "sec", "csc", "cot"];
  let out = "";
  let i = 0;
  while (i < expr.length) {
    let matched = false;
    for (const fn of fns) {
      if (expr.startsWith(fn + "(", i)) {
        // find matching close paren
        let depth = 1;
        let j = i + fn.length + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === "(") depth++;
          else if (expr[j] === ")") depth--;
          if (depth === 0) break;
          j++;
        }
        const inner = expr.slice(i + fn.length + 1, j);
        const innerConverted = convertTrig(inner, angle);
        if (fn.startsWith("a")) {
          // inverse: result in radians -> convert to degrees
          out += `((180/pi)*${fn}(${innerConverted}))`;
        } else {
          out += `${fn}((pi/180)*(${innerConverted}))`;
        }
        i = j + 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += expr[i];
      i++;
    }
  }
  return out;
}

function preprocess(expr: string, angle: AngleMode): string {
  let e = expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√\(/g, "sqrt(")
    .replace(/√(\d+(\.\d+)?)/g, "sqrt($1)")
    .replace(/∛\(/g, "cbrt(")
    .replace(/∛(\d+(\.\d+)?)/g, "cbrt($1)")
    .replace(/\bln\(/g, "log(")
    .replace(/\blog\(/g, "log10(")
    .replace(/EE/g, "e");
  e = convertTrig(e, angle);
  return e;
}

export function evaluateExpression(expr: string, angle: AngleMode): string {
  const processed = preprocess(expr, angle);
  const result = math.evaluate(processed);
  return formatResult(result);
}

export function formatResult(result: unknown): string {
  try {
    if (typeof result === "number") {
      if (!isFinite(result)) throw new Error("Math error");
      return math.format(result, { precision: 12 });
    }
    return math.format(result, { precision: 12 });
  } catch {
    return String(result);
  }
}

export { math };
