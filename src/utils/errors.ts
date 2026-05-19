/**
 * src/utils/errors.ts
 * Helpers para tratamento padronizado de erros.
 */

export interface AppError {
  code: string
  message: string
  details?: unknown
}

export function toAppError(err: unknown): AppError {
  if (err instanceof Error) {
    return { code: 'UNKNOWN', message: err.message }
  }
  if (typeof err === 'string') {
    return { code: 'UNKNOWN', message: err }
  }
  return { code: 'UNKNOWN', message: 'Ocorreu um erro inesperado.' }
}

export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err
  )
}
