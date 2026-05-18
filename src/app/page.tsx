'use client'

import { AdsProvider, InlineAd, useAds } from '@kontextso/sdk-react'
import { useMemo, useState } from 'react'
import { PUBLISHER_TOKEN, PLACEMENT_CODE } from './constants'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

const getRandomId = () => Date.now() + Math.random().toString(36).substring(2, 15)

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Session identity is stable for the lifetime of the page.
  const userId = useMemo(() => getRandomId(), [])
  const conversationId = useMemo(() => getRandomId(), [])

  return (
    <div className="container" data-theme={theme}>
      <div className="page">
        <header>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Switch to {theme === 'light' ? 'Dark' : 'Light'} theme
          </button>
        </header>
        <AdsProvider
          publisherToken={PUBLISHER_TOKEN}
          userId={userId}
          conversationId={conversationId}
          onEvent={(ev) => {
            console.log(ev)
          }}
        >
          <Chat theme={theme} />
        </AdsProvider>
      </div>
    </div>
  )
}

function Chat({ theme }: { theme: 'light' | 'dark' }) {
  const { addMessage } = useAds()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message])
    addMessage(message)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const content = (formData.get('message') as string)?.trim()
    if (!content) return
    form.reset()

    appendMessage({
      id: getRandomId(),
      role: 'user',
      content,
      createdAt: new Date(),
    })

    // Simulate a chat response from the assistant.
    setIsLoading(true)
    setTimeout(() => {
      appendMessage({
        id: getRandomId(),
        role: 'assistant',
        content: 'This is a test response from the assistant.',
        createdAt: new Date(),
      })
      setIsLoading(false)
    }, 5000)
  }

  return (
    <>
      <main>
        <div>
          {messages.map((m) => (
            <div key={m.id}>
              <p>
                <strong>{m.role}</strong>:
              </p>
              <p>{m.content}</p>
              {m.role === 'assistant' && m.id === lastAssistantId && !isLoading && (
                <InlineAd code={PLACEMENT_CODE} messageId={m.id} theme={`v2-${theme}`} />
              )}
            </div>
          ))}
          {isLoading && <p>Loading...</p>}
        </div>
      </main>
      <footer>
        <form onSubmit={onSubmit}>
          <textarea name="message" disabled={isLoading} required rows={5} placeholder="Type your message here..." />
          <div>
            <button type="submit" disabled={isLoading}>
              Send
            </button>
          </div>
        </form>
      </footer>
    </>
  )
}
