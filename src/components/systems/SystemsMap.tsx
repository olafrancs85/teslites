// components/systems/SystemsMap.tsx
const systems = [
  "Vehicles",
  "Energy Generation & Storage",
  "Battery Manufacturing",
  "Autonomy (AI)",
  "Factories",
  "Optimus (Robotics)",
  "Charging & Service Infrastructure",
];

export default function SystemsMap() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Core Systems</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 text-base">
        {systems.map((s) => (
          <li key={s} className="rounded border p-2">
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
