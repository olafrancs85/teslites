// components/systems/SystemsCards.tsx

type SystemCard = {
  name: string;
  currentState: string;
  drivers: string[];
  impact: string[];
};

const systems: SystemCard[] = [
  {
    name: "Vehicles",
    currentState:
      "Tesla continues scaling vehicle production while improving margins through automation, platform standardization, and battery efficiency.",
    drivers: [
      "Battery cost reduction",
      "Factory automation",
      "Vehicle platform standardization",
    ],
    impact: [
      "Lower cost per vehicle",
      "Higher production scalability",
      "Expanded global adoption",
    ],
  },
  {
    name: "Energy (Generation & Storage)",
    currentState:
      "Energy storage demand is accelerating as global grids face instability and AI-driven electricity demand increases.",
    drivers: [
      "Grid instability",
      "AI data center energy demand",
      "Megapack production scaling",
    ],
    impact: [
      "Recurring high-margin revenue",
      "Stronger infrastructure leverage",
      "Support for charging network reliability",
    ],
  },
  {
    name: "Optimus (Robotics)",
    currentState:
      "Optimus is transitioning from demonstrations into real-world factory task deployment.",
    drivers: [
      "Rising labor costs",
      "Advances in autonomy and vision",
      "Manufacturing task automation",
    ],
    impact: [
      "Manufacturing cost reduction",
      "Operational scalability",
      "Long-term economic leverage beyond vehicles",
    ],
  },
  {
    name: "Factories & Manufacturing",
    currentState:
      "Tesla is ramping new production lines while increasing automation across existing factories.",
    drivers: [
      "Production line standardization",
      "Optimus integration",
      "Process and throughput optimization",
    ],
    impact: [
      "Faster capacity expansion",
      "Improved capital efficiency",
      "Sustainable margin growth",
    ],
  },
];

export default function SystemsCards() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">
        Systems Intelligence
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systems.map((system) => (
          <div
            key={system.name}
            className="border rounded p-4 space-y-3"
          >
            <h3 className="text-lg font-bold">
              {system.name}
            </h3>

            <p className="text-base text-white/80">
              {system.currentState}
            </p>

            <div>
              <p className="text-sm font-bold">
                Key Drivers
              </p>
              <ul className="text-sm list-disc ml-4 space-y-1">
                {system.drivers.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium">
                Downstream Impact
              </p>
              <ul className="text-xs list-disc ml-4 space-y-1">
                {system.impact.map((impact) => (
                  <li key={impact}>{impact}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
