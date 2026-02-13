"use client";

import * as React from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { monthlyPayment } from "@/lib/finance";
import { smartProtectQuote, Deductible } from "@/lib/smartProtect";

type Scenario = {
  vehicle?: string;
  vin?: string;
  dealer?: string;

  term?: number;
  amountFinanced?: number;
  vehiclePrice?: number;
  msrp?: number;

  baseLow?: number;
  baseHigh?: number;

  apr?: number;
  aprLow?: number;
  aprHigh?: number;

  miles?: number;
  isNew?: boolean;
  isDiesel?: boolean;
  isHighLineOrHeavyEquipment?: boolean;

  deductible?: Deductible;
};

function num(v: unknown, d = 0): number {
  if (v == null) return d;
  if (Array.isArray(v)) return num(v[0], d);
  const s = String(v).trim();
  if (!s) return d;
  const n = Number(s);
  return Number.isFinite(n) ? n : d;
}

function boolish(v: unknown, d = false): boolean {
  if (v == null) return d;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (!s) return d;
  return ["1", "true", "yes", "y", "on"].includes(s);
}

function pctToDecMaybe(v: number): number {
  return v > 1 ? v / 100 : v;
}

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function planLabel(planKey: string) {
  switch (planKey) {
    case "WRAP_5Y_60K":
      return "Wrap 5yr / 60k (3/36 → 5/60)";
    case "VSC_6Y_75K":
      return "Service Contract 6yr / 75k";
    case "VSC_8Y_100K":
      return "Service Contract 8yr / 100k";
    default:
      return planKey;
  }
}

function badgeClass(kind: "good" | "warn" | "base") {
  if (kind === "good") return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
  if (kind === "warn") return "bg-amber-500/15 text-amber-200 border-amber-400/30";
  return "bg-white/5 text-white/80 border-white/10";
}

export default function SmartProtect({ scenario }: { scenario?: Partial<Scenario> }) {
  const qp = useSearchParams();

  const getS = (k: keyof Scenario, def = "") =>
    (scenario?.[k] as string | undefined) ?? qp?.get(String(k)) ?? def;

  const getN = (k: keyof Scenario, def = 0) => {
    const prop = scenario?.[k];
    if (prop != null) return num(prop, def);
    return num(qp?.get(String(k)), def);
  };

  const getB = (k: keyof Scenario, def = false) => {
    const prop = scenario?.[k];
    if (prop != null) return boolish(prop, def);
    return boolish(qp?.get(String(k)), def);
  };

  const vehicle = getS("vehicle", "Selected Vehicle");
  const vin = getS("vin", "");
  const dealer = getS("dealer", "Korf CDJR Fort Morgan");

  const term = getN("term", 66);
  const amountFinanced = getN("amountFinanced", 0);
  const vehiclePrice = getN("vehiclePrice", 0);
  const msrp = getN("msrp", 0);

  const miles = getN("miles", 0);
  const isNew = getB("isNew", miles > 0 ? miles < 200 : false);
  const isDiesel = getB("isDiesel", false);
  const isHighLineOrHeavyEquipment = getB("isHighLineOrHeavyEquipment", false);

  const deductible = (getN("deductible", 0) as Deductible) ?? 0;

  const aprAvgPct = getN("apr", NaN);
  let aprLow = pctToDecMaybe(getN("aprLow", NaN));
  let aprHigh = pctToDecMaybe(getN("aprHigh", NaN));
  if (!Number.isFinite(aprLow) || !Number.isFinite(aprHigh)) {
    if (Number.isFinite(aprAvgPct)) {
      const avgDec = pctToDecMaybe(aprAvgPct);
      aprLow = Math.max(avgDec - 0.01, 0.0299);
      aprHigh = Math.min(avgDec + 0.015, 0.2999);
    } else {
      aprLow = 0.12;
      aprHigh = 0.16;
    }
  }

  const baseLowProp = getN("baseLow", NaN);
  const baseHighProp = getN("baseHigh", NaN);

  const baseLow = Number.isFinite(baseLowProp)
    ? baseLowProp
    : amountFinanced > 0
      ? monthlyPayment(amountFinanced, aprLow, term)
      : 0;

  const baseHigh = Number.isFinite(baseHighProp)
    ? baseHighProp
    : amountFinanced > 0
      ? monthlyPayment(amountFinanced, aprHigh, term)
      : 0;

  const sp = useMemo(() => {
    if (!amountFinanced || !vehiclePrice || !term) return null;
    return smartProtectQuote({
      vehiclePrice,
      msrp: msrp > 0 ? msrp : undefined,
      miles,
      isNew,
      amountFinanced,
      termMonths: term,
      aprLow,
      aprHigh,
      deductible,
      isDiesel,
      isHighLineOrHeavyEquipment,
    });
  }, [
    amountFinanced,
    vehiclePrice,
    msrp,
    miles,
    isNew,
    term,
    aprLow,
    aprHigh,
    deductible,
    isDiesel,
    isHighLineOrHeavyEquipment,
  ]);

  const aprMid = ((aprLow + aprHigh) / 2) * 100;

  return (
    <div className="p-6 bg-gradient-to-b from-zinc-900 to-black rounded-3xl text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Smart Protect</h2>
        <p className="text-white/70">
          {vehicle}
          {vin ? ` • ${vin}` : ""} — {term} mo @ {aprMid.toFixed(2)}% est.
        </p>
        <div className="text-white/70 text-sm">
          Dealer: <span className="text-white/90">{dealer}</span>
        </div>
      </div>

      <div className="mt-5 grid md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Vehicle Price</div>
          <div className="text-2xl font-bold">{vehiclePrice ? money(vehiclePrice) : "—"}</div>
          <div className="text-xs text-white/60 mt-1">Miles: {miles ? miles.toLocaleString() : "—"} • {isNew ? "New" : "Used"}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Amount Financed (est.)</div>
          <div className="text-2xl font-bold">{amountFinanced ? money(amountFinanced) : "—"}</div>
          <div className="text-xs text-white/60 mt-1">Term: {term} mo • Deductible: ${deductible}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/60">Base Payment Range</div>
          <div className="text-2xl font-bold">{baseLow && baseHigh ? `${money(baseLow)}–${money(baseHigh)}` : "—"}</div>
          <div className="text-xs text-white/60 mt-1">APR band: {(aprLow * 100).toFixed(2)}%–{(aprHigh * 100).toFixed(2)}%</div>
        </div>
      </div>

      {!sp && (
        <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
          <div className="font-semibold">Missing inputs</div>
          <div className="text-sm text-amber-100/80 mt-1">
            SmartProtect needs <b>vehiclePrice</b>, <b>amountFinanced</b>, and <b>term</b>.
          </div>
        </div>
      )}

      {sp && (
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60">Protection</div>
                <div className="text-xl font-bold">GAP</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full border ${badgeClass("good")}`}>Est.</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                <div className="text-xs text-white/60">Cash Price</div>
                <div className="text-lg font-semibold">{money(sp.gap.price)}</div>
              </div>

              {sp.impacts?.gap ? (
                <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="text-xs text-white/60">Monthly Add (range)</div>
                  <div className="text-lg font-semibold">{money(sp.impacts.gap.addonMonthlyLow)}–{money(sp.impacts.gap.addonMonthlyHigh)}</div>
                </div>
              ) : (
                <div className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="text-xs text-white/60">Monthly Add</div>
                  <div className="text-lg font-semibold">—</div>
                </div>
              )}
            </div>

            {sp.impacts?.gap && (
              <div className="mt-3 text-sm text-white/70">New payment range: <b className="text-white">{money(sp.impacts.gap.newMonthlyLow)}–{money(sp.impacts.gap.newMonthlyHigh)}</b></div>
            )}

            {sp.gap.notes.length > 0 && (
              <ul className="mt-3 text-sm text-white/60 list-disc pl-5 space-y-1">
                {sp.gap.notes.map((n, i) => (<li key={i}>{n}</li>))}
              </ul>
            )}

            <div className="mt-4 text-xs text-white/50">Estimate only. Final pricing varies by provider.</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/60">Protection</div>
                <div className="text-xl font-bold">Service Contract Options</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full border ${badgeClass("base")}`}>{sp.vsc.length} options</span>
            </div>

            <div className="mt-4 space-y-3">
              {sp.vsc.map((p) => {
                const impact = sp.impacts?.vsc?.[p.planKey];
                return (
                  <div key={`${p.planKey}-${p.coverageType}-${p.deductible}`} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{planLabel(p.planKey)}</div>
                        <div className="text-xs text-white/60 mt-1">{p.coverageType} • ${p.deductible} deductible • {p.years} yr / {p.miles.toLocaleString()} mi</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/60">Cash Price</div>
                        <div className="text-lg font-bold">{money(p.price)}</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                        <div className="text-xs text-white/60">Monthly Add (range)</div>
                        <div className="text-sm font-semibold">{impact ? `${money(impact.addonMonthlyLow)}–${money(impact.addonMonthlyHigh)}` : "—"}</div>
                      </div>
                      <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                        <div className="text-xs text-white/60">New Payment Range</div>
                        <div className="text-sm font-semibold">{impact ? `${money(impact.newMonthlyLow)}–${money(impact.newMonthlyHigh)}` : "—"}</div>
                      </div>
                    </div>

                    {p.notes.length > 0 && (
                      <ul className="mt-3 text-xs text-white/60 list-disc pl-5 space-y-1">
                        {p.notes.map((n, i) => (<li key={i}>{n}</li>))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-white/50">Estimate only. Final coverage/eligibility depends on provider rules.</div>
          </div>
        </div>
      )}

      <div className="mt-5 text-xs text-white/50">
        Disclaimer: Estimates only and not a credit offer. Final payments and product pricing depend on approved credit, lender programs, and provider eligibility.
      </div>
    </div>
  );
}
