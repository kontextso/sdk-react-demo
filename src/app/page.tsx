"use client";

import { AdsProvider, InlineAd, useAds } from "@kontextso/sdk-react";
import { useState } from "react";
import { PUBLISHER_TOKEN, PLACEMENT_CODE } from "./constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const getRandomId = () => {
  return Date.now() + Math.random().toString(36).substring(2, 15);
}

/**
 * Upsell dialog, opened when the user clicks an ad. It stands in for your own
 * subscription flow.
 */
function UpsellModal({ onClose }: { onClose: () => void }) {
  const { trackEvent } = useAds();

  const onSubscribe = () => {
    // 1. Your app completes the subscription here.

    // 2. Tell Kontext about it. The SDK adds the publisher token, user id
    //    and session id, so the event type is all you pass.
    trackEvent("user.subscribed");

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Go Premium</h2>
        <p>Faster replies, better memory and more regenerations.</p>
        <button type="button" onClick={onSubscribe}>Subscribe</button>
        <button type="button" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(false);

  const [conversationId] = useState(() => getRandomId());
  const [userId] = useState(() => getRandomId());

  const [messages, setMessages] = useState<Message[]>([]);
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);

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
    }, 5000);
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
            userEmail="test@test.com"
            conversationId={conversationId}
            enabledPlacementCodes={[PLACEMENT_CODE]}
            onEvent={(ev) => {
              console.log(ev);

              // The upsell flow starts with a click on the ad.
              if (ev.name === "ad.clicked") {
                setIsUpsellOpen(true);
              }
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
            {isUpsellOpen && <UpsellModal onClose={() => setIsUpsellOpen(false)} />}
            <div>
              {messages.map((message) => (
                <div key={message.id}>
                  <p><strong>{message.role}</strong>: </p>
                  <p>{message.content}</p>

                  <InlineAd
                    code={PLACEMENT_CODE}
                    messageId={message.id}
                    theme={`v2-${theme}`}
                  />
                </div>
              ))}

              {isLoading && <p>Loading...</p>}
          </div>
          </AdsProvider>
        </main>
        <footer>
          <form onSubmit={onSubmit}>
            <textarea 
              name="message" 
              disabled={isLoading} 
              required 
              rows={5} 
              placeholder="Type your message here..."
            />
            <div>
              <button type="submit" disabled={isLoading}>Send</button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}
