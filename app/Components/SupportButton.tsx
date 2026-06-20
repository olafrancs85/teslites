"use client";

import { doc, collection, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

type Props = {
  projectId: string;
  user: User | null;
};

export default function SupportButton({ projectId, user }: Props) {
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supportsRef = collection(db, "socialImpact", projectId, "supports");
    const unsub = onSnapshot(supportsRef, (snap) => {
      setCount(snap.size);
      if (user) {
        setSupported(snap.docs.some((d) => d.id === user.uid));
      }
    });
    return () => unsub();
  }, [projectId, user]);

  const toggleSupport = async () => {
    if (!user) return alert("Login to support this project");

    const supportRef = doc(db, "socialImpact", projectId, "supports", user.uid);
    if (supported) {
      await deleteDoc(supportRef);
    } else {
      await setDoc(supportRef, { supportedAt: Date.now() });
    }
  };

  return (
    <button
      onClick={toggleSupport}
      className={`px-4 py-2 rounded-lg text-white ${supported ? "bg-green-600" : "bg-blue-600"}`}
    >
      {supported ? "Supported" : "Support"} ({count})
    </button>
  );
}
