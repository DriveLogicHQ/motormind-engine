"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, MapPin, Search, SlidersHorizontal, Shield } from "lucide-react";

import SmartProtect from "@/components/SmartProtect";
import {
  Body,
  CreditTier,
  Vehicle,
  normalizeVehicle,
  zipToOrigin,
  haversineMiles,
  getSmartPaymentForVehicle,
} from "@/lib/drivelogicSmart";

const BodyChip: React.FC<{ label: Body; active: boolean; onToggle: () => void }> = ({ label, active, onToggle }) => (
  <button
    onClick={onToggle}
    className={`px-3 py-1 rounded-full text-sm border transition ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300 hover:border-gray-500"
    }`}
  >
    {label}
  </button>
);

const TierSelect: React.FC<{ tier: CreditTier; setTier: (t: CreditTier) => void }> = ({ tier, setTier }) => (
  <div className="flex gap-2 flex-wrap">
    {(["T1", "T2", "T3", "T4"] as CreditTier[]).map((t) => (
      <button
        key={t}
        onClick={() => setTier(t)}
        className={`px-3 py-1 rounded-full text-sm border transition ${
          tier === t ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-300 hover:border-gray-500"
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatAPR(x: number) {
  return (x * 100).toFixed(2) + "%";
}

export default function DriveLogicPage() {
  // Controls
  const [zip, setZip] = useState("80751");
  const [radius, setRadius] = useState(100);
  const [targetPmt, setTargetPmt] = useState(450);
  const [tier, setTier] = useState<CreditTier>("T2");
  const [bodies, setBodies] = useState<Body[]>(["SUV", "Truck", "Car", "Van"]);
  const [down, setDown] = useState(0);
  const [tradeEq, setTradeEq] = useState(0);
  const [negEq, setNegEq] = useState(0);

  // configurable fees/tax (demo)
  const fees = 699;
  const taxRate = 0.044;

  // Inventory
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // SmartProtect modal
  const [spOpen, setSpOpen] = useState(false);
  const [spVehicle, setSpVehicle] = useState<Vehicle | null>(null);
  const [spCalc, setSpCalc] = useState<{
    term: number;
    amountFinanced: number;
    aprLow: number;
    aprHigh: number;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/data/inventory.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const mapped: Vehicle[] = (Array.isArray(raw) ? raw : []).map((r) => normalizeVehicle(r));
        if (alive) setInventory(mapped);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (alive) setLoadError(msg || "Failed to load inventory");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const { origin } = zipToOrigin(zip);

  const list = useMemo(() => {
    if (!inventory.length) return [];

    return inventory
      .map((v) => {
        const dist = haversineMiles(origin.lat, origin.lon, v.lat, v.lon);
        const calc = getSmartPaymentForVehicle({
          vehicle: v,
          origin,
          zip,
          creditTier: tier,
          targetPmt,
          down,
          tradeEq,
          negEq,
          fees,
          taxRate,
        });
        return { v, dist, ...calc };
      })
      .filter(({ v }) => bodies.includes(v.body))
      .filter(({ dist }) => dist <= radius)
      .sort((a, b) => {
        if (a.bestDiff !== b.bestDiff) return a.bestDiff - b.bestDiff;
        return a.dist - b.dist;
      });
  }, [inventory, origin.lat, origin.lon, zip, tier, targetPmt, down, tradeEq, negEq, fees, taxRate, bodies, radius]);

  function openSmartProtect(v: Vehicle, calc: { term: number; amountFinanced: number; aprLow: number; aprHigh: number }) {
    setSpVehicle(v);
    setSpCalc(calc);
    setSpOpen(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex items-center gap-3 mb-6">
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-2 rounded-2xl bg-black text-white">
            <SlidersHorizontal size={18} />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-semibold">Shop by Payment — DriveLogic + SmartProtect</h1>
        </header>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-white rounded-2xl shadow p-4 md:p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">ZIP Code</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={16} className="text-gray-500" />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="80751"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Radius: {radius} mi</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Distance Radius (miles)</label>
                <input type="range" min={10} max={300} step={5} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full" />
                <div className="text-sm">{radius} miles</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Target Payment</label>
                <input type="range" min={150} max={1200} step={10} value={targetPmt} onChange={(e) => setTargetPmt(parseInt(e.target.value))} className="w-full" />
                <div className="text-lg font-medium">{formatMoney(targetPmt)} / mo</div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Estimated Credit Tier</label>
                <TierSelect tier={tier} setTier={setTier} />
                <p className="text-xs text-gray-500 mt-1">T1: 781+, T2: 661–780, T3: 601–660, T4: ≤600 (self-reported)</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Down Payment</label>
                <input type="number" value={down} onChange={(e) => setDown(parseFloat(e.target.value || "0"))} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Trade Equity (+)</label>
                <input type="number" value={tradeEq} onChange={(e) => setTradeEq(parseFloat(e.target.value || "0"))} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Negative Equity (−)</label>
                <input type="number" value={negEq} onChange={(e) => setNegEq(parseFloat(e.target.value || "0"))} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
              </div>

              <div>
                <label className="text-sm text-gray-600">Body Style</label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {(["SUV", "Truck", "Car", "Van"] as Body[]).map((b) => (
                    <BodyChip
                      key={b}
                      label={b}
                      active={bodies.includes(b)}
                      onToggle={() => setBodies((prev) => (prev.includes(b) ? (prev.filter((x) => x !== b) as Body[]) : [...prev, b]))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 md:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Info size={16} />
              <span className="text-sm">Estimate only. Final terms depend on lender approval, credit profile, vehicle, and programs.</span>
            </div>
            <div className="text-xs text-gray-500">Tax {Math.round(taxRate * 1000) / 10}% • Fees ${fees} • ZIP {zip || "—"}</div>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90">
              <Search size={16} />
              Update Results
            </button>
          </div>
        </div>

        {loading && <div className="mb-4 text-sm text-gray-600">Loading inventory…</div>}
        {loadError && <div className="mb-4 text-sm text-red-600">Error: {loadError}</div>}

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">Showing {list.length} results within {radius} miles</div>
          <div className="text-sm text-gray-500">Sorted by best payment fit, then distance</div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {list.map((row) => (
            <motion.div key={row.v.vin} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100" style={{ backgroundImage: `url(${row.v.img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {row.v.year} {row.v.make} {row.v.model}{row.v.trim ? ` • ${row.v.trim}` : ""}
                  </h3>
                  <div className="text-sm text-gray-500">{row.v.miles.toLocaleString()} mi</div>
                </div>
                <div className="text-gray-700 mt-1">{row.v.dealer} • {row.v.city}, {row.v.state} • {row.dist.toFixed(1)} mi</div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">{row.v.body}</span>
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">Band {row.band}</span>
                  {row.capInfo.cap && (
                    <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs">CO 21% cap</span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {row.payments.map((p) => (
                    <span key={p.term} className={`px-3 py-1 rounded-full text-sm border ${p.term === row.best.term ? "bg-black text-white border-black" : "bg-white border-gray-300"}`}>
                      {p.term} mo: {formatMoney(p.pmtLow)}–{formatMoney(p.pmtHigh)}
                    </span>
                  ))}
                </div>

                <details className="mt-3 group">
                  <summary className="cursor-pointer text-sm text-gray-700 flex items-center gap-2">
                    Why this estimate?
                    <span className="text-gray-400 group-open:hidden">▸</span>
                    <span className="text-gray-400 hidden group-open:inline">▾</span>
                  </summary>
                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <div>Credit tier: <b>{tier}</b> • Age: <b>{row.age} yrs</b> • Miles: <b>{row.v.miles.toLocaleString()}</b></div>
                    <div>APR range: <b>{formatAPR(row.aprLow)}–{formatAPR(row.aprHigh)}</b> {row.capInfo.cap ? "(capped)" : ""}</div>
                    <div>Amount financed includes tax & fees and your down/trade selections.</div>
                    <div className="text-xs text-gray-500">Estimates only; lender approval & programs will set final terms.</div>
                  </div>
                </details>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
                    onClick={() => openSmartProtect(row.v, { term: row.best.term, amountFinanced: row.amountFinanced, aprLow: row.aprLow, aprHigh: row.aprHigh })}
                  >
                    <span className="inline-flex items-center gap-2"><Shield size={16} /> SmartProtect</span>
                  </button>

                  {!row.withinBand && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-flex items-center gap-1">
                      <AlertTriangle size={12} /> Payment not in target; try shorter term or add down.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!loading && list.length === 0 && (
          <div className="mt-6 p-4 rounded-2xl border border-dashed border-gray-300 text-center text-gray-600">
            No matches under {formatMoney(targetPmt)} within {radius} miles. Try increasing radius, adding down, or selecting more body styles.
          </div>
        )}

        {/* SmartProtect Modal */}
        {spOpen && spVehicle && spCalc && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="text-white font-semibold flex items-center gap-2">
                  <Shield size={18} /> SmartProtect — {spVehicle.year} {spVehicle.make} {spVehicle.model}
                </div>
                <button className="text-white/80 hover:text-white" onClick={() => setSpOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="p-4">
                <SmartProtect
                  scenario={{
                    vehicle: `${spVehicle.year} ${spVehicle.make} ${spVehicle.model}${spVehicle.trim ? ` ${spVehicle.trim}` : ""}`,
                    vin: spVehicle.vin,
                    dealer: spVehicle.dealer,
                    term: spCalc.term,
                    amountFinanced: spCalc.amountFinanced,
                    vehiclePrice: spVehicle.price,
                    miles: spVehicle.miles,
                    isNew: spVehicle.miles < 200,
                    aprLow: spCalc.aprLow,
                    aprHigh: spCalc.aprHigh,
                    deductible: 0,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
