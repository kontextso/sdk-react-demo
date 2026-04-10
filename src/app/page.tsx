"use client";

import { AdsProvider, InlineAd, useAds } from "@kontextso/sdk-react";
import { useEffect, useRef, useState } from "react";
import { PUBLISHER_TOKEN, PLACEMENT_CODE } from "./constants";

/**
 * Fires `user.typing.started` exactly once per typing session.
 *
 * A "session" is reset whenever `resetDep` changes — in the demo we
 * pass `isLoading`, so the flag resets on every submit (false → true)
 * and again when the assistant response arrives (true → false).
 * Also resets automatically when the textarea becomes empty (backspace
 * all), so the next character fires again.
 *
 * Handles paste correctly: it fires on any 0 → non-empty transition,
 * not just single-character typing.
 */
function useUserTypingTracker(resetDep: unknown) {
  const { sendUserEvent } = useAds();
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [resetDep]);

  return (value: string) => {
    if (value.length === 0) {
      firedRef.current = false;
      return;
    }
    if (!firedRef.current) {
      sendUserEvent("user.typing.started");
      firedRef.current = true;
      console.log('start typing');
    }
  };
}

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
        <div className="page">
          <header>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              Switch to {theme === "light" ? "Dark" : "Light"} theme
            </button>
          </header>
          <main>
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
          </main>
          <footer>
            <form onSubmit={onSubmit}>
              <UserTextArea isLoading={isLoading} />
              <div>
                <button type="submit" disabled={isLoading}>Send</button>
              </div>
            </form>
          </footer>
        </div>
      </AdsProvider>
    </div>
  );
}


export function UserTextArea({ isLoading }: { isLoading: boolean }) {
  const notifyTyping = useUserTypingTracker(isLoading);

  return (
    <textarea
      name="message"
      disabled={isLoading}
      required
      rows={5}
      placeholder="Type your message here..."
      onChange={(e) => notifyTyping(e.target.value)}
    />
  );
}