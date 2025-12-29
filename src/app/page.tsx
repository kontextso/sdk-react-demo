"use client";

import { AdsProvider, InlineAd } from "@kontextso/sdk-react";
import { useState } from "react";
import { PUBLISHER_TOKEN, PLACEMENT_CODE } from "./constants";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  height: number;
}

const getRandomId = () => {
  return Date.now() + Math.random().toString(36).substring(2, 15);
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(false);

  const [lastAssistantId, setLastAssistantId] = useState<string | null>(null);

  const [conversationId] = useState(() => getRandomId());
  const [userId] = useState(() => getRandomId());

  const [messages, setMessages] = useState<Message[]>([]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const message = formData.get("message") as string;
    (e.target as HTMLFormElement).reset();

    setMessages((prevMessages) => [...prevMessages, {
      id: getRandomId(),
      role: "user",
      content: message,
      createdAt: new Date(),
      height: 150 + Math.floor(Math.random() * 100)
    }]);

    // simulate loading chat response with the assistant role
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const lastId = getRandomId()
      setMessages((prevMessages) => [...prevMessages, {
        id: lastId,
        role: "assistant",
        content: "This is a test response from the assistant.",
        createdAt: new Date(),
        height: 150 + Math.floor(Math.random() * 100)
      }]);
      setLastAssistantId(lastId);
    }, 1000);
  }
  
  return (
    <div className="container" data-theme={theme}>
      <div className="page">
        <main>
          <AdsProvider
            messages={messages}
            publisherToken={PUBLISHER_TOKEN}
            userId={userId}
            userEmail="test@test.com"
            conversationId={conversationId}
            enabledPlacementCodes={[PLACEMENT_CODE]}
            onEvent={(ev: any) => {
              console.log(ev);
            }}
            /*
            onDebugEvent={(name, state) => {
              if (name === 'format-update-state') {
                return;
              }
              console.log(name, state);
            }}
            */
          >
            <div
              style={{
                backgroundColor: "red",
                minHeight: "500px",
                padding: "10px",
                columnGap: "12px",
                columns: "3",
              }}
            > 

            {lastAssistantId && (
                <InlineAd
                  code={PLACEMENT_CODE}
                  messageId={lastAssistantId}
                  wrapper={(children) => (
                    <div
                      style={{
                        breakInside: "avoid",
                        marginBottom: "12px",
                        background: "white",
                        borderRadius: "8px",
                        padding: "6px",
                        height: "400px",
                      }}
                    >
                      {children}
                    </div>
                  )}
                />
            )}

              {messages
                .filter((message) => message.role === "assistant")
                .map((message) => (
                  <div
                    key={message.id}
                    style={{
                      breakInside: "avoid",
                      marginBottom: "12px",
                      background: "white",
                      borderRadius: "8px",
                      padding: "6px",
                    }}
                  >
                    <img
                      src={`https://picsum.photos/300/${message.height}?random=${message.id}`}
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "6px",
                        display: "block",
                      }}
                      alt="Random image"
                    />
                  </div>
                ))}
            </div>

          </AdsProvider>
        </main>
        <footer>
        {isLoading && <p style={{ textAlign: "center", marginTop: "20px" }}>Loading...</p>}
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea 
              name="message" 
              disabled={isLoading} 
              required 
              rows={5} 
              placeholder="Type your message here..."
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" disabled={isLoading}>Send</button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}
