"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthPage } from "@/components/auth/AuthPage";

export default function RegisterPage() {
  const { loggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loggedIn) {
      router.replace("/chat");
    }
  }, [loggedIn, router]);

  if (loggedIn) {
    return null;
  }

  return <AuthPage mode="register" />;
}
