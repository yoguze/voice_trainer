"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AnimatedPage, MotionButton, staggerContainer, staggerItem } from "@/components/motion";
import { HistoryChart } from "@/components/HistoryChart";
import { PageShell } from "@/components/Header";
import { clearSessions, getAllSessions } from "@/lib/db";
import type { Session } from "@/types";

export default function HistoryPage() {
  const t = useTranslations("history");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    const data = await getAllSessions();
    setSessions(data);
    setLoaded(true);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleClear = async () => {
    if (!window.confirm(t("confirmClear"))) return;
    await clearSessions();
    setSessions([]);
  };

  return (
    <PageShell title={t("title")}>
      {loaded && sessions.length === 0 ? (
        <p className="text-center text-slate-500">{t("empty")}</p>
      ) : (
        <AnimatedPage className="space-y-6">
          {sessions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="mb-3 text-lg font-semibold text-slate-700">
                {t("scoreChart")}
              </h2>
              <HistoryChart sessions={sessions} />
            </motion.div>
          ) : null}

          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {sessions.map((session) => (
              <motion.li
                key={session.id}
                variants={staggerItem}
                className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {new Date(session.createdAt).toLocaleString()}
                  </span>
                  <span className="text-xl font-bold text-pink-600">
                    {session.scores.total}
                  </span>
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {sessions.length > 0 ? (
            <div className="text-center">
              <MotionButton
                type="button"
                onClick={() => void handleClear()}
                className="rounded-full border border-red-200 px-5 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                {t("clearAll")}
              </MotionButton>
            </div>
          ) : null}
        </AnimatedPage>
      )}
    </PageShell>
  );
}
