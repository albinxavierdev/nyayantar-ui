import type { IconName } from "@/components/ui/Icon";

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted/60 framer-transition focus:border-accent1/50 focus:outline-none focus:ring-2 focus:ring-accent1/20";

export const chatThreads = [
  { id: "t1", title: "Non-compete enforceability", active: true },
  { id: "t2", title: "Precedent search — §27 IPC", active: false },
  { id: "t3", title: "Draft: Mutual NDA", active: false },
  { id: "t4", title: "Citation check — Bombay HC", active: false },
];

export type Thread = typeof chatThreads[number];

export type Role = "user" | "assistant";

export type Message = {
  id: number;
  role: Role;
  text: string;
  citations?: string[];
};

export const initialMessages: Message[] = [
  {
    id: 1,
    role: "user",
    text: "Is a 12-month non-compete enforceable in Maharashtra?",
  },
  {
    id: 2,
    role: "assistant",
    text: "Under §27 of the Indian Contract Act, restraints of trade are void unless reasonable. A 12-month non-compete tied to a specific region is generally upheld by the Bombay HC.",
    citations: ["§27 Indian Contract Act", "Bombay HC · 2019"],
  },
  {
    id: 3,
    role: "user",
    text: "Draft a one-line summary I can drop in the memo.",
  },
  {
    id: 4,
    role: "assistant",
    text: "Non-compete limited to 12 months within Maharashtra — likely enforceable per §27; Bombay HC tends to uphold region-bound restraints.",
  },
];

export const initialThreads = chatThreads.map((t) => ({
  id: t.id,
  title: t.title,
}));

export const navItems = [
  { label: "Product", href: "#features" },
  { label: "Solutions", href: "#built" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export const footerLinkCols = [
  {
    title: "Product",
    links: [
      { label: "Research", href: "/#features" },
      { label: "Workspace", href: "/chat" },
      { label: "Models", href: "/models" },
      { label: "Feedback", href: "/feedback" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
      { label: "Register", href: "/register" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Cookies", href: "/cookies" },
      { label: "Contact", href: "/contact" },
      { label: "Compliance", href: "/security" },
      { label: "Unauthorized", href: "/unauthorized" },
    ],
  },
] as const;

export const brands = [
  "Lexora",
  "Verdicta",
  "Courtwise",
  "Plaid & Co.",
  "Meridian Law",
  "Argyle",
] as const;

export const benefits = [
  "Trained on verified statutes & case law",
  "Cite-checked answers, never hallucinated",
  "SOC 2 ready — your data stays yours",
] as const;

export const authBenefits = [
  "Cite-checked answers, never hallucinated",
  "SOC 2 ready — your data stays yours",
  "No credit card required for beta access",
] as const;

export const featureItems = [
  {
    icon: "search" as IconName,
    title: "Instant case research",
    copy:
      "Ask a question in plain language and get ranked precedents with the exact citations that matter to your matter.",
    accent: "#8d4b2c",
  },
  {
    icon: "doc" as IconName,
    title: "Document intelligence",
    copy:
      "Upload a contract or judgment and Nyayantar extracts clauses, flags risk, and drafts a clean summary in seconds.",
    accent: "#a8663f",
  },
  {
    icon: "scale" as IconName,
    title: "Citation confidence",
    copy:
      "Every answer is traced to a source. No guessing, no hallucination — just defensible, checkable legal reasoning.",
    accent: "#3b82f6",
  },
] as const;

export const builtPoints = [
  {
    icon: "bolt" as IconName,
    title: "Faster than the library",
    copy:
      "What took an associate an afternoon takes Nyayantar minutes — with the citations already lined up.",
  },
  {
    icon: "lock" as IconName,
    title: "Private by default",
    copy:
      "Your matters are encrypted and never used to train shared models. Your client data stays yours.",
  },
  {
    icon: "users" as IconName,
    title: "Built with lawyers",
    copy:
      "Every workflow is shaped by practicing attorneys, not by people guessing what law feels like.",
  },
] as const;

export type Card = {
  icon: IconName;
  title: string;
  copy: string;
};

export const gridCards: Card[] = [
  {
    icon: "search" as IconName,
    title: "Ask. Get precedent.",
    copy:
      "Natural-language research across statutes, judgments, and commentary — ranked by relevance to your facts.",
  },
  {
    icon: "doc" as IconName,
    title: "Read a 200-page brief in 20 seconds.",
    copy:
      "Nyayantar summarizes filings, extracts obligations, and turns dense prose into a clean, cite-linked brief.",
  },
  {
    icon: "shield" as IconName,
    title: "Catch the risk before opposing counsel does.",
    copy:
      "Automated clause review flags ambiguous language, missing definitions, and terms that drift from your playbook.",
  },
] as const;

export const advancedCapabilities = [
  {
    icon: "globe" as IconName,
    title: "Multi-jurisdiction",
    copy: "Switch between central and state law without leaving the thread.",
  },
  {
    icon: "layers" as IconName,
    title: "Citation graph",
    copy: "See how a precedent has been cited, distinguished, or overruled.",
  },
  {
    icon: "chart" as IconName,
    title: "Outcome modeling",
    copy: "Surface the factors that historically moved similar rulings.",
  },
  {
    icon: "users" as IconName,
    title: "Shared playbooks",
    copy: "Standardize clause language across your whole team.",
  },
  {
    icon: "lock" as IconName,
    title: "Audit trail",
    copy: "Every query and export is logged for privilege and review.",
  },
  {
    icon: "bolt" as IconName,
    title: "API & integrations",
    copy: "Drop Nyayantar into your DMS, CLM, or internal tooling.",
  },
] as const;

export type Plan = {
  name: string;
  description: string;
  monthly: number;
  annual: number;
  features: string[];
  cta: string;
  highlight?: boolean;
};

export const plans: Plan[] = [
  {
    name: "Starter",
    description: "For solo practitioners getting started.",
    monthly: 19,
    annual: 15,
    features: [
      "500 research queries / mo",
      "Document analysis (50 docs)",
      "Citation graph access",
      "Email support",
    ],
    cta: "Start free",
  },
  {
    name: "Professional",
    description: "For busy firms that live in research.",
    monthly: 49,
    annual: 39,
    features: [
      "Unlimited research queries",
      "Document analysis (1,000 docs)",
      "Clause review & playbooks",
      "Audit trail & integrations",
      "Priority support",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For teams with security & scale needs.",
    monthly: 0,
    annual: 0,
    features: [
      "Everything in Professional",
      "SSO & role-based access",
      "Private deployment options",
      "Dedicated success manager",
      "Custom DPA & SLA",
    ],
    cta: "Talk to sales",
  },
] as const;

export const faqs = [
  {
    q: "Is Nyayantar a replacement for a lawyer?",
    a: "No. Nyayantar is a research and drafting assistant. It surfaces precedent, summarizes documents, and checks citations — but the legal judgment is always yours. Every output links back to a source you can verify.",
  },
  {
    q: "Where does my data go?",
    a: "Your documents are encrypted at rest and in transit. We never use your client matters to train shared models, and Enterprise plans support private deployment and custom DPAs.",
  },
  {
    q: "How accurate are the citations?",
    a: "Every answer is traced to a specific statute, judgment, or clause. You can open the source one click away, and the citation graph shows how a precedent has been treated over time.",
  },
  {
    q: "Which jurisdictions are supported?",
    a: "Nyayantar currently covers major central and state jurisdictions, with more being added each month. You can filter research by jurisdiction inside any thread.",
  },
  {
    q: "Can I integrate it with my existing tools?",
    a: "Yes. Professional and Enterprise plans include an API and integrations for common DMS and CLM platforms, plus an audit trail for privilege and review.",
  },
] as const;

export const testimonials = [
  {
    quote:
      "Nyayantar cut our research time roughly in half. The citations are real and checkable, which is the only thing that matters when a partner is reading your memo.",
    name: "Ananya Rao",
    role: "Senior Associate, Meridian Law",
    initials: "AR",
  },
  {
    quote:
      "We onboarded the whole disputes team in a week. The clause review alone has caught three issues that would have cost us on the next matter.",
    name: "Devansh Mehta",
    role: "Partner, Argyle & Co.",
    initials: "DM",
  },
  {
    quote:
      "It feels calm. No clutter, no theatrics — just the precedent I need, with the source one click away. That's rare in legal tech.",
    name: "Priya Nair",
    role: "General Counsel, Courtwise",
    initials: "PN",
  },
] as const;

export const tickerWords = [
  "Research",
  "Draft",
  "Review",
  "Cite",
  "Summarize",
  "Win",
] as const;

export const defaultUser = {
  name: "Ananya Rao",
  email: "ananya@meridian.law",
  initials: "AR",
  role: "user" as const,
} as const;

export const adminUsers = [
  {
    name: "Admin Monitor",
    email: "admin@nyayantar.law",
    initials: "AM",
    role: "admin" as const,
  },
  {
    name: "Sudo Admin",
    email: "sudo@nyayantar.law",
    initials: "SA",
    role: "sudo_admin" as const,
  },
  {
    name: "Super Admin",
    email: "super@nyayantar.law",
    initials: "SU",
    role: "super_admin" as const,
  },
] as const;
