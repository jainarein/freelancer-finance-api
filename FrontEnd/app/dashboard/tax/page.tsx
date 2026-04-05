"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IndianRupee, TrendingDown, Calculator, FileText, Sparkles, Loader2 } from "lucide-react"
import { invoicesApi, Invoice } from "@/lib/api/invoices"
import { expensesApi, Expense } from "@/lib/api/expenses"

export default function TaxPage() {
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
        console.error('Failed to fetch tax data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function calculateTax(income: number): number {
    // Simplified Indian tax calculation for FY 2024-25 (New Regime)
    if (income <= 300000) return 0
    if (income <= 700000) return (income - 300000) * 0.05
    if (income <= 1000000) return 20000 + (income - 700000) * 0.1
    if (income <= 1200000) return 50000 + (income - 1000000) * 0.15
    if (income <= 1500000) return 80000 + (income - 1200000) * 0.2
    return 140000 + (income - 1500000) * 0.3
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  
  const presumptiveIncome = totalRevenue * 0.5 // 50% under Section 44ADA
  const regularTaxableIncome = totalRevenue - totalExpenses // If calculating normally with expenses
  const taxOnPresumptive = calculateTax(presumptiveIncome)
  const taxOnRegular = calculateTax(regularTaxableIncome)
  const taxSaved = taxOnRegular - taxOnPresumptive

  const taxBreakdown = [
    {
      slab: "Up to ₹3,00,000",
      rate: "0%",
      amount: 0,
    },
    {
      slab: "₹3,00,001 - ₹7,00,000",
      rate: "5%",
      amount: presumptiveIncome > 300000 ? Math.min((presumptiveIncome - 300000), 400000) * 0.05 : 0,
    },
    {
      slab: "₹7,00,001 - ₹10,00,000",
      rate: "10%",
      amount: presumptiveIncome > 700000 ? Math.min((presumptiveIncome - 700000), 300000) * 0.1 : 0,
    },
    {
      slab: "₹10,00,001 - ₹12,00,000",
      rate: "15%",
      amount: presumptiveIncome > 1000000 ? Math.min((presumptiveIncome - 1000000), 200000) * 0.15 : 0,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tax Calculator</h1>
        <p className="text-muted-foreground">
          Estimate your taxes under Section 44ADA (Presumptive Taxation)
        </p>
      </div>

      {/* Tax Savings Highlight Card */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
              <Sparkles className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-success">Tax Savings with Section 44ADA</p>
              <p className="text-3xl font-bold text-success">
                ₹{taxSaved.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You save this amount by using presumptive taxation instead of regular ITR filing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <TrendingDown className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Presumptive Income (50%)</p>
                <p className="text-xl font-bold text-foreground">
                  ₹{presumptiveIncome.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Calculator className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Payable</p>
                <p className="text-xl font-bold text-foreground">
                  ₹{taxOnPresumptive.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                <p className="text-xl font-bold text-foreground">
                  {((taxOnPresumptive / totalRevenue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground">
              Tax Breakdown (New Regime FY 2024-25)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxBreakdown.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.slab}</p>
                    <p className="text-xs text-muted-foreground">Rate: {item.rate}</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <p className="font-semibold text-foreground">Total Tax</p>
                <p className="text-lg font-bold text-primary">
                  ₹{taxOnPresumptive.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground">
              Section 44ADA Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-4">
                <h4 className="font-medium text-foreground">What is Section 44ADA?</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                  Section 44ADA allows freelancers and professionals to declare 50% of gross receipts as income, without maintaining detailed books of accounts.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className="bg-success/10 text-success">Eligible</Badge>
                  <p className="text-sm text-muted-foreground">
                    Professionals with gross receipts up to ₹75 lakhs
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-primary/10 text-primary">Benefit</Badge>
                  <p className="text-sm text-muted-foreground">
                    No need to maintain books of accounts
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="bg-accent/10 text-accent">Simple</Badge>
                  <p className="text-sm text-muted-foreground">
                    File ITR-4 instead of ITR-3
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="text-sm font-medium text-warning">Important Note</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  If your actual expenses are more than 50% of gross receipts, you may benefit more from regular taxation. Consult a CA for personalized advice.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Advance Tax */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            Advance Tax Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { quarter: "Q1", due: "15th June", percent: "15%", amount: taxOnPresumptive * 0.15 },
              { quarter: "Q2", due: "15th Sep", percent: "45%", amount: taxOnPresumptive * 0.30 },
              { quarter: "Q3", due: "15th Dec", percent: "75%", amount: taxOnPresumptive * 0.30 },
              { quarter: "Q4", due: "15th Mar", percent: "100%", amount: taxOnPresumptive * 0.25 },
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 bg-secondary/30 p-4 text-center"
              >
                <p className="text-sm font-medium text-muted-foreground">{item.quarter}</p>
                <p className="text-lg font-bold text-foreground">
                  ₹{Math.round(item.amount).toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Due: {item.due}</p>
                <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
                  {item.percent} cumulative
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
