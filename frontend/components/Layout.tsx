import React from 'react'
import { useRouter } from 'next/router'

export default function Layout({ children }: any){
  const router = useRouter()
  const isLoginPage = router.pathname === '/'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <main className="min-h-screen">{children}</main>
    </div>
  )
}
