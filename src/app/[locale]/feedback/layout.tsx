import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return buildMetadata({
    locale,
    pathname: "/feedback",
    title: dictionary.metadata.feedback.title,
    description: dictionary.metadata.feedback.description,
  });
}

export default function FeedbackLayout({ children }: { children: ReactNode }) {
  return children;
}
