import type { Metadata } from 'next'
import { Fira_Sans, Fira_Code } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const firaSans = Fira_Sans({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fira-sans'
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira-code'
})

export const metadata: Metadata = {
  title: 'Lovable UltraX Admin',
  description: 'Premium SaaS Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${firaSans.variable} ${firaCode.variable} font-sans`}>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
