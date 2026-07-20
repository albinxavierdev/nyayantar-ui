"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { PlansPanel } from "@/components/upgrade/PlansPanel";
import { useAuth } from "@/components/providers/AuthProvider";

type UpgradeContextValue = {
  openModal: () => void;
  closeModal: () => void;
};

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const { loggedIn, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const wasLoggedIn = useRef<boolean | null>(null);

  // Show the pricing window ONCE per login/registration event for
  // non-purchased users. A sessionStorage flag prevents it from re-popping on
  // a plain page refresh within the same tab session — it only appears again
  // after a fresh login or account creation. Purchased users never see it.
  useEffect(() => {
    if (wasLoggedIn.current === null) {
      wasLoggedIn.current = loggedIn;
      if (loggedIn && !user?.purchased) {
        try {
          if (!sessionStorage.getItem("ny_pricing_shown")) {
            setModalOpen(true);
            sessionStorage.setItem("ny_pricing_shown", "1");
          }
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (!wasLoggedIn.current && loggedIn) {
      wasLoggedIn.current = true;
      try {
        sessionStorage.removeItem("ny_pricing_shown");
      } catch {
        /* ignore */
      }
      if (!user?.purchased) setModalOpen(true);
    } else {
      wasLoggedIn.current = loggedIn;
    }
  }, [loggedIn, user?.purchased]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  return (
    <UpgradeContext.Provider value={{ openModal, closeModal }}>
      {children}

      {/* Pricing window — shown automatically after login/registration for
          non-purchased users. Contains the 3 options: Free Trial,
          Individual, Organization. */}
      <AnimatePresence>
        {modalOpen && !user?.purchased && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-surface p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-text-muted hover:bg-surface-tint hover:text-text"
              >
                <Icon name="close" size={18} />
              </button>
              <div className="mb-6 text-center">
                <p className="text-sm font-medium text-accent1">Nyayantar Plans</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight-2 text-text md:text-3xl">
                  Choose how you work.
                </h2>
              </div>
              <PlansPanel onClose={closeModal} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) {
    return { openModal: () => {}, closeModal: () => {} };
  }
  return ctx;
}
