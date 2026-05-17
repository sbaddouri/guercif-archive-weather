"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface WeatherChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color: string;
  unit: string;
}

export default function WeatherChart({ data, title, dataKey, color, unit }: WeatherChartProps) {
  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={(time) => format(parseISO(time), "HH:mm")}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip 
              labelFormatter={(label) => format(parseISO(label), "HH:mm")}
              formatter={(value: any) => [`${value}${unit}`, title]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#color${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
