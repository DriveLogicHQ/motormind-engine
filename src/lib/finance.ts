// src/lib/finance.ts
export type CreditTier = "T1" | "T2" | "T3" | "T4";

export const monthlyPayment = (amount: number, apr: number, months: number) => {
  const r = apr / 12;
  if (r <= 0) return amount / months;
  const f = (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return amount * f;
};

export const getBand = (year: number, miles: number) => {
  const age = new Date().getFullYear() - year;
  if (age <= 2 || miles <= 40000) return "A";
  if (age <= 6 && miles <= 90000) return "B";
  if (age <= 10 || miles <= 140000) return "C";
  return "D";
};

export const TERM_CAPS: Record<string, Record<CreditTier, number>> = {
  A: { T1: 84, T2: 84, T3: 72, T4: 66 },
  B: { T1: 75, T2: 72, T3: 66, T4: 60 },
  C: { T1: 60, T2: 60, T3: 54, T4: 48 },
  D: { T1: 48, T2: 48, T3: 42, T4: 36 },
};

export const BASE_APR: Record<string, Record<CreditTier, number>> = {
  A: { T1: 0.0499, T2: 0.0649, T3: 0.0949, T4: 0.1499 },
  B: { T1: 0.0549, T2: 0.0749, T3: 0.1049, T4: 0.1649 },
  C: { T1: 0.0699, T2: 0.0949, T3: 0.1349, T4: 0.1999 },
  D: { T1: 0.0899, T2: 0.1249, T3: 0.1799, T4: 0.2499 },
};

export function aprAdjust({ ltv, miles, age, isOldEV = false }:{
  ltv: number; miles: number; age: number; isOldEV?: boolean
}) {
  let add = 0;
  if (ltv > 1.25) add += 0.03;
  else if (ltv > 1.10) add += 0.015;
  else if (ltv > 0.95) add += 0.0075;
  if (miles > 150000) add += 0.02;
  else if (miles > 120000) add += 0.01;
  else if (miles > 90000) add += 0.005;
  if (age > 10) add += 0.01;
  if (isOldEV) add += 0.005;
  return add;
}

export const isColoradoZip = (zip: string) => /^(80|81)\d{3}$/.test(zip);
