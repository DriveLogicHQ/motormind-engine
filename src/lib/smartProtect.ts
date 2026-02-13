// src/lib/smartProtect.ts
// SmartProtect add-on estimates (GAP + VSC) + monthly deltas.

import { monthlyPayment } from "@/lib/finance";

export type Deductible = 0 | 50 | 100 | 200;
export type CoverageType = "EXCLUSIONARY" | "SELECT" | "POWERTRAIN";
export type VscPlanKey = "WRAP_5Y_60K" | "VSC_6Y_75K" | "VSC_8Y_100K";

export type GapQuote = {
  eligible: boolean;
  price: number;
  notes: string[];
};

export type VscQuote = {
  eligible: boolean;
  planKey: VscPlanKey;
  coverageType: CoverageType;
  deductible: Deductible;
  years: number;
  miles: number;
  price: number;
  notes: string[];
};

export type AddOnImpact = {
  addonCashPrice: number;
  addonMonthlyLow: number;
  addonMonthlyHigh: number;
  newMonthlyLow: number;
  newMonthlyHigh: number;
};

export type SmartProtectConfig = {
  gapMin: number;
  gapPctOfAmountFinanced: number;
  gapPctAppliesOverVehiclePrice: number;

  exclusionaryMaxMiles: number;

  wrap5y60k: { zeroDed: number; ded100or200: number };
  vsc6y75k: { zeroDed: number; ded100or200: number };
  vsc8y100k: { pctOfMsrpOrPrice: number; min: number; max?: number };

  dieselMultiplier: number;
  highLineMultiplier: number;
};

export const DEFAULT_SMARTPROTECT_CONFIG: SmartProtectConfig = {
  gapMin: 600,
  gapPctOfAmountFinanced: 0.04,
  gapPctAppliesOverVehiclePrice: 15000,

  exclusionaryMaxMiles: 99999,

  wrap5y60k: { zeroDed: 3000, ded100or200: 2800 },
  vsc6y75k: { zeroDed: 3600, ded100or200: 3300 },
  vsc8y100k: { pctOfMsrpOrPrice: 0.10, min: 4500, max: 9000 },

  dieselMultiplier: 1.12,
  highLineMultiplier: 1.08,
};

function pctToDecMaybe(v: number): number {
  return v > 1 ? v / 100 : v;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function priceByDeductible(zeroDed: number, ded100or200: number, ded: Deductible) {
  if (ded === 0) return zeroDed;
  if (ded === 100 || ded === 200) return ded100or200;
  if (ded === 50) return Math.round((zeroDed + ded100or200) / 2);
  return ded100or200;
}

export function addonMonthlyImpact(args: {
  baseAmountFinanced: number;
  addonCashPrice: number;
  termMonths: number;
  aprLow: number;
  aprHigh: number;
}): AddOnImpact {
  const aprLowDec = clamp(pctToDecMaybe(args.aprLow), 0.0001, 0.2999);
  const aprHighDec = clamp(pctToDecMaybe(args.aprHigh), 0.0001, 0.2999);

  const baseLow = monthlyPayment(args.baseAmountFinanced, aprLowDec, args.termMonths);
  const baseHigh = monthlyPayment(args.baseAmountFinanced, aprHighDec, args.termMonths);

  const newLow = monthlyPayment(args.baseAmountFinanced + args.addonCashPrice, aprLowDec, args.termMonths);
  const newHigh = monthlyPayment(args.baseAmountFinanced + args.addonCashPrice, aprHighDec, args.termMonths);

  return {
    addonCashPrice: args.addonCashPrice,
    addonMonthlyLow: newLow - baseLow,
    addonMonthlyHigh: newHigh - baseHigh,
    newMonthlyLow: newLow,
    newMonthlyHigh: newHigh,
  };
}

export function estimateGap(args: {
  vehiclePrice: number;
  amountFinanced: number;
  config?: SmartProtectConfig;
}): GapQuote {
  const cfg = args.config ?? DEFAULT_SMARTPROTECT_CONFIG;
  const notes: string[] = [];
  const eligible = args.amountFinanced > 0 && args.vehiclePrice > 0;

  let price = cfg.gapMin;

  if (args.vehiclePrice > cfg.gapPctAppliesOverVehiclePrice) {
    const pctPrice = Math.round(args.amountFinanced * cfg.gapPctOfAmountFinanced);
    price = Math.max(cfg.gapMin, pctPrice);
    notes.push(
      `GAP estimated as max($${cfg.gapMin}, ${Math.round(cfg.gapPctOfAmountFinanced * 100)}% of amount financed) because vehicle price > $${cfg.gapPctAppliesOverVehiclePrice}.`
    );
  } else {
    notes.push(`GAP estimated at minimum $${cfg.gapMin} for lower-price tiers.`);
  }

  notes.push("Note: GAP is often treated as non-taxable (confirm by state/store policy). ");

  return { eligible, price, notes };
}

export function estimateVscOptions(args: {
  vehiclePrice: number;
  msrp?: number;
  miles: number;
  isNew: boolean;
  deductible?: Deductible;
  isDiesel?: boolean;
  isHighLineOrHeavyEquipment?: boolean;
  config?: SmartProtectConfig;
}): VscQuote[] {
  const cfg = args.config ?? DEFAULT_SMARTPROTECT_CONFIG;
  const ded = args.deductible ?? 0;

  const exclusionaryEligible = args.miles <= cfg.exclusionaryMaxMiles;

  const bump =
    (args.isDiesel ? cfg.dieselMultiplier : 1) *
    (args.isHighLineOrHeavyEquipment ? cfg.highLineMultiplier : 1);

  const baseNotes: string[] = [];
  if (args.isDiesel) baseNotes.push("Diesel vehicles often cost more to cover.");
  if (args.isHighLineOrHeavyEquipment) baseNotes.push("High equipment trims can increase VSC cost.");

  const out: VscQuote[] = [];

  if (args.isNew) {
    const price = Math.round(priceByDeductible(cfg.wrap5y60k.zeroDed, cfg.wrap5y60k.ded100or200, ded) * bump);

    out.push({
      eligible: true,
      planKey: "WRAP_5Y_60K",
      coverageType: "EXCLUSIONARY",
      deductible: ded,
      years: 5,
      miles: 60000,
      price,
      notes: [...baseNotes, "Wrap estimate: 3yr/36k → 5yr/60k (provider/store-defined).", "Often bundled with roadside, rental, trip interruption when packaged by provider."],
    });
  }

  if (args.isNew || exclusionaryEligible) {
    const price = Math.round(priceByDeductible(cfg.vsc6y75k.zeroDed, cfg.vsc6y75k.ded100or200, ded) * bump);

    out.push({
      eligible: true,
      planKey: "VSC_6Y_75K",
      coverageType: "EXCLUSIONARY",
      deductible: ded,
      years: 6,
      miles: 75000,
      price,
      notes: [...baseNotes, "Common upgrade path for longer ownership."],
    });
  }

  if (args.isNew) {
    const basis = Math.max(args.msrp ?? 0, args.vehiclePrice);
    let price = Math.round(basis * cfg.vsc8y100k.pctOfMsrpOrPrice);
    price = Math.max(cfg.vsc8y100k.min, price);
    if (cfg.vsc8y100k.max) price = Math.min(cfg.vsc8y100k.max, price);
    price = Math.round(price * bump);

    out.push({
      eligible: true,
      planKey: "VSC_8Y_100K",
      coverageType: "EXCLUSIONARY",
      deductible: ded,
      years: 8,
      miles: 100000,
      price,
      notes: [...baseNotes, "Heuristic pricing: ~10% of MSRP/price on new vehicles (tune per provider).", "Exclusionary-style coverage excludes wear items; provider exclusions apply."],
    });
  }

  if (!args.isNew && !exclusionaryEligible) {
    out.push({
      eligible: true,
      planKey: "VSC_6Y_75K",
      coverageType: "SELECT",
      deductible: ded,
      years: 3,
      miles: 36000,
      price: 2400,
      notes: [...baseNotes, `Exclusionary coverage typically not available over ${cfg.exclusionaryMaxMiles.toLocaleString()} miles.`, "Fallback suggestion: Select/Powertrain-style coverage (provider-defined).", "Placeholder estimate—swap with provider cost tables for accuracy."],
    });
  }

  return out;
}

export function smartProtectQuote(args: {
  vehiclePrice: number;
  msrp?: number;
  miles: number;
  isNew: boolean;

  amountFinanced: number;
  termMonths: number;

  aprLow: number;
  aprHigh: number;

  deductible?: Deductible;
  isDiesel?: boolean;
  isHighLineOrHeavyEquipment?: boolean;

  config?: SmartProtectConfig;
}) {
  const cfg = args.config ?? DEFAULT_SMARTPROTECT_CONFIG;

  const gap = estimateGap({ vehiclePrice: args.vehiclePrice, amountFinanced: args.amountFinanced, config: cfg });

  const vsc = estimateVscOptions({
    vehiclePrice: args.vehiclePrice,
    msrp: args.msrp,
    miles: args.miles,
    isNew: args.isNew,
    deductible: args.deductible ?? 0,
    isDiesel: args.isDiesel,
    isHighLineOrHeavyEquipment: args.isHighLineOrHeavyEquipment,
    config: cfg,
  });

  const impacts = {
    gap: gap.eligible
      ? addonMonthlyImpact({
          baseAmountFinanced: args.amountFinanced,
          addonCashPrice: gap.price,
          termMonths: args.termMonths,
          aprLow: args.aprLow,
          aprHigh: args.aprHigh,
        })
      : undefined,
    vsc: Object.fromEntries(
      vsc
        .filter((p) => p.eligible)
        .map((p) => [
          p.planKey,
          addonMonthlyImpact({
            baseAmountFinanced: args.amountFinanced,
            addonCashPrice: p.price,
            termMonths: args.termMonths,
            aprLow: args.aprLow,
            aprHigh: args.aprHigh,
          }),
        ])
    ) as Record<VscPlanKey, AddOnImpact>,
  };

  return { gap, vsc, impacts };
}
