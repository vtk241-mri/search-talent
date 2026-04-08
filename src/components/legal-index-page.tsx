import LocalizedLink from "@/components/ui/localized-link";

type LegalIndexCard = {
  href: string;
  title: string;
  description: string;
};

type LegalIndexPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: LegalIndexCard[];
};

export default function LegalIndexPage({
  eyebrow,
  title,
  description,
  cards,
}: LegalIndexPageProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <section className="rounded-[2.25rem] app-card p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] app-soft">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 app-muted">
          {description}
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <LocalizedLink
            key={card.href}
            href={card.href}
            className="rounded-[2rem] app-card p-6 transition hover:-translate-y-0.5 hover:border-[color:var(--foreground)] hover:shadow-xl"
          >
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 app-muted">{card.description}</p>
          </LocalizedLink>
        ))}
      </section>
    </main>
  );
}
