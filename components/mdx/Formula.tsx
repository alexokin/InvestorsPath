import { getFormula } from "@/lib/content/formulas";

export function Formula({ id }: { id: string }) {
  const formula = getFormula(id);
  if (!formula) {
    return (
      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        נוסחה לא נמצאה: {id}
      </div>
    );
  }
  return (
    <div className="my-4 rounded-lg border border-border bg-slate-50 p-4">
      <p className="text-sm font-semibold text-foreground">{formula.name_he}</p>
      <p dir="ltr" className="mt-2 rounded-md bg-white px-3 py-2 font-mono text-sm text-slate-800 border border-border">
        {formula.expression}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        {formula.variables.map((v) => (
          <li key={v.symbol}>
            <span dir="ltr" className="font-mono font-medium text-foreground">
              {v.symbol}
            </span>{" "}
            — {v.name_he}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">{formula.notes_he}</p>
    </div>
  );
}
