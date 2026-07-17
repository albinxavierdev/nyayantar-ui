"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/lib/constants";

const topics = [
  "General support",
  "Account help",
  "Admin access",
  "Privacy request",
  "Security issue",
  "Billing question",
] as const;

export function ContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <div className="card-surface p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm font-medium text-accent1">
        <Icon name="users" size={16} />
        Contact form
      </div>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
        }}
      >
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">
              Full name
            </label>
            <input type="text" name="name" placeholder="Ananya Rao" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text">
              Email address
            </label>
            <input type="email" name="email" placeholder="you@firm.com" className={inputClass} />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-text">
            Topic
          </label>
          <select name="topic" defaultValue="General support" className={inputClass}>
            {topics.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-text">
            Message
          </label>
          <textarea
            name="message"
            rows={6}
            placeholder="Tell us what you need help with and we’ll route it to the right place."
            className={`${inputClass} resize-none`}
          />
        </div>

        <Button type="submit" size="lg" showArrow className="w-full">
          Send message
        </Button>
      </form>

      {sent && (
        <div className="mt-5 rounded-2xl border border-accent1/30 bg-accent1/8 px-4 py-3 text-sm text-text">
          Thanks. Your message has been captured and routed.
        </div>
      )}
    </div>
  );
}
