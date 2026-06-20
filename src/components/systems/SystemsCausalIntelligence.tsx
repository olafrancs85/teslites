// components/systems/SystemsCausalIntelligence.tsx
"use client";

import { useSystemsCausal, SystemCausal } from "@/hooks/useSystemsCausal";

export default function SystemsCausalIntelligence() {
  const { data: systems, loading, error } = useSystemsCausal();

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Generating cross-system intelligence…
      </p>
    );
  }

  if (error || !systems) {
    return (
      <p className="text-sm text-muted-foreground">
        Systems intelligence temporarily unavailable.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">
        Systems Causal Intelligence
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((system: SystemCausal) => (
          <div
            key={system.name}
            className="border rounded p-4 space-y-3"
          >
            <h3 className="text-lg font-bold">{system.name}</h3>

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
