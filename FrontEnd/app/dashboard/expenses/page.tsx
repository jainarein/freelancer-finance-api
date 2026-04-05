"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { expensesApi, Expense } from "@/lib/api/expenses"

const categories = [
  "equipment",
  "software",
  "internet",
  "travel",
  "coworking",
  "education",
  "marketing",
  "utilities",
  "food",
  "other",
]

const categoryLabels: Record<string, string> = {
  equipment: "Equipment",
  software: "Software & Tools",
  internet: "Internet & Phone",
  travel: "Travel",
  coworking: "Coworking",
  education: "Education",
  marketing: "Marketing",
  utilities: "Utilities",
  food: "Food",
  other: "Other",
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [submitting, setSubmitting] = useState(false)
  const [newExpense, setNewExpense] = useState({
    title: "",
    amount: "",
    gst_paid: "",
  })

  const fetchExpenses = useCallback(async () => {
    try {
      const data = await expensesApi.list()
      setExpenses(data)
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleAddExpense = async () => {
    if (!newExpense.title || !newExpense.amount) return

    setSubmitting(true)
    try {
      await expensesApi.create({
        title: newExpense.title,
        amount: parseFloat(newExpense.amount),
        expense_date: new Date().toISOString().split("T")[0],
        gst_paid: newExpense.gst_paid ? parseFloat(newExpense.gst_paid) : 0,
      })

      setNewExpense({ title: "", amount: "", gst_paid: "" })
      setIsDialogOpen(false)
      fetchExpenses()
    } catch (error) {
      console.error('Failed to add expense:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesApi.delete(id)
      setExpenses(expenses.filter((exp) => exp.id !== id))
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const filteredExpenses =
    selectedCategory === "all"
      ? expenses
      : expenses.filter((exp) => exp.category === selectedCategory)

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  )
  const deductibleExpenses = filteredExpenses
    .filter((exp) => exp.is_tax_deductible)
    .reduce((sum, exp) => sum + Number(exp.amount), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Tracker</h1>
          <p className="text-muted-foreground">
            Track and categorize your business expenses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Adobe subscription, laptop"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">Category will be auto-detected from title</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground">Amount (INR)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gst_paid" className="text-foreground">GST Paid (optional)</Label>
                <Input
                  id="gst_paid"
                  type="number"
                  placeholder="0"
                  value={newExpense.gst_paid}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, gst_paid: e.target.value })
                  }
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleAddExpense}
                disabled={submitting || !newExpense.title || !newExpense.amount}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {submitting ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalExpenses.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Deductible Amount</p>
            <p className="text-2xl font-bold text-success">
              ₹{deductibleExpenses.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Non-Deductible</p>
            <p className="text-2xl font-bold text-destructive">
              ₹{(totalExpenses - deductibleExpenses).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "cursor-pointer transition-colors",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant="secondary"
            className={cn(
              "cursor-pointer transition-colors",
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            onClick={() => setSelectedCategory(cat)}
          >
            {categoryLabels[cat] || cat}
          </Badge>
        ))}
      </div>

      {/* Expenses Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses yet. Start tracking your expenses by adding one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                      className="border-border hover:bg-secondary/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {expense.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-secondary text-secondary-foreground"
                        >
                          {categoryLabels[expense.category] || expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        ₹{Number(expense.amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(expense.expense_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            expense.is_tax_deductible
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {expense.is_tax_deductible ? "Deductible" : "Non-Deductible"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
