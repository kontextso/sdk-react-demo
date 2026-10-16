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
 * The character the user is chatting with. The ad line is written in this
 * character's voice, so pass the real one. Only id and name are required.
 */
const CHARACTER = {
  id: "char-demo-1",
  name: "Mira",
  greeting: "The lantern flickers as I look up from the map. You made it. Ready to go?",
  persona: "A calm, dry-witted cartographer who guides travellers through a haunted forest.",
  tags: ["fantasy", "adventure"],
  isNsfw: false,
};

/**
 * Upsell dialog, opened when the user clicks an ad. It stands in for your own
 * subscription flow.
 */
function UpsellModal({ url, adId, onClose }: { url: string; adId: string; onClose: () => void }) {
  const { trackEvent } = useAds();

  const onSubscribe = () => {
    // 1. Your app completes the subscription here.

    // 2. Tell Kontext about it. The SDK adds the publisher token, user id
    //    and session id. adId is the id from the ad.clicked event, so we can
    //    tie the purchase to the ad. Leave it out when the user did not come from an ad.
    trackEvent("user.subscribed", { adId });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Go Premium</h2>
        <p>Faster replies, better memory and more regenerations.</p>
        <p>Your app would navigate to {url}</p>
        <button type="button" onClick={onSubscribe}>Subscribe</button>
        <button type="button" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}

/**
 * Assistant message with the two upsell triggers. Both keep the message id, so the ad below
 * stays where it is; only an event goes to the ad server.
 */
function AssistantMessage({
  message,
  onChange,
}: {
  message: Message;
  onChange: (id: string, content: string) => void;
}) {
  const { trackEvent } = useAds();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [runs, setRuns] = useState(1);

  const onSave = () => {
    // The edited text is only stored in the app, nothing else changes.
    onChange(message.id, draft);
    setIsEditing(false);
    trackEvent("user.edited.message");
  };

  const onRerun = () => {
    // A new copy of the reply replaces the old one under the same id.
    const run = runs + 1;
    setRuns(run);
    onChange(message.id, `This is a better response from the assistant (take ${run}).`);
    trackEvent("user.clicked.rerun");
  };

  if (isEditing) {
    return (
      <div>
        <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <div>
          <button type="button" onClick={onSave}>Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p>{message.content}</p>
      <div>
        <button type="button" onClick={() => { setDraft(message.content); setIsEditing(true); }}>Edit</button>
        <button type="button" onClick={onRerun}>Rerun</button>
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
  const [upsell, setUpsell] = useState<{ url: string; adId: string } | null>(null);

  const updateMessage = (id: string, content: string) => {
    setMessages((prevMessages) => prevMessages.map((m) => (m.id === id ? { ...m, content } : m)));
  };

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
            userEmail="test@test.com"
            conversationId={conversationId}
            character={CHARACTER}
            enabledPlacementCodes={[PLACEMENT_CODE]}
            onEvent={(ev) => {
              console.log(ev);

              // A click on an upsell ad opens no tab. Only upsell ads report
              // area "purchase-button"; the event also carries the landing page
              // (https://janitorai.com/plus) and your app navigates there.
              // The demo opens its subscribe modal instead of leaving the page.
              // Keep the ad id (payload.id): it goes with the user.subscribed event.
              if (
                ev.name === "ad.clicked" &&
                ev.payload &&
                "area" in ev.payload &&
                ev.payload.area === "purchase-button"
              ) {
                setUpsell({ url: ev.payload.url, adId: ev.payload.id });
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
            {upsell && <UpsellModal {...upsell} onClose={() => setUpsell(null)} />}
            <div>
              {messages.map((message) => (
                <div key={message.id}>
                  <p><strong>{message.role}</strong>: </p>
                  {message.role === "assistant" ? (
                    <AssistantMessage message={message} onChange={updateMessage} />
                  ) : (
                    <p>{message.content}</p>
                  )}

                  {/* "dark" or "light": the ad text colours follow the app theme. */}
                  <InlineAd
                    code={PLACEMENT_CODE}
                    messageId={message.id}
                    theme={theme}
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
