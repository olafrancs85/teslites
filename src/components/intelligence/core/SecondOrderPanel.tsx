"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type SecondOrderEffect = {
  originatingInsightId: string;
  title: string;
  description: string;
};

export type SecondOrderPanelProps = {
  title: string;
  secondOrder?: SecondOrderEffect[];
};

/* ---------------------------------
   HELPERS
--------------------------------- */

function getBadgeVariant(signal: number | null): "destructive" | "secondary" | "outline" {
  if (signal === null) return "outline";
  if (signal >= 75) return "destructive";
  if (signal >= 50) return "secondary";
  return "outline";
}

/* ---------------------------------
   COMPONENT
--------------------------------- */
export default function SecondOrderPanel({ title, secondOrder = [] }: SecondOrderPanelProps) {
  if (!secondOrder || secondOrder.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2">
            No second-order effects available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {secondOrder.map((effect, i) => (
          <Card key={i} className="rounded-2xl shadow-md">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{effect.title}</span>
                <Badge variant="secondary">Effect</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{effect.description}</p>
              <p className="text-xs text-muted-foreground">
                Source Insight: {effect.originatingInsightId}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
