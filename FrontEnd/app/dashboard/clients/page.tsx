"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, Search, Mail, MoreHorizontal, AlertTriangle, CheckCircle, Clock, Loader2, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { clientsApi, Client } from "@/lib/api/clients"

type RiskLevel = "low" | "medium" | "high" | "critical"

const getRiskLevel = (score: number): RiskLevel => {
  if (score < 25) return "low"
  if (score < 50) return "medium"
  if (score < 75) return "high"
  return "critical"
}

const riskConfig: Record<RiskLevel, { label: string; className: string; icon: typeof AlertTriangle }> = {
  low: {
    label: "Low Risk",
    className: "bg-success/10 text-success",
    icon: CheckCircle,
  },
  medium: {
    label: "Medium Risk",
    className: "bg-warning/10 text-warning",
    icon: Clock,
  },
  high: {
    label: "High Risk",
    className: "bg-destructive/10 text-destructive",
    icon: AlertTriangle,
  },
  critical: {
    label: "Critical",
    className: "bg-destructive/20 text-destructive",
    icon: AlertTriangle,
  },
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  })

  const fetchClients = useCallback(async () => {
    try {
      const data = await clientsApi.list()
      setClients(data)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleAddClient = async () => {
    if (!newClient.name) return

    setSubmitting(true)
    try {
      await clientsApi.create({
        name: newClient.name,
        email: newClient.email || undefined,
        phone: newClient.phone || undefined,
        company: newClient.company || undefined,
      })

      setNewClient({ name: "", email: "", phone: "", company: "" })
      setIsDialogOpen(false)
      fetchClients()
    } catch (error) {
      console.error('Failed to add client:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    try {
      await clientsApi.delete(id)
      setClients(clients.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Failed to delete client:', error)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const totalRevenue = clients.reduce((sum, client) => sum + Number(client.total_paid), 0)
  const totalPending = clients.reduce((sum, client) => sum + (Number(client.total_billed) - Number(client.total_paid)), 0)
  const highRiskClients = clients.filter((c) => c.risk_score >= 50).length

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
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client relationships and payment history
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Name *</Label>
                <Input
                  id="name"
                  placeholder="Client name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-foreground">Company</Label>
                <Input
                  id="company"
                  placeholder="Company name"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleAddClient}
                disabled={submitting || !newClient.name}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {submitting ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold text-foreground">{clients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="text-2xl font-bold text-warning">
              ₹{totalPending.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">High Risk Clients</p>
            <p className="text-2xl font-bold text-destructive">{highRiskClients}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-input border-border"
        />
      </div>

      {/* Clients Table */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-base font-medium text-foreground">
            All Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No clients yet. Start by adding your first client above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Client</TableHead>
                    <TableHead className="text-muted-foreground text-right">Revenue</TableHead>
                    <TableHead className="text-muted-foreground text-right">Pending</TableHead>
                    <TableHead className="text-muted-foreground">Avg. Payment Delay</TableHead>
                    <TableHead className="text-muted-foreground">Risk Score</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const riskLevel = getRiskLevel(client.risk_score)
                    const RiskIcon = riskConfig[riskLevel].icon
                    const pendingAmount = Number(client.total_billed) - Number(client.total_paid)
                    return (
                      <TableRow
                        key={client.id}
                        className="border-border hover:bg-secondary/50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            {client.email && (
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {client.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-foreground">
                            ₹{Number(client.total_paid).toLocaleString("en-IN")}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p
                            className={cn(
                              "font-semibold",
                              pendingAmount > 0
                                ? "text-warning"
                                : "text-muted-foreground"
                            )}
                          >
                            {pendingAmount > 0
                              ? `₹${pendingAmount.toLocaleString("en-IN")}`
                              : "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-16 rounded-full bg-secondary overflow-hidden"
                              )}
                            >
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  client.risk_score < 25
                                    ? "bg-success"
                                    : client.risk_score < 50
                                    ? "bg-warning"
                                    : "bg-destructive"
                                )}
                                style={{
                                  width: `${client.risk_score}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {client.risk_score}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "gap-1",
                              riskConfig[riskLevel].className
                            )}
                          >
                            <RiskIcon className="h-3 w-3" />
                            {riskConfig[riskLevel].label}
                          </Badge>
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
                              {client.email && (
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Legend */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Risk Score Legend</p>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">
                Low Risk: Payment delay &lt; 10 days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-sm text-muted-foreground">
                Medium Risk: Payment delay 10-25 days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                High Risk: Payment delay &gt; 25 days
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
