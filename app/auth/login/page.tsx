// @ts-nocheck
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8F6] px-5 py-10">
      <section className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Arke</h1>
            <p className="mt-2 text-gray-600">Sistema Keep de Créditos</p>
          </header>

          <Suspense>
            <LoginForm />
          </Suspense>

          <footer className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-center text-xs text-gray-600">
              Demo: Use o email de admin criado no Supabase
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}
