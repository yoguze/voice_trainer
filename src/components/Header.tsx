"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FadeIn } from "@/components/motion";

type HeaderProps = {
  locale: string;
};

export function Header({ locale }: HeaderProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const otherLocale = locale === "ja" ? "en" : "ja";
  const switchedPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const links = [
    { href: `/${locale}/settings`, label: t("settings") },
    { href: `/${locale}/practice`, label: t("practice") },
    { href: `/${locale}/history`, label: t("history") },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-20 border-b border-pink-100 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-xl">🎤</span>
          <span className="font-semibold text-pink-500">Voice Trainer</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-block rounded-full px-3 py-1 transition ${
                    isActive
                      ? "bg-pink-100 text-pink-600"
                      : "text-slate-600 hover:bg-pink-50 hover:text-pink-600"
                  }`}
                >
                  {link.label}
                </motion.span>
              </Link>
            );
          })}
          <Link href={switchedPath}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block rounded-full border border-pink-200 px-3 py-1 text-xs font-medium text-pink-600 transition hover:bg-pink-50"
            >
              {otherLocale.toUpperCase()}
            </motion.span>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}

export function PageShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <FadeIn className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-slate-500">{subtitle}</p>
        ) : null}
      </FadeIn>
      {children}
    </div>
  );
}
