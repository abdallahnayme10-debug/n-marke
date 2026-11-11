"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/format";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      if (d.ok) {
        setNotifications(d.notifications);
        setUnread(d.unread);
      }
    }).catch(() => {});
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ocean-900 dark:text-white">Notifications 🔔</h1>
        {unread > 0 && <button onClick={markAll} className="btn-outline py-2 text-xs">Tout marquer comme lu</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-10 text-center text-neutral-500">
          <p className="text-5xl">🔔</p>
          <p className="mt-2">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link key={n.id} href={n.link || "#"} className={`card flex gap-3 p-4 ${!n.read ? "ring-2 ring-ocean-200 dark:ring-night-600" : ""}`}>
              <div className="flex-1">
                <p className="font-bold text-ocean-900 dark:text-white">{n.title}</p>
                <p className="text-sm text-neutral-500">{n.body}</p>
                <p className="mt-1 text-xs text-neutral-400">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-ocean-400" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
