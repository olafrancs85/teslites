type Props = {
  scores: number[];
  direction: "Improving" | "Stable" | "Weakening";
};

export default function ConfidenceTrend({ scores, direction }: Props) {
  return (
    <section className="mt-4 rounded-xl border p-4">
      <h4 className="font-semibold text-sm">Confidence Trend (Recent)</h4>

      <div className="mt-2 flex gap-2">
        {scores.map((score, i) => (
          <span
            key={i}
            className="rounded-md border px-2 py-1 text-xs"
          >
            {score}
          </span>
        ))}
      </div>

      <p className="mt-2 text-sm opacity-80">
        Trend: <strong>{direction}</strong>
      </p>
    </section>
  );
}
