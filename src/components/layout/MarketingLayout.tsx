import { Footer } from './Footer'
import { PageLoader } from './PageLoader'

export interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PageLoader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
