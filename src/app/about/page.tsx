import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full rounded-2xl border border-[var(--surface-2)] bg-[var(--surface-1)]/70 p-6 shadow-xl shadow-black/20 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">
          About Celeste
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Your cosmic copilot for Celo
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
          Celeste turns wallet actions into guided cosmic missions. Connect your
          wallet, ask in plain language, and Celeste helps you route sends,
          swaps, savings, and GoodDollar actions across the Celo ecosystem.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)]/60 p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Stellar capabilities
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              <li>Send stablecoins and tokens on Celo</li>
              <li>Swap across Mento, reserve, and Uniswap routes</li>
              <li>Save and withdraw on Aave V3</li>
              <li>Claim and manage GoodDollar flows</li>
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)]/60 p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              How each mission works
            </h2>
            <ol className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              <li>1. You describe the action in chat.</li>
              <li>2. Celeste prepares the transaction steps.</li>
              <li>3. You review and sign in your wallet.</li>
              <li>4. Celeste confirms completion in-thread.</li>
            </ol>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)]/60 p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Built for clarity and control
          </h2>
          <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)] sm:text-sm">
            Celeste does not auto-send transactions. It prepares flows and keeps
            the final signature with you. You stay captain of the wallet while
            Celeste handles route intelligence and execution guidance.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent)]"
          >
            Return to chat
          </Link>
          <a
            href="https://usecelina.xyz"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            Explore Celina ecosystem
          </a>
        </div>
      </div>
    </main>
  );
}
