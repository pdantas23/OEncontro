'use client'

import { useEffect } from 'react'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// static export: window.location em vez de router.replace
export default function AdminLoginRedirect() {
  useEffect(() => {
    window.location.replace(`${basePath}/login`)
  }, [])
  return null
}
