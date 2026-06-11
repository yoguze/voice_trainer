"use client";

import { motion } from "framer-motion";
import type { Level } from "@/types";
import { FadeIn } from "@/components/motion";

type AxisCardProps = {
  title: string;
  labels: readonly string[];
  selected: Level;
  onSelect: (level: Level) => void;
  getLabel: (key: string) => string;
  delay?: number;
};

export function VoiceTypeSelector({
  title,
  labels,
  selected,
  onSelect,
  getLabel,
  delay = 0,
}: AxisCardProps) {
  return (
    <FadeIn delay={delay}>
      <motion.section
        layout
        className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-700">{title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {labels.map((labelKey, index) => {
            const level = (index + 1) as Level;
            const isSelected = selected === level;

            return (
              <motion.button
                key={labelKey}
                type="button"
                layout
                onClick={() => onSelect(level)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                animate={
                  isSelected
                    ? { scale: 1.02, boxShadow: "0 8px 24px rgba(236, 72, 153, 0.2)" }
                    : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                }
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                className={`rounded-2xl border px-3 py-4 text-sm font-medium ${
                  isSelected
                    ? "border-pink-400 bg-gradient-to-br from-pink-100 to-purple-100 text-pink-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-pink-200 hover:bg-pink-50"
                }`}
              >
                {getLabel(labelKey)}
              </motion.button>
            );
          })}
        </div>
      </motion.section>
    </FadeIn>
  );
}
