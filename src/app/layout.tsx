import type { ReactNode } from 'react'
import EchoClientProvider from './echo-provider'
import './globals.css'

export const metadata = {
  title: 'AI Cake Designer 🎂',
  description: 'Create custom cake recipes with AI for any occasion',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{fontFamily:'ui-sans-serif,system-ui',background:'#f7f9fc',color:'#111827'}}>
        <EchoClientProvider>
          <main style={{maxWidth:720, margin:'0 auto', padding:24}}>
            {children}
          </main>
        </EchoClientProvider>
      </body>
    </html>
  )
}

