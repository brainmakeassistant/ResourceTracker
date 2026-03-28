"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#2563eb", "#7c3aed", "#94a3b8", "#f59e0b", "#16a34a", "#dc2626", "#06b6d4", "#ec4899"];

interface MixRow {
  practice: string;
  ee: number;
  ic: number;
  tbd: number;
}

interface ProfitRow {
  practice: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

export function FinancialCharts({
  mixData,
  profitability,
}: {
  mixData: MixRow[];
  profitability: ProfitRow[];
}) {
  // Aggregate IC vs EE across all practices for pie chart
  const totalEE = mixData.reduce((s, d) => s + d.ee, 0);
  const totalIC = mixData.reduce((s, d) => s + d.ic, 0);
  const totalTBD = mixData.reduce((s, d) => s + d.tbd, 0);
  const pieData = [
    { name: "Employee (EE)", value: totalEE },
    { name: "Independent Contractor (IC)", value: totalIC },
    ...(totalTBD > 0 ? [{ name: "TBD", value: totalTBD }] : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      {/* IC vs EE Stacked Bar by Practice */}
      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold mb-4">
          Resource Mix by Practice (IC vs EE)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mixData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="practice" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="ee" name="Employee" fill="#2563eb" stackId="a" />
            <Bar dataKey="ic" name="IC" fill="#7c3aed" stackId="a" />
            {totalTBD > 0 && (
              <Bar dataKey="tbd" name="TBD" fill="#94a3b8" stackId="a" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overall IC vs EE Pie */}
      <div className="bg-white rounded-lg border border-[var(--border)] p-4">
        <h3 className="text-sm font-semibold mb-4">
          Overall Resource Mix
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Profitability by Practice Bar */}
      <div className="bg-white rounded-lg border border-[var(--border)] p-4 col-span-2">
        <h3 className="text-sm font-semibold mb-4">
          Revenue vs Cost by Practice (Next Quarter)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitability.filter((p) => p.revenue > 0)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="practice" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#16a34a" />
            <Bar dataKey="cost" name="Cost" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
