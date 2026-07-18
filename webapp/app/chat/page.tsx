"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ChatApp } from "@/components/chat/ChatApp";
import { ConsentGate } from "@/components/auth/ConsentGate";

// Client-side guard: unauthenticated users are sent to /login.
// The backend remains the authoritative gate for all API calls.
export default function ChatPage() {
  const { loggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn) {
      router.replace("/login");
    }
  }, [loggedIn, router]);

  if (!loggedIn) {
    return null;
  }

  return (
    <main className="page-bg h-[100dvh] overflow-hidden">
      <ConsentGate>
        <ChatApp />
      </ConsentGate>
    </main>
  );
}
