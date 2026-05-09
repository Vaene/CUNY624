export default function HomePage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <main className="next-shell">
      <section className="deck-frame-shell" aria-label="Tree presentation">
        <iframe
          className="deck-frame"
          src={`${basePath}/presentation/index.html`}
          title="Tree-based models presentation"
        />
      </section>
    </main>
  );
}
