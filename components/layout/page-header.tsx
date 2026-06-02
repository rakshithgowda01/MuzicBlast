export function PageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 pt-2">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
