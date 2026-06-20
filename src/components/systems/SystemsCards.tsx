// components/systems/SystemsCards.tsx
"use client";

import { useSystemsCausal, SystemCausal } from "@/hooks/useSystemsCausal";

export default function SystemsCards() {
  const { data: systems, loading, error } = useSystemsCausal();

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Generating dynamic system intelligence…
      </p>
    );
  }

  if (error || !systems) {
    return (
      <p className="text-sm text-muted-foreground">
        Failed to load system intelligence.
      </p>
    );
  }

  const getImpactColor = (impact: number) => {
    if (impact >= 5) return "bg-green-600";
    if (impact === 4) return "bg-green-400";
    if (impact === 3) return "bg-yellow-400";
    if (impact === 2) return "bg-orange-400";
    return "bg-red-400";
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Systems Intelligence</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((system: SystemCausal) => (
          <div
            key={system.name}
            className="border rounded p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">{system.name}</h3>
              <div className="flex-1 ml-4 h-2 rounded bg-gray-200">
                <div
                  className={`${getImpactColor(
                    system.impact
                  )} h-2 rounded`}
                  style={{ width: `${(system.impact / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <p className="text-base text-white/80">
              {system.summary}
            </p>

            {system.drivers.length > 0 && (
              <div>
                <p className="text-sm font-bold">
                  Key Reinforcing Drivers
                </p>
                <ul className="text-sm list-disc ml-4 space-y-1">
                  {system.drivers.map((driver: string, idx: number) => (
                    <li key={idx}>{driver}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
