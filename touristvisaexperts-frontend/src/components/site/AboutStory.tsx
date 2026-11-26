import { motion } from "motion/react";
import { Lightbulb, ShieldCheck, Scale, HeartHandshake, CheckCircle2 } from "lucide-react";

const BELIEFS = [
  {
    Icon: Lightbulb,
    title: "Clarity over confusion.",
    text: "Visa requirements shouldn't need a translator. We explain everything in plain language, every step of the way.",
    color: "#F97316",
  },
  {
    Icon: ShieldCheck,
    title: "Ownership, not outsourcing.",
    text: "Your case isn't passed around — it's handled with care, start to finish.",
    color: "#3B82F6",
  },
  {
    Icon: Scale,
    title: "Honesty over false hope.",
    text: "We won't tell you what you want to hear. We'll tell you what's actually true, so you can plan with confidence.",
    color: "#22C55E",
  },
  {
    Icon: HeartHandshake,
    title: "People first.",
    text: "Every traveler's situation is different. We treat it that way.",
    color: "#8B5CF6",
  },
];

const REASONS = [
  { title: "Personalized guidance", text: "not generic checklists" },
  { title: "Detailed application review", text: "we assess your documents against embassy requirements before submission" },
  { title: "Real support", text: "not a chatbot pretending to care" },
  { title: "Built for global travelers", text: "we understand the specific hurdles you face" },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
};

export const AboutStory = () => (
  <div className="bg-white">
    {/* Intro */}
    <section className="container mx-auto max-w-4xl px-4 pt-16 pb-12 text-center sm:pt-24">
      <motion.p {...fadeUp} transition={{ duration: 0.5 }} className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500">
        Start your journey
      </motion.p>
      <motion.h2 {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }} className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
        We Simplify Visas. <span className="text-orange-500">That's It.</span>
      </motion.h2>
      <motion.p {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
        Not agencies. Not middlemen. Just people who understand how confusing and stressful the visa process can be — and built something to fix that.
      </motion.p>
    </section>

    {/* Our Story */}
    <section className="container mx-auto max-w-5xl px-4 py-12">
      <div className="grid items-start gap-10 rounded-[2rem] bg-gradient-to-br from-[#0f2a6e] to-[#060d1a] p-8 text-white shadow-xl md:grid-cols-[0.8fr_1.2fr] md:p-12">
        <motion.div {...fadeUp} transition={{ duration: 0.6 }}>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">Our Story</p>
          <h3 className="mt-3 text-2xl font-bold leading-snug md:text-3xl">
            Getting a visa shouldn't feel harder than planning the trip itself.
          </h3>
        </motion.div>
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.15 }} className="space-y-4 leading-relaxed text-blue-100/80">
          <p>
            Yet for most travelers, it does — confusing embassy requirements, conflicting advice, and no clear way to know if you're even doing it right. One missing document, one wrong form, and months of planning can fall apart.
          </p>
          <p>
            We started Tourist Visa Experts to change that. A place where every application gets real attention, every question gets answered honestly, and nothing is left to guesswork.
          </p>
          <p className="font-semibold text-white">
            Because a trip should begin with excitement — not anxiety.
          </p>
        </motion.div>
      </div>
    </section>

    {/* What We Believe */}
    <section className="container mx-auto max-w-6xl px-4 py-12">
      <motion.h3 {...fadeUp} transition={{ duration: 0.5 }} className="text-center text-3xl font-black tracking-tight text-slate-900">
        What We Believe
      </motion.h3>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {BELIEFS.map(({ Icon, title, text, color }, i) => (
          <motion.div
            key={title}
            {...fadeUp}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${color}1a`, color }}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-bold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Why Travelers Choose Us */}
    <section className="container mx-auto max-w-4xl px-4 pt-12 pb-20">
      <motion.h3 {...fadeUp} transition={{ duration: 0.5 }} className="text-center text-3xl font-black tracking-tight text-slate-900">
        Why Travelers Choose Us
      </motion.h3>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {REASONS.map(({ title, text }, i) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, x: i % 2 ? 24 : -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-5"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <p className="text-slate-600">
              <span className="font-bold text-slate-900">{title}</span> — {text}
            </p>
          </motion.li>
        ))}
      </ul>
    </section>
  </div>
);
