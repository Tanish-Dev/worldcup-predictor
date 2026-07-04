export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="site-dark flex min-h-screen flex-col text-ink-primary">
      {/* pt-20 clears the floating pill nav rendered by the root layout */}
      <main className="flex-1 pt-20">{children}</main>
      <footer className="border-t border-border backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-muted">
          Predictions are simulated, not guaranteed — built to explore how the
          World Cup might unfold, not to bet on it.
        </div>
      </footer>
    </div>
  );
}
