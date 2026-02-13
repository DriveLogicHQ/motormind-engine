'use client';
import React from "react";
import { motion } from "framer-motion";
import { Gauge, BarChart3, Coins, LineChart, Sparkles } from "lucide-react";

const NeonText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-sky-400" style={{ textShadow: "0 0 8px rgba(56,189,248,0.6)" }}>{children}</span>
);

const AIBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
    <div className="flex items-center gap-2 mb-2">
      <Sparkles className="w-4 h-4 text-sky-400" />
      <span className="text-white/90 font-medium">DriveLogic AI</span>
    </div>
    <div className="leading-relaxed">{children}</div>
  </motion.div>
);

export default function DealerAnalytics() {
  return (
    <div className="p-6 bg-gradient-to-b from-black to-zinc-950 rounded-3xl text-white">
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-extrabold tracking-tight">
        Dealer Analytics <span className="text-white/60">—</span> <NeonText>Smart Protect ROI</NeonText>
      </motion.h1>
      <p className="text-white/70 mt-3 max-w-3xl">Real-time insights, penetration boosts, and PVR growth.</p>

      <div className="mt-6 grid lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-white/70"><Gauge className="w-4 h-4 text-sky-400" /> F&I Penetration</div>
          <div className="mt-2 text-3xl font-extrabold">68%</div>
          <div className="text-white/60 text-sm">Was 35% before DriveLogic</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-white/70"><BarChart3 className="w-4 h-4 text-sky-400" /> Avg Backend PVR</div>
          <div className="mt-2 text-3xl font-extrabold">$2,200</div>
          <div className="text-white/60 text-sm">+ $800 vs baseline</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-white/70"><Coins className="w-4 h-4 text-sky-400" /> Monthly Added Profit</div>
          <div className="mt-2 text-3xl font-extrabold">$67,850</div>
          <div className="text-white/60 text-sm">80 units/month</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-white/70"><LineChart className="w-4 h-4 text-sky-400" /> Attachment by Lender</div>
          <div className="mt-2 text-lg">A: 72% • B: 61% • C: 54%</div>
          <div className="text-white/60 text-sm">AI recommends lender mix</div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white/80 font-medium mb-2">Top-Selling Products</div>
          <div className="space-y-3">
            {[
              { label: "GAP Protection", value: 78 },
              { label: "VSC", value: 71 },
              { label: "Tire & Wheel", value: 56 },
              { label: "Prepaid Maintenance", value: 44 },
              { label: "Key Replacement", value: 38 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>{row.label}</span><span>{row.value}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full mt-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${row.value}%` }}
                    className="h-2 rounded-full bg-sky-500" style={{ boxShadow: "0 0 12px rgba(56,189,248,0.6)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white/80 font-medium mb-2">AI Weekly Insight</div>
          <AIBubble>
            Buyers who added <NeonText>GAP</NeonText> + <NeonText>VSC</NeonText> showed a <NeonText>+78%</NeonText> higher likelihood
            of adding at least one additional product. Projected quarterly profit uplift: <NeonText>$204,000</NeonText>.
          </AIBubble>
          <div className="mt-4 flex gap-3">
            <button className="border border-white/20 text-white hover:bg-white/10 px-4 py-2 rounded-lg">Export Report</button>
            <button className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded-lg text-white">Notify F&I Team</button>
          </div>
        </div>
      </div>
    </div>
  );
}
