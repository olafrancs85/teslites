type Props = {
  bullActive: boolean
  bearActive: boolean
  bullText: string
  bearText: string
}

export default function ScenarioCards({
  bullActive,
  bearActive,
  bullText,
  bearText,
}: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-2 mt-6">
      <div className={`rounded-xl border p-4 ${bullActive ? "border-green-500" : "border-gray-700 opacity-60"}`}>
        <h3 className="font-semibold text-green-400">Bull Case</h3>
        <p className="text-sm mt-2">{bullText}</p>
      </div>

      <div className={`rounded-xl border p-4 ${bearActive ? "border-red-500" : "border-gray-700 opacity-60"}`}>
        <h3 className="font-semibold text-red-400">Bear Case</h3>
        <p className="text-sm mt-2">{bearText}</p>
      </div>
    </section>
  )
}
