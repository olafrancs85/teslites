type Props = {
  score: number;
  label: string;
};

export default function AIConfidenceCard({ score, label }: Props) {
  return (
    <section className="mt-6 rounded-xl border p-4">
      <h3 className="font-semibold">AI Confidence Score</h3>

      <div className="mt-3 flex items-center gap-4">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>

      <p className="mt-2 text-sm opacity-70">
        This score reflects combined earnings strength, trend confirmation,
        momentum health, and live market intelligence.
      </p>
    </section>
  );
}
