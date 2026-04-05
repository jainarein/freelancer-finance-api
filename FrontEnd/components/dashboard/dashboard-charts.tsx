"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const monthlyData = [
  { name: "Jan", income: 85000, expenses: 32000 },
  { name: "Feb", income: 92000, expenses: 28000 },
  { name: "Mar", income: 78000, expenses: 35000 },
  { name: "Apr", income: 110000, expenses: 42000 },
  { name: "May", income: 95000, expenses: 38000 },
  { name: "Jun", income: 125000, expenses: 45000 },
]

const expenseCategories = [
  { name: "Software & Tools", value: 15000, color: "var(--chart-1)" },
  { name: "Office Supplies", value: 8000, color: "var(--chart-2)" },
  { name: "Travel", value: 12000, color: "var(--chart-3)" },
  { name: "Marketing", value: 20000, color: "var(--chart-4)" },
  { name: "Utilities", value: 5000, color: "var(--chart-5)" },
]

export function IncomeExpenseChart() {
  return (
    <Card className="border-border/50 bg-card col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base font-medium text-foreground">
          Income vs Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [
                `₹${value.toLocaleString("en-IN")}`,
              ]}
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-1)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "var(--chart-1)" }}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="var(--chart-5)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-5)", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "var(--chart-5)" }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ExpensePieChart() {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-base font-medium text-foreground">
          Expense Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={expenseCategories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {expenseCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [
                `₹${value.toLocaleString("en-IN")}`,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "var(--foreground)", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
