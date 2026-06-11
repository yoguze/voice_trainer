"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

export default function TitlePage() {
  const t = useTranslations("title");
  const nav = useTranslations("nav");
  const locale = useLocale();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-5xl shadow-lg"
        >
          🎤
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-slate-800 sm:text-5xl"
        >
          Voice Trainer
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-lg text-pink-500"
        >
          {t("tagline")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-sm leading-relaxed text-slate-500"
        >
          {t("description")}
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-2 text-left text-sm text-slate-600"
        >
          {[t("feature1"), t("feature2"), t("feature3")].map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="text-pink-400">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center"
        >
          {(
            [
              { href: `/${locale}/practice`, label: nav("play"), primary: true },
              { href: `/${locale}/settings`, label: nav("settings"), primary: false },
              { href: `/${locale}/history`, label: nav("history"), primary: false },
            ] as const
          ).map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex min-w-[120px] justify-center rounded-full px-8 py-4 text-base font-semibold shadow-md ${
                  action.primary
                    ? "bg-gradient-to-r from-pink-400 to-purple-400 text-white"
                    : "border border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
                }`}
              >
                {action.label}
              </motion.span>
            </Link>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-6 text-xs text-slate-400"
        >
          {t("privacyNote")}
        </motion.p>
      </motion.div>
    </div>
  );
}
