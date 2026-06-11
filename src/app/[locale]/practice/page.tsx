"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { AnimatedPage } from "@/components/motion";
import { PageShell } from "@/components/Header";
import { Recorder } from "@/components/Recorder";
import { useStoreHydrated } from "@/stores/voice-trainer-store";

export default function PracticePage() {
  const t = useTranslations("practice");
  const params = useParams<{ locale: string }>();
  const hasHydrated = useStoreHydrated();

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      {hasHydrated ? (
        <AnimatedPage>
          <Recorder locale={params.locale} />
        </AnimatedPage>
      ) : (
        <p className="text-center text-slate-500">{t("needSettings")}</p>
      )}
    </PageShell>
  );
}
