import { addDoc, collection, serverTimestamp } from "firebase/firestore";
// @ts-ignore: module '../firebase' may be untyped or absent in this environment
import { db } from "../firebase";

export type NotificationType =
  | "like"
  | "comment"
  | "project"
  | "message"
  | "reward";

interface NotifyProps {
  userId: string;       // who receives it
  type: NotificationType;
  message: string;      // what to show in dropdown
  link?: string;        // where to go when clicked
}

export async function sendNotification({ userId, type, message, link }: NotifyProps) {
  if (!userId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      message,
      link: link || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Notification Error:", error);
  }
}
