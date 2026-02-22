"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { name: "Jan", revenue: 4200 },
  { name: "Feb", revenue: 5800 },
  { name: "Mar", revenue: 6200 },
  { name: "Apr", revenue: 7800 },
  { name: "May", revenue: 9100 },
  { name: "Jun", revenue: 8700 },
];

export function RevenueChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Sales Activity – Monthly</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing total sales for the last 6 months
        </p>
      </CardHeader>
      <CardContent className="h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 10000]} ticks={[0, 2000, 4000, 6000, 8000, 10000]} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}