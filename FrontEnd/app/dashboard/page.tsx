"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/dashboard/stat-card"
import { HealthScore } from "@/components/dashboard/health-score"
import {
  IncomeExpenseChart,
  ExpensePieChart,
} from "@/components/dashboard/dashboard-charts"
import { TrendingUp, TrendingDown, Calculator, Wallet, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { invoicesApi, Invoice } from "@/lib/api/invoices"
import { expensesApi, Expense } from "@/lib/api/expenses"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [invoicesData, expensesData] = await Promise.all([
          invoicesApi.list(),
          expensesApi.list()
        ])
        setInvoices(invoicesData)
        setExpenses(expensesData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calculate totals
  const totalIncome = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  
  // Calculate tax estimate (Section 44ADA - 50% deemed profit, then tax slabs)
  const grossIncome = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const taxableIncome = grossIncome * 0.5 // 50% presumptive income
  let taxEstimate = 0
  if (taxableIncome > 1500000) {
    taxEstimate = 187500 + (taxableIncome - 1500000) * 0.3
  } else if (taxableIncome > 1200000) {
    taxEstimate = 112500 + (taxableIncome - 1200000) * 0.25
  } else if (taxableIncome > 900000) {
    taxEstimate = 52500 + (taxableIncome - 900000) * 0.2
  } else if (taxableIncome > 600000) {
    taxEstimate = 22500 + (taxableIncome - 600000) * 0.1
  } else if (taxableIncome > 300000) {
    taxEstimate = 7500 + (taxableIncome - 300000) * 0.05
  }

  const safeToSpend = totalIncome - totalExpenses - taxEstimate
  const healthScore = Math.min(100, Math.max(0, Math.round(
    (totalIncome > 0 ? 40 : 0) +
    (totalExpenses < totalIncome * 0.5 ? 30 : 15) +
    (safeToSpend > 0 ? 30 : 0)
  )))

  const userName = user?.full_name || "there"

  // Recent activity - combine invoices and expenses
  const recentActivity = [
    ...(invoices.slice(0, 2).map(inv => ({
      title: inv.description || "Invoice payment",
      client: inv.client_name,
      amount: inv.status === "paid" ? `+${formatCurrency(Number(inv.total_amount))}` : formatCurrency(Number(inv.total_amount)),
      time: new Date(inv.created_at).toLocaleDateString("en-IN"),
      type: inv.status === "paid" ? "income" : "pending",
    }))),
    ...(expenses.slice(0, 2).map(exp => ({
      title: exp.title,
      client: exp.category,
      amount: `-${formatCurrency(Number(exp.amount))}`,
      time: new Date(exp.created_at).toLocaleDateString("en-IN"),
      type: "expense",
    }))),
  ].slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userName}. Here&apos;s your financial overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          change={{ value: totalIncome > 0 ? "Paid invoices" : "No income yet", trend: "up" }}
          icon={TrendingUp}
          iconColor="text-success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change={{ value: `${expenses.length} transactions`, trend: "up" }}
          icon={TrendingDown}
          iconColor="text-destructive"
        />
        <StatCard
          title="Tax Estimate"
          value={formatCurrency(taxEstimate)}
          change={{ value: "Section 44ADA", trend: "down" }}
          icon={Calculator}
          iconColor="text-primary"
        />
        <StatCard
          title="Safe-to-Spend"
          value={formatCurrency(safeToSpend)}
          change={{ value: safeToSpend > 0 ? "Available" : "Review budget", trend: safeToSpend > 0 ? "up" : "down" }}
          icon={Wallet}
          iconColor="text-accent"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <IncomeExpenseChart />
        <ExpensePieChart />
      </div>

      {/* Health Score and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <HealthScore score={healthScore} />
        <div className="lg:col-span-2 rounded-lg border border-border/50 bg-card p-6">
          <h3 className="text-base font-medium text-foreground mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity. Start by adding invoices or expenses.
              </p>
            ) : recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.client}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      activity.type === "income"
                        ? "text-success"
                        : activity.type === "expense"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {activity.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
