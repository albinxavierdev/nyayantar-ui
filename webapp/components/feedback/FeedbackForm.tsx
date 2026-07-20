"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { inputClass } from "@/lib/constants";
import { useAuth } from "@/components/providers/AuthProvider";

const categories = ["Product", "Login", "Admin", "Security", "Legal", "Other"] as const;

export function FeedbackForm() {
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(4);
  const { loggedIn } = useAuth();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card-surface p-6 md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-accent1">
          <Icon name="quote" size={16} />
          Share feedback
        </div>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
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
                Work email
              </label>
              <input type="email" name="email" placeholder="you@firm.com" className={inputClass} />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-text">
              Category
            </label>
            <select name="category" className={inputClass} defaultValue="Product">
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-text">
              Rating
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold framer-transition ${
                    rating === value
                      ? "border-accent1 bg-accent1 text-white"
                      : "border-border bg-surface text-text-muted hover:border-text/30 hover:text-text"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-text">
              Message
            </label>
            <textarea
              name="message"
              rows={6}
              placeholder="Tell us what feels unclear, what should be improved, or what you would like to see next."
              className={`${inputClass} resize-none`}
            />
          </div>

          <Button type="submit" size="lg" showArrow className="w-full">
            Send feedback
          </Button>
        </form>

        {submitted && (
          <div className="mt-5 rounded-2xl border border-accent1/30 bg-accent1/8 px-4 py-3 text-sm text-text">
            Thanks for the note. It has been captured for review.
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">What we use it for</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-text-muted">
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-1 text-accent1" />
              Improve the product flow and remove friction.
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-1 text-accent1" />
              Triage legal and security concerns faster.
            </li>
            <li className="flex gap-2">
              <Icon name="check" size={16} className="mt-1 text-accent1" />
              Track policy updates requested by the team.
            </li>
          </ul>
        </div>

        <div className="card-surface p-6">
          <p className="text-sm font-medium text-accent1">Need to reach us now?</p>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Use the admin panel for internal review, or head to the login page if you
            want to continue from an existing account.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button href="/admin" variant="secondary" size="md" className="w-full">
              Open admin panel
            </Button>
            {!loggedIn && (
              <Button href="/pricing" size="md" showArrow className="w-full">
                See plans
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
