import React from "react";
import {
  UserCheck, Users, Globe, BadgeCheck, Zap,
  FileText, ShieldCheck, Star, Clock, MapPin,
  Lock, Headphones, Award, TrendingUp, Plane,
} from "lucide-react";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import { cn } from "@/lib/utils";

const TAG_ROWS = [
  [
    { id: "dedicated-expert",  Icon: UserCheck,   label: "Dedicated Expert"    },
    { id: "99-success",        Icon: BadgeCheck,  label: "99% Success Rate"    },
    { id: "real-experience",   Icon: Globe,       label: "Real Experience"     },
    { id: "embassy-ready",     Icon: FileText,    label: "Embassy Ready"       },
    { id: "fast-processing",   Icon: Zap,         label: "Fast Processing"     },
  ],
  [
    { id: "doc-review",        Icon: ShieldCheck, label: "Document Review"     },
    { id: "50-countries",      Icon: MapPin,      label: "50+ Countries"       },
    { id: "secure-safe",       Icon: Lock,        label: "Secure & Safe"       },
    { id: "expert-guidance",   Icon: Star,        label: "Expert Guidance"     },
    { id: "visa-tracking",     Icon: Clock,       label: "Visa Tracking"       },
  ],
  [
    { id: "indians-first",     Icon: Users,       label: "Indians First"       },
    { id: "end-to-end",        Icon: TrendingUp,  label: "End-to-End"          },
    { id: "quick-approval",    Icon: Award,       label: "Quick Approval"      },
    { id: "hassle-free",       Icon: Plane,       label: "Hassle-Free Travel"  },
    { id: "24-7-support",      Icon: Headphones,  label: "24/7 Support"        },
  ],
];

const CONFIG = {
  title: "Benefits of Tourist Visa Experts",
  description:
    "Your dedicated visa specialist handles everything — real travelers with real experience across 50+ countries, working specifically on your case from start to approval.",
  containerHeight: "h-[200px] sm:h-[240px]",
  lensSize: 92,
};

const MagnifiedBento = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);

  const clipPath = useMotionTemplate`circle(30px at calc(50% + ${lensX}px - 10px) calc(50% + ${lensY}px - 10px))`;
  const inverseMask = useMotionTemplate`radial-gradient(circle 30px at calc(50% + ${lensX}px - 10px) calc(50% + ${lensY}px - 10px), transparent 100%, black 100%)`;

  return (
    <div className="flex items-center justify-center w-full">
      <div className="group relative w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-1.5 sm:p-2 shadow-xl shadow-orange-500/5 transition-all duration-500 hover:shadow-orange-500/10 hover:-translate-y-1">
        <div
          ref={containerRef}
          className={cn(
            "relative w-full overflow-hidden rounded-[1.6rem] bg-slate-50",
            CONFIG.containerHeight
          )}
        >
          <div className="relative h-full w-full flex flex-col items-center justify-center">
            {/* base layer */}
            <motion.div
              style={{ WebkitMaskImage: inverseMask, maskImage: inverseMask }}
              className="flex flex-col gap-4 w-full h-full justify-center"
            >
              {TAG_ROWS.map((row, rowIndex) => (
                <motion.div
                  key={`row-${rowIndex}`}
                  className="flex gap-4 w-max"
                  animate={{
                    x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                  }}
                  transition={{ duration: 25, ease: "linear", repeat: Infinity }}
                >
                  {[...row, ...row, ...row].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex gap-2 bg-white/70 backdrop-blur-sm whitespace-nowrap w-fit text-slate-500 p-2 px-3 items-center border border-slate-200/60 rounded-full text-xs"
                    >
                      <item.Icon size={13} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>

            {/* reveal layer */}
            <motion.div
              className="absolute inset-0 flex flex-col gap-4 justify-center pointer-events-none select-none z-10"
              style={{ clipPath }}
            >
              {TAG_ROWS.map((row, rowIndex) => (
                <motion.div
                  key={`row-reveal-${rowIndex}`}
                  className="flex gap-4 w-max"
                  animate={{
                    x: rowIndex % 2 === 0 ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
                  }}
                  transition={{ duration: 25, ease: "linear", repeat: Infinity }}
                >
                  {[...row, ...row, ...row].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}-reveal`}
                      className="flex gap-2 bg-white whitespace-nowrap w-fit text-orange-600 p-2 px-3 items-center border border-orange-200 shadow-sm rounded-full text-xs scale-125 ml-6"
                    >
                      <item.Icon size={13} className="text-orange-500" />
                      <span className="font-semibold text-orange-600">{item.label}</span>
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>

            {/* draggable lens */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 cursor-grab active:cursor-grabbing drop-shadow-xl"
              drag
              dragMomentum={false}
              dragConstraints={containerRef}
              style={{ x: lensX, y: lensY }}
            >
              <div className="relative">
                <MagnifyingLens size={CONFIG.lensSize} />
                <div className="absolute top-[6px] left-[6px] w-[60px] h-[60px] rounded-full bg-white/10 pointer-events-none" />
              </div>
            </motion.div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-slate-50 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-slate-50 to-transparent z-20" />
        </div>

        {/* Bottom text */}
        <div className="p-5 pb-6">
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            <BadgeCheck size={11} /> Why Us
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-900 leading-snug">
            {CONFIG.title}
            <span className="block text-base font-semibold text-slate-400 mt-0.5">Over Other Services</span>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{CONFIG.description}</p>

          {/* 3 benefit points */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { Icon: UserCheck,  color: '#F97316', label: 'Dedicated\nSpecialist' },
              { Icon: BadgeCheck, color: '#22C55E', label: 'High Approval\nRate'   },
              { Icon: Globe,      color: '#3B82F6', label: 'Real Traveler\nInsights'},
            ].map(({ Icon, color, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl p-3 border text-center"
                style={{ background: `${color}08`, borderColor: `${color}25` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1.5px solid ${color}45` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-[10.5px] font-bold text-slate-700 leading-tight whitespace-pre-line">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagnifiedBento;

const MagnifyingLens = ({ size = 92 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M365.424 335.392L342.24 312.192L311.68 342.736L334.88 365.936L365.424 335.392Z" fill="#B0BDC6"/>
    <path d="M358.08 342.736L334.88 319.552L319.04 335.392L342.24 358.584L358.08 342.736Z" fill="#DFE9EF"/>
    <path d="M352.368 321.808L342.752 312.192L312.208 342.752L321.824 352.36L352.368 321.808Z" fill="#B0BDC6"/>
    <path d="M332 332C260 404 142.4 404 69.6001 332C-2.3999 260 -2.3999 142.4 69.6001 69.6C141.6 -3.20003 259.2 -2.40002 332 69.6C404.8 142.4 404.8 260 332 332ZM315.2 87.2C252 24 150.4 24 88.0001 87.2C24.8001 150.4 24.8001 252 88.0001 314.4C151.2 377.6 252.8 377.6 315.2 314.4C377.6 252 377.6 150.4 315.2 87.2Z" fill="#DFE9EF"/>
    <path d="M319.2 319.2C254.4 384 148.8 384 83.2001 319.2C18.4001 254.4 18.4001 148.8 83.2001 83.2C148 18.4 253.6 18.4 319.2 83.2C384 148.8 384 254.4 319.2 319.2ZM310.4 92C250.4 32 152 32 92.0001 92C32.0001 152 32.0001 250.4 92.0001 310.4C152 370.4 250.4 370.4 310.4 310.4C370.4 250.4 370.4 152 310.4 92Z" fill="#7A858C"/>
    <path d="M484.104 428.784L373.8 318.472L318.36 373.912L428.672 484.216L484.104 428.784Z" fill="#333333"/>
    <path d="M471.664 441.224L361.344 330.928L330.8 361.48L441.12 471.76L471.664 441.224Z" fill="#575B5E"/>
    <path d="M495.2 423.2C504 432 432.8 504 423.2 495.2L417.6 489.6C408.8 480.8 480 408.8 489.6 417.6L495.2 423.2Z" fill="#B0BDC6"/>
    <path d="M483.2 435.2C492 444 444.8 492 435.2 483.2L429.6 477.6C420.8 468.8 468 420.8 477.6 429.6L483.2 435.2Z" fill="#DFE9EF"/>
  </svg>
);
