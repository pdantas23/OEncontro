'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção: reportar ao Sentry (T122)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center"
        >
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">Algo deu errado</p>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro inesperado. Tente novamente.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
