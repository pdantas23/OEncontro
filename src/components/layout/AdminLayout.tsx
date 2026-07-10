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
        <SheetContent side="right" className="w-64 p-0">
          <AdminSidebar className="border-0" />
        </SheetContent>
      </Sheet>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header mobile */}
        <header className="relative flex h-16 items-center justify-center border-b border-border bg-secondary px-4 lg:hidden">
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo2.png`}
            alt="O Encontro 2026"
            className="h-7 w-auto"
          />
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="absolute right-4 rounded p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Área de scroll */}
        <main className="flex-1 overflow-y-auto" id="admin-main">
          {children}
        </main>
      </div>
    </div>
  )
}
