'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { cn } from '@/utils/cn'

export interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AdminLayout({ children, className }: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className={cn('flex h-screen bg-background text-foreground', className)}>
      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:shrink-0">
        <AdminSidebar />
      </div>

      {/* Sidebar mobile (Sheet) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar className="border-0" />
        </SheetContent>
      </Sheet>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-secondary px-4 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-semibold text-primary">
            {/* Task Final TF03 */}
            Painel Admin
          </span>
        </header>

        {/* Área de scroll */}
        <main className="flex-1 overflow-y-auto" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  )
}
