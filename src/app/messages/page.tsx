"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const toId = params.get("to");
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(toId);
  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch("/api/messages").then((r) => r.json()).then((d) => d.ok && setConversations(d.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    if (toId) setActiveId(toId);
  }, [toId]);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/messages/${activeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setOther(d.other);
          setMessages(d.messages);
        }
      })
      .catch(() => {});
  }, [activeId]);

  async function send() {
    if (!text.trim() || !activeId) return;
    const r = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeId, body: text }),
    });
    const d = await r.json();
    if (d.ok) {
      setMessages((m) => [...m, d.message]);
      setText("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-extrabold text-ocean-900 dark:text-white">Messages 💬</h1>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Conversations */}
        <div className="card max-h-[70vh] overflow-y-auto p-2">
          {conversations.length === 0 && <p className="p-4 text-sm text-neutral-400">Aucune conversation pour le moment.</p>}
          {conversations.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${activeId === c.id ? "bg-ocean-50 dark:bg-night-700" : "hover:bg-cream-100 dark:hover:bg-night-700"}`}>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-cream-100 dark:bg-night-700">{c.isCourier ? "🏍️" : "🙂"}</span>
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">{c.name}</p>
                {c.unread > 0 && <span className="badge bg-red-100 text-red-600">{c.unread} non lu</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Fil */}
        <div className="card flex flex-col">
          {!activeId ? (
            <div className="grid flex-1 place-items-center p-10 text-center text-neutral-400">
              <div><p className="text-5xl">💬</p><p className="mt-2">Choisis une conversation, ou contacte un vendeur depuis une annonce.</p></div>
            </div>
          ) : (
            <>
              <div className="border-b border-cream-200 p-3 dark:border-night-700">
                <p className="font-bold text-ocean-900 dark:text-white">{other?.name}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "50vh" }}>
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId === activeId ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.senderId === activeId ? "bg-cream-100 text-ocean-900 dark:bg-night-700 dark:text-white" : "bg-ocean-500 text-white"}`}>
                      {m.body}
                      {m.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.image} alt="" className="mt-2 max-h-40 rounded-xl" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-cream-200 p-3 dark:border-night-700">
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Écris ton message…" />
                <button onClick={send} className="btn-primary shrink-0">Envoyer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="px-4 py-10 text-center text-neutral-400">Chargement…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
