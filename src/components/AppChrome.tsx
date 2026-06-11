"use client";

import { Header } from "@/components/Header";

export function AppChrome({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <>
      <Header locale={locale} />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
