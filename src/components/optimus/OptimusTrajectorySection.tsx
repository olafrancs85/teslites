import { optimusTrajectory } from "@/data/optimusTrajectory";
import { TeslaSignal } from "@/components/optimus/domains/tesla";
import { StarshipSignal } from "@/components/optimus/domains/spacex";

type OptimusTrajectorySectionProps = {
  signals?: TeslaSignal[] | (StarshipSignal | any)[];
};

export default function OptimusTrajectorySection({
  signals,
}: OptimusTrajectorySectionProps) {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">
          Optimus Trajectory Intelligence
        </h2>
        <p className="text-sm text-muted-foreground">
          Forward-looking analysis of Optimus deployment and systemic impact
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {optimusTrajectory.map((stage) => (
          <div
            key={stage.id}
            className="rounded-xl border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{stage.title}</h3>
              <span className="text-xs uppercase text-muted-foreground">
                {stage.status}
              </span>
            </div>

            <p className="text-sm">{stage.scope}</p>

            <div>
              <p className="text-xs font-semibold">Capabilities</p>
              <ul className="list-disc list-inside text-sm">
                {stage.capabilities.map((cap) => (
                  <li key={cap}>{cap}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold">Implications</p>
              <ul className="list-disc list-inside text-sm">
                {stage.implications.map((imp) => (
                  <li key={imp}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {signals && signals.length > 0 && (
          <div className="col-span-full mt-6">
            <h3 className="text-lg font-semibold">Signals Overview</h3>
            <ul className="list-disc list-inside text-sm">
              {signals.map((signal) => (
                <li key={signal.id}>{signal.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
