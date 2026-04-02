"use client";

import { useAppStore } from "@/lib/store";
import { evidenceInputs, confidenceAreas } from "@/data/mock-data";
import { X, CheckCircle2, AlertCircle, MinusCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig = {
  modeled: { label: "Modeled", icon: CheckCircle2, color: "var(--positive)", bg: "var(--positive-soft)" },
  mocked: { label: "Mocked", icon: AlertCircle, color: "var(--warning)", bg: "var(--warning-soft)" },
  proxy: { label: "Proxy", icon: MinusCircle, color: "var(--info)", bg: "var(--info-soft)" },
  "not-represented": { label: "Not represented", icon: HelpCircle, color: "var(--text-secondary)", bg: "var(--brand-100)" },
};

const confidenceColors = {
  high: "var(--positive)",
  medium: "var(--warning)",
  low: "var(--negative)",
};

export function EvidenceDrawer() {
  const { evidenceOpen, toggleEvidence } = useAppStore();

  return (
    <AnimatePresence>
      {evidenceOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={toggleEvidence}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed right-0 top-0 bottom-0 w-[340px] xl:w-[420px] z-50 overflow-y-auto"
            style={{
              background: "var(--canvas-surface)",
              borderLeft: "1px solid var(--outline-secondary)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{
                borderBottom: "1px solid var(--outline-secondary)",
                background: "var(--canvas-surface)",
              }}
            >
              <h2 className="heading-sm" style={{ color: "var(--text-primary)" }}>
                Evidence & Assumptions
              </h2>
              <button
                onClick={toggleEvidence}
                className="p-1 transition-opacity hover:opacity-70"
                style={{ borderRadius: "var(--radius-xs)" }}
              >
                <X size={16} style={{ color: "var(--icon-secondary)" }} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-6">
              <section>
                <h3 className="label-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Planning Inputs
                </h3>
                <div className="space-y-2">
                  {evidenceInputs.map((input) => {
                    const cfg = statusConfig[input.status];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={input.name}
                        className="flex items-start gap-3 p-2.5"
                        style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}
                      >
                        <div
                          className="flex items-center justify-center w-5 h-5 mt-0.5"
                          style={{ background: cfg.bg, borderRadius: "var(--radius-xs)" }}
                        >
                          <Icon size={11} style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{input.name}</span>
                            <span
                              className="action-xs px-1.5 py-0.5"
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                borderRadius: "var(--radius-xl)",
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="body-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{input.note}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="label-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Confidence by Output Area
                </h3>
                <div className="space-y-2">
                  {confidenceAreas.map((area) => (
                    <div
                      key={area.area}
                      className="flex items-start gap-3 p-2.5"
                      style={{ background: "var(--brand-100)", borderRadius: "var(--radius-sm)" }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: confidenceColors[area.level] }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="body-sm font-medium" style={{ color: "var(--text-primary)" }}>{area.area}</span>
                          <span className="label-sm" style={{ color: confidenceColors[area.level] }}>
                            {area.level}
                          </span>
                        </div>
                        <p className="body-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{area.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="label-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Key Assumptions
                </h3>
                <ul className="space-y-1.5 body-sm" style={{ color: "var(--text-secondary)" }}>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Demand forecast based on synthetic weekly pattern, not client historical data</li>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Labor standards are industry benchmarks, not facility-calibrated</li>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Cost parameters are directional market rates by skill level</li>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Worker pool and availability are representative, not client-specific</li>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Annualized values use 52-week projection with conservative / expected / upside range</li>
                  <li className="flex gap-2"><span style={{ color: "var(--icon-tertiary)" }}>•</span> Equipment and dock capacity constraints not yet modeled</li>
                </ul>
              </section>

              <section>
                <h3 className="label-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  Value Logic
                </h3>
                <div className="body-sm space-y-2" style={{ color: "var(--text-secondary)" }}>
                  <p><strong style={{ color: "var(--text-primary)" }}>OT reduction:</strong> (Baseline OT hours − Optimized OT hours) × OT premium rate × 52 weeks</p>
                  <p><strong style={{ color: "var(--text-primary)" }}>Agency reduction:</strong> (Baseline agency hours − Optimized agency hours) × agency hourly rate × 52 weeks</p>
                  <p><strong style={{ color: "var(--text-primary)" }}>Staffing balance:</strong> Overstaffing hour reduction × average idle cost rate × 52 weeks</p>
                  <p><strong style={{ color: "var(--text-primary)" }}>Service uplift:</strong> SLA miss rate improvement × estimated cost-per-miss × annual volume</p>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
