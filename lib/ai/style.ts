// A last safety net for Jonathan's house style. The system prompt asks the
// model to follow these rules; this catches the occasional slip in what it
// returns. It only rewrites the specific patterns below and leaves literal
// uses alone (a staircase landing, farm land, an honest broker stays rare
// enough to accept).

const LAND: Record<string, string> = { land: "come across", lands: "comes across", landed: "came across" };

export function tidyText(s: string): string {
  return (
    s
      // Dashes: number ranges become "to", the rest become commas.
      .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
      .replace(/\s*[—–]\s*/g, ", ")
      // "let it land" and friends.
      .replace(/\blet (it|that|this|them|the \w+) land\b/gi, "let $1 sink in")
      // "lands because / lands well / lands with" reads best as "works".
      .replace(/\b(land|lands|landed)\s+(because|well|with|so)\b/gi, (_m, verb: string, next: string) =>
        `${({ land: "work", lands: "works", landed: "worked" } as Record<string, string>)[verb.toLowerCase()]} ${next}`
      )
      // A message, point or line "landing".
      .replace(
        /\b(may|might|will|would|could|can|should|does|did|didn't|doesn't|won't|to|it|that|this|line|point|message|story|soundbite|joke|they)\s+(land|lands|landed)\b/gi,
        (_m, before: string, verb: string) => `${before} ${LAND[verb.toLowerCase()]}`
      )
      // Filler honesty.
      .replace(/\b[Tt]o be honest,?\s*/g, "")
      .replace(/\b([Tt])he honest answer is\b/g, "$1he answer is")
      .replace(/\bHonestly,?\s+(\w)/g, (_m, c: string) => c.toUpperCase())
      .replace(/\s+honestly\b/g, "")
      .replace(/ ,/g, ",")
  );
}

/** Applies tidyText to every string inside a parsed JSON result. */
export function tidy<T>(value: T): T {
  if (typeof value === "string") return tidyText(value) as T;
  if (Array.isArray(value)) return value.map(tidy) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, tidy(v)])) as T;
  }
  return value;
}
