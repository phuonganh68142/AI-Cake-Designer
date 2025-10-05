'use client'
import * as React from 'react'
import { EchoProvider } from '@merit-systems/echo-next-sdk/client'

export default function EchoClientProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_ECHO_APP_ID
  if (!appId) console.warn('Missing NEXT_PUBLIC_ECHO_APP_ID')

  return (
    <EchoProvider
      config={{ appId: appId || '', basePath: '/api/echo' }}
    >
      {children}
    </EchoProvider>
  )
}
