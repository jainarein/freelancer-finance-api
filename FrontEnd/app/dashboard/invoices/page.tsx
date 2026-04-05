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
import { Plus, Download, Eye, MoreHorizontal, Loader2, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { invoicesApi, Invoice, InvoiceStatus } from "@/lib/api/invoices"
import { clientsApi, Client } from "@/lib/api/clients"

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-secondary/10 text-secondary hover:bg-secondary/20",
  },
  sent: {
    label: "Sent",
    className: "bg-info/10 text-info hover:bg-info/20",
  },
  paid: {
    label: "Paid",
    className: "bg-success/10 text-success hover:bg-success/20",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted/10 text-muted-foreground hover:bg-muted/20",
  },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    description: "",
    amount: "",
    client_name: "",
  })

  const fetchData = useCallback(async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        invoicesApi.list(),
        clientsApi.list()
      ])
      setInvoices(invoicesRes)
      setClients(clientsRes)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddInvoice = async () => {
    if (!newInvoice.description || !newInvoice.amount || !newInvoice.client_name) return

    setSubmitting(true)
    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      await invoicesApi.create({
        client_name: newInvoice.client_name,
        description: newInvoice.description,
        base_amount: parseFloat(newInvoice.amount),
        due_date: dueDate.toISOString().split("T")[0],
      })

      setNewInvoice({ description: "", amount: "", client_name: "" })
      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to create invoice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      await invoicesApi.delete(id)
      setInvoices(invoices.filter((inv) => inv.id !== id))
    } catch (error) {
      console.error('Failed to delete invoice:', error)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    try {
      await invoicesApi.update(id, { status: "paid" })
      fetchData()
    } catch (error) {
      console.error('Failed to update invoice:', error)
    }
  }

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter)

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + Number(inv.base_amount), 0)
  const totalGst = filteredInvoices.reduce((sum, inv) => sum + Number(inv.gst_amount), 0)
  const pendingAmount = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, inv) => sum + Number(inv.base_amount), 0)

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
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">
            Manage and track your invoices
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description *</Label>
                <Input
                  id="description"
                  placeholder="Invoice description"
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-foreground">Amount (INR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  className="bg-input border-border"
                />
                {newInvoice.amount && (
                  <p className="text-xs text-muted-foreground">
                    GST (18%): ₹{(parseFloat(newInvoice.amount) * 0.18).toLocaleString("en-IN")} | 
                    Total: ₹{(parseFloat(newInvoice.amount) * 1.18).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Client *</Label>
                  <Select
                    value={newInvoice.client_name}
                    onValueChange={(value) => setNewInvoice({ ...newInvoice, client_name: value })}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {clients.length === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-foreground">Client Name *</Label>
                  <Input
                    id="client_name"
                    placeholder="Client name"
                    value={newInvoice.client_name}
                    onChange={(e) => setNewInvoice({ ...newInvoice, client_name: e.target.value })}
                    className="bg-input border-border"
                  />
                </div>
              )}
              <Button
                onClick={handleAddInvoice}
                disabled={submitting || !newInvoice.description || !newInvoice.amount || !newInvoice.client_name}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {submitting ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">GST Collected</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalGst.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold text-warning">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium text-foreground">
            All Invoices
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-input border-border">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No invoices yet. Create your first invoice above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-right">GST (18%)</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="border-border hover:bg-secondary/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="text-foreground">{invoice.description || "-"}</TableCell>
                      <TableCell className="text-right text-foreground">
                        ₹{Number(invoice.base_amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₹{Number(invoice.gst_amount).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusConfig[invoice.status].className}
                        >
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
