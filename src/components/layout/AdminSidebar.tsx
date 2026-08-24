'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Ticket,
  ShoppingBag,
  Layers,
  Calendar,
  Mic2,
  LogOut,
  BarChart2,
  Frame,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { ExternalLink } from 'lucide-react'
import { adminSignOutAction } from '@/app/admin/actions'

const NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin/dashboard',    icon: LayoutDashboard },
  { label: 'Vendas',        href: '/admin/compradores',  icon: BarChart2 },
  { label: 'Ingressos',     href: '/admin/ingressos',    icon: Ticket },
  { label: 'Mercadorias',   href: '/admin/order-bumps',  icon: ShoppingBag },
  { label: 'Combos',        href: '/admin/combos',       icon: Layers },
  { label: 'Palestrantes',  href: '/admin/palestrantes', icon: Mic2 },
  { label: 'Programação',   href: '/admin/programacao',  icon: Calendar },
  { label: 'Moldura',       href: '/admin/moldura',      icon: Frame },
  { label: 'Pesquisa',      href: '/admin/pesquisa',     icon: ClipboardList },
  { label: 'Usuários',      href: '/admin/usuarios',     icon: Users },
]

export interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-secondary',
        className,
      )}
      aria-label="Menu administrativo"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/admin/dashboard"
          className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo2.png`}
            alt="O Encontro 2026"
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegação do painel">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Rodapé da sidebar */}
      <div className="border-t border-border p-4 flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver landing page
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={() => adminSignOutAction()}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sair
        </button>
      </div>
    </aside>
  )
}
