import Echo from '@merit-systems/echo-next-sdk'

// Create server bindings to Echo providers (e.g., OpenAI via Echo)
export const { handlers, openai, anthropic } = Echo({
  appId: process.env.NEXT_PUBLIC_ECHO_APP_ID || '03cd584a-fa10-4322-8ec1-39254fd33359'
})
