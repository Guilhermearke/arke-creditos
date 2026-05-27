import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arke Keep',
  description: 'Sistema de gestão de créditos Keep da Arke',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-[#F8F8F6] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
