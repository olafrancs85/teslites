// context/NotificationsContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  DocumentData,
  QuerySnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";

export type NotificationType =
  | "like"
  | "comment"
  | "project"
  | "message"
  | "reward"
  | string;

export interface AppNotification {
  id: string;
  userId: string;
  type?: NotificationType;
  message: string;
  link?: string | null;
  read?: boolean;
  createdAt?: any; // Firestore Timestamp or null
  [key: string]: any;
}

export interface NotificationsContextShape {
  notifications: AppNotification[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
}

const defaultValue: NotificationsContextShape = {
  notifications: [],
  unreadCount: 0,
  markAllAsRead: async () => {},
};

const NotificationsContext = createContext<NotificationsContextShape>(defaultValue);

export const useNotifications = (): NotificationsContextShape => useContext(NotificationsContext);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const items: AppNotification[] = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          userId: data.userId ?? "",
          type: data.type ?? undefined,
          message: data.message ?? "",
          link: data.link ?? null,
          read: data.read ?? false,
          createdAt: data.createdAt ?? null,
          ...data,
        } as AppNotification;
      });

      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return () => unsub();
  }, [user]);

  const markAllAsRead = async (): Promise<void> => {
    if (!user || notifications.length === 0) return;

    try {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) {
        setUnreadCount(0);
        return;
      }

      // update in parallel safely
      const updates = unread.map((n) =>
        updateDoc(doc(db, "notifications", n.id), {
          read: true,
        })
      );

      await Promise.all(updates);

      // local update so UI reflects immediately
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("Error marking all notifications as read:", err);
    }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
};
