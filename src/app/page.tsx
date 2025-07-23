"use client";

import { AdsProvider, InlineAd } from "@kontextso/sdk-react";
import { useState } from "react";
import { PUBLISHER_TOKEN, PLACEMENT_CODE } from "./constants";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

const getRandomId = () => {
  return Date.now() + Math.random().toString(36).substring(2, 15);
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(false);

  const [conversationId] = useState(() => getRandomId());
  const [userId] = useState(() => getRandomId());

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: getRandomId(),
      role: "user",
      content: "Hello, how are you?",
      createdAt: new Date()
    },
    {
      id: getRandomId(),
      role: "assistant",
      content: "I'm good, thank you!",
      createdAt: new Date(new Date().getTime() + 1000)
    }
  ]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;
    (e.target as HTMLFormElement).reset();

    setMessages((prevMessages) => [...prevMessages, {
      id: getRandomId(),
      role: "user",
      content: message,
      createdAt: new Date()
    }]);

    // simulate loading chat response with the assistant role
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      setMessages((prevMessages) => [...prevMessages, {
        id: getRandomId(),
        role: "assistant",
        content: "This is a test response from the assistant.",
        createdAt: new Date()
      }]);
    }, 1000);
  }
  
  return (
    <div className="container" data-theme={theme}>
      <div className="page">
        <header>
          <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            Switch to {theme === "light" ? "Dark" : "Light"} theme
          </button>
        </header>
        <main>
          <AdsProvider
            messages={messages}
            publisherToken={PUBLISHER_TOKEN}
            userId={userId}
            conversationId={conversationId}
            enabledPlacementCodes={[PLACEMENT_CODE]}
          >
            <div>
              {messages.map((message) => (
                <div key={message.id}>
                  <p><strong>{message.role}</strong>: </p>
                  <p>{message.content}</p>

                  <InlineAd
                    code={PLACEMENT_CODE}
                    messageId={message.id}
                  />
                </div>
              ))}

              {isLoading && <p>Loading...</p>}
          </div>
          </AdsProvider>
        </main>
        <footer>
          <form onSubmit={onSubmit}>
            <textarea name="message" disabled={isLoading} required rows={5} />
            <div>
              <button type="submit" disabled={isLoading}>Send</button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}
