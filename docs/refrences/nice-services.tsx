{ createFileRoute, Link } from "@tanstack/react-router";
import {
  Globe,
  Smartphone,
  Wrench,
  Search,
  Palette,
  Cloud,
  ArrowRight,
  Lightbulb,
  Map,
  PenTool,
  Code2,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import cloudsBg from "@/assets/clouds-bg.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — What we build" },
      {
        name: "description",
        content:
          "Six capabilities. One studio, end to end. Web, mobile, internal tools, design, SEO, and cloud — owned by the same small team from first sketch to launch.",
      },
      { property: "og:title", content: "Services — What we build" },
      {
        property: "og:description",
        content:
          "Six capabilities. One studio, end to end. Web, mobile, internal tools, design, SEO, and cloud.",
      },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    num: "01",
    icon: Globe,
    title: "Web Development",
    tagline: "Websites that work as hard as you do",
    desc: "Modern, responsive websites and web applications built on stacks we actually maintain — not throwaway templates.",
    items: ["Corporate Websites", "E-commerce Platforms", "Web Applications"],
  },
  {
    num: "02",
    icon: Smartphone,
    title: "Mobile Development",
    tagline: "Apps people keep on their home screen",
    desc: "Native and cross-platform apps designed for the small screen first, then everything else.",
    items: ["iOS Apps", "Android Apps", "Cross-Platform"],
  },
  {
    num: "03",
    icon: Wrench,
    title: "Internal Tools",
    tagline: "Operations software that actually gets used",
    desc: "Dashboards, CRMs, and back-office tools your team opens on Monday morning without complaining.",
    items: ["Admin Dashboards", "CRM Systems", "Inventory Management"],
  },
  {
    num: "04",
    icon: Search,
    title: "SEO & Marketing",
    tagline: "Be the brand searchers actually find",
    desc: "Technical SEO, content, and local search — measured by pipeline, not vanity rankings.",
    items: ["Technical SEO", "Content Strategy", "Local SEO"],
  },
  {
    num: "05",
    icon: Palette,
    title: "UI/UX Design",
    tagline: "Design that earns its second tap",
    desc: "Interfaces shaped by real user sessions, not moodboards. Beautiful because it's clear.",
    items: ["User Research", "Wireframing", "Visual Design"],
  },
  {
    num: "06",
    icon: Cloud,
    title: "Cloud & DevOps",
    tagline: "Ship faster, sleep better",
    desc: "Scalable infrastructure, CI/CD, and monitoring so releases stop being scary events.",
    items: ["Cloud Migration", "CI/CD Pipelines", "Server Management"],
  },
];

const process = [
  {
    num: "01",
    icon: Lightbulb,
    title: "Discovery",
    lead: "We start by listening.",
    desc: "Workshops, stakeholder interviews, and a hard look at the numbers. We leave with a shared understanding of the problem worth solving.",
  },
  {
    num: "02",
    icon: Map,
    title: "Planning",
    lead: "A roadmap you can defend.",
    desc: "Scope, milestones, and a technical spec written in plain English. No surprise line items three months in.",
  },
  {
    num: "03",
    icon: PenTool,
    title: "Design",
    lead: "Pixels with a point of view.",
    desc: "From low-fi flows to a polished interface system. Every screen earns its place.",
  },
  {
    num: "04",
    icon: Code2,
    title: "Development",
    lead: "Code you can hand off.",
    desc: "Typed, tested, and reviewed. We write it so the next engineer — yours or ours — thanks us.",
  },
  {
    num: "05",
    icon: ShieldCheck,
    title: "Testing",
    lead: "Break it before users do.",
    desc: "Automated suites, real-device passes, and accessibility audits before anything ships.",
  },
  {
    num: "06",
    icon: Rocket,
    title: "Launch",
    lead: "Live — and looked after.",
    desc: "Zero-downtime deploys, monitoring dashboards, and a support cadence that outlives the launch week.",
  },
];

function ServicesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4e4d8] text-slate-900">
      {/* Cloud background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${cloudsBg})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/25 via-white/45 to-white/70"
      />

      <main className="mx-auto max-w-7xl px-6 pb-32 pt-24 sm:px-10 lg:pt-32">
        {/* Hero */}
        <section className="max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
            What we build
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-[5.5rem]">
            Six capabilities.
            <br />
            <span className="italic text-slate-700">One studio, end to end.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-700">
            We don't hand you off between specialists. Web, mobile, internal tools,
            design, SEO, and cloud — the same small team owns the work from the
            first sketch to the launch deploy.
          </p>
        </section>

        {/* Stats */}
        <section className="mt-16 grid grid-cols-1 gap-8 border-y border-slate-900/10 py-10 sm:grid-cols-3">
          <Stat label="Average partnership" value="3 years" />
          <Stat label="Capabilities" value="06" />
          <Stat label="Based" value="Abu Dhabi, UAE" />
        </section>

        {/* Services — editorial zigzag */}
        <section className="mt-28 space-y-28 sm:mt-36 sm:space-y-40">
          {services.map((s, i) => (
            <ServiceRow key={s.num} index={i} {...s} />
          ))}
        </section>

        {/* How we work — sticky scroll journey */}
        <ProcessJourney />

        {/* CTA */}
        <section className="mt-32">
          <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/50 p-10 shadow-[0_20px_60px_-20px_rgba(120,60,80,0.25)] backdrop-blur-xl sm:p-14">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
              Ready when you are
            </p>
            <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Not sure what you need?
            </h3>
            <p className="mt-4 max-w-xl text-slate-700">
              Every business is unique. We'll help you identify the right solutions
              for your specific needs and budget.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Get free consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-slate-600">Let's have a conversation</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

type ServiceRowProps = {
  index: number;
  num: string;
  icon: typeof Globe;
  title: string;
  tagline: string;
  desc: string;
  items: string[];
};

function ServiceRow({ index, num, icon: Icon, title, tagline, desc, items }: ServiceRowProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const reversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`grid grid-cols-1 items-center gap-10 transition-all duration-1000 ease-out lg:grid-cols-12 lg:gap-16 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
    >
      {/* Numeral panel */}
      <div className={`lg:col-span-5 ${reversed ? "lg:order-2" : ""}`}>
        <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/50 bg-white/40 p-8 backdrop-blur-xl sm:aspect-[5/4] lg:aspect-[4/5]">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-slate-900/5"
          />
          <span className="pointer-events-none select-none font-semibold leading-none tracking-tighter text-slate-900/90"
            style={{ fontSize: "clamp(9rem, 22vw, 18rem)" }}
          >
            {num}
          </span>
          <div className="absolute bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Icon className="h-5 w-5" />
          </div>
          <div className="absolute right-6 top-6 rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-700">
            Capability
          </div>
        </div>
      </div>

      {/* Copy */}
      <div className={`lg:col-span-7 ${reversed ? "lg:order-1 lg:pr-8" : "lg:pl-4"}`}>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
          {tagline}
        </p>
        <h3 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          {title}
        </h3>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-700">{desc}</p>

        <ul className="mt-8 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-slate-900/10 bg-white/60 px-4 py-1.5 text-sm text-slate-700 backdrop-blur-sm"
            >
              {item}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="group mt-10 inline-flex items-center gap-3 text-sm font-medium text-slate-900"
        >
          <span className="relative">
            Explore service
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-slate-900 transition-transform duration-500 group-hover:scale-x-0" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/20 bg-white/60 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white">
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </div>
  );
}

function ProcessJourney() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const total = rect.height - viewportH;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      setProgress(p);
      const idx = Math.min(process.length - 1, Math.floor(p * process.length));
      setActiveIdx(idx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="mt-40">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
          How we work
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          A six-step climb, not a checklist.
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-700">
          Scroll through the same journey we take with every partner — from the
          first "what if" conversation to the moment your product is live and
          looked after.
        </p>
      </div>

      {/* Sticky journey */}
      <div ref={sectionRef} className="relative mt-16" style={{ height: `${process.length * 90}vh` }}>
        <div className="sticky top-0 flex h-screen items-center">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Progress rail */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="relative mx-auto h-[60vh] w-px bg-slate-900/10">
                <div
                  className="absolute left-0 top-0 w-px bg-slate-900 transition-[height] duration-300"
                  style={{ height: `${progress * 100}%` }}
                />
                {process.map((p, i) => (
                  <div
                    key={p.num}
                    className="absolute -translate-x-1/2 transition-all duration-500"
                    style={{ top: `${(i / (process.length - 1)) * 100}%` }}
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full border transition-all duration-500 ${
                        i <= activeIdx
                          ? "border-slate-900 bg-slate-900 scale-125"
                          : "border-slate-900/30 bg-white"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div className="relative lg:col-span-11">
              <div className="relative h-[70vh]">
                {process.map((p, i) => (
                  <ProcessStage key={p.num} step={p} index={i} activeIdx={activeIdx} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type Step = (typeof process)[number];

function ProcessStage({
  step,
  index,
  activeIdx,
}: {
  step: Step;
  index: number;
  activeIdx: number;
}) {
  const Icon = step.icon;
  const state: "past" | "active" | "future" =
    index === activeIdx ? "active" : index < activeIdx ? "past" : "future";

  const style: CSSProperties = {
    opacity: state === "active" ? 1 : 0,
    transform:
      state === "active"
        ? "translateY(0) scale(1)"
        : state === "past"
          ? "translateY(-40px) scale(0.96)"
          : "translateY(40px) scale(0.96)",
  };

  return (
    <div
      className="absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-out"
      style={style}
      aria-hidden={state !== "active"}
    >
      <div className="flex items-center gap-4">
        <span
          className="font-semibold leading-none tracking-tighter text-slate-900/85"
          style={{ fontSize: "clamp(6rem, 14vw, 12rem)" }}
        >
          {step.num}
        </span>
        <div className="flex flex-col gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-slate-700/70">
            Step {step.num} of 06
          </span>
        </div>
      </div>

      <h3 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        {step.title}
      </h3>
      <p className="mt-4 max-w-xl text-xl italic text-slate-700">{step.lead}</p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700">
        {step.desc}
      </p>
    </div>
  );
}