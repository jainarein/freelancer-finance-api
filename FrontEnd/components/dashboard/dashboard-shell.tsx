"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
  user: {
    email?: string
    full_name?: string
  } | null
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar />
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-2 top-4 rounded-lg p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
