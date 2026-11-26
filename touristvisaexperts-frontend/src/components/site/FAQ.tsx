import { ArrowRight, HelpCircle, ShieldCheck, Clock, FileText, Lock, Mic, Award, Headphones, Mail } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigation } from "@/context/NavigationContext";
import { ScrollReveal } from "@/components/magicui/scroll-reveal";

export const faqs = [
  { Icon: Clock,        q: "How long does the visa process take?",         a: "Most tourist visa applications are processed within 5–15 business days, depending on the destination country and embassy workload." },
  { Icon: ShieldCheck,  q: "Do you offer consultation for visa rejections?", a: "Yes — we provide a thorough review of your previous application and help you reapply with stronger documentation." },
  { Icon: FileText,     q: "What documents are required for visa?",          a: "Typically a valid passport, photographs, proof of funds, travel itinerary, and any country-specific documents. We provide a complete checklist." },
  { Icon: Lock,         q: "Is my information secure with you?",             a: "Absolutely. All data is encrypted and stored securely. We never share your information with third parties." },
  { Icon: Mic,          q: "Can you help with visa interview preparation?",  a: "Yes, our experts conduct mock interviews and share commonly asked questions to help you feel confident." },
  { Icon: Award,        q: "What is your success rate?",                     a: "We maintain a high visa approval success rate thanks to our experienced team and rigorous document review process — and we're always transparent about your chances." },
];

export const FAQ = () => {
  const { openConsultation, navigateTo } = useNavigation();
  return (
  <section id="faq" className="container mx-auto px-4 pb-20 scroll-mt-24">
    <ScrollReveal direction="up" delay={0} duration={800}>

      {/* Section header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 mb-4">
          <HelpCircle className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">FAQ</span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Frequently Asked <span className="text-orange-500">Questions</span></h2>
        <p className="mt-3 text-sm text-slate-500">Find quick answers to common visa questions.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">

        {/* FAQ accordion */}
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`q-${i}`}
              className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm data-[state=open]:border-orange-200 data-[state=open]:shadow-[0_4px_20px_rgba(249,115,22,0.08)] transition-all duration-300"
            >
              <AccordionTrigger className="py-4 text-left text-sm font-bold text-slate-800 hover:no-underline hover:text-orange-500 transition-colors duration-200 [&>svg]:text-slate-400 [&[data-state=open]>svg]:text-orange-500 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                    <f.Icon className="h-4 w-4 text-orange-500" />
                  </span>
                  {f.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pl-11 text-sm leading-relaxed text-slate-500">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Right panel */}
        <div className="rounded-3xl bg-[#0A1628] p-8 text-white flex flex-col gap-6">
          {/* decorative dots */}
          <div className="absolute inset-0 rounded-3xl opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-400/30 px-3 py-1 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300">Got questions?</span>
            </div>
            <h3 className="text-2xl font-black leading-snug">Got Questions? We're here to help</h3>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Book a 1-on-1 consultation with a visa expert, or send us a message and we'll get back to you.
            </p>
          </div>

          <button
            onClick={openConsultation}
            className="group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_6px_24px_rgba(249,115,22,0.4)] transition-all duration-300 hover:shadow-[0_10px_32px_rgba(249,115,22,0.55)] hover:-translate-y-0.5"
          >
            <Headphones className="h-4 w-4" />
            Book a Consultation
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>

          <button
            onClick={() => navigateTo('contact')}
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-white/10"
          >
            <Mail className="h-4 w-4" />
            Send us a message
          </button>
        </div>

      </div>
    </ScrollReveal>
  </section>
);
};
