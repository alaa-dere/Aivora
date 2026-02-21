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
  { name: "W1", revenue: 1200 },
  { name: "W2", revenue: 1800 },
  { name: "W3", revenue: 1400 },
  { name: "W4", revenue: 2200 },
  { name: "W5", revenue: 2000 },
  { name: "W6", revenue: 2600 },
  { name: "W7", revenue: 2400 },
  { name: "W8", revenue: 3100 },
  { name: "W9", revenue: 2800 },
  { name: "W10", revenue: 3600 },
  { name: "W11", revenue: 3300 },
  { name: "W12", revenue: 4100 },
];

export function RevenueChart() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Last 12 weeks</p>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" strokeWidth={2} fillOpacity={0.2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}