"use client";

import { Card, CardContent } from "@/components/ui/card";

export type SecondOrderEffect = {
  originatingInsightId: string;
  title: string;
  description: string;
};

type OptimusSecondOrderPanelProps = {
  title?: string;
  secondOrder?: SecondOrderEffect[];
};

export default function OptimusSecondOrderPanel({
  title = "Second-Order Effects",
  secondOrder = [],
}: OptimusSecondOrderPanelProps) {
  if (secondOrder.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4 text-sm text-muted-foreground">
          No second-order effects available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>

        <div className="space-y-3">
          {secondOrder.map((effect, i) => (
            <div
              key={i}
              className="rounded-lg border p-3 space-y-1 hover:shadow-lg transition"
            >
              <p className="font-medium">{effect.title}</p>
              <p className="text-sm text-muted-foreground">
                {effect.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
