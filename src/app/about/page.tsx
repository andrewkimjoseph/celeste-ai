import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AboutPage() {
  return (
    <main className="h-full overflow-y-auto bg-[var(--canvas)]">
      <div className="mx-auto flex min-h-full w-full max-w-4xl items-center px-4 py-8 sm:px-6 sm:py-10">
        <div className="card-brutal relative w-full p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              About Celeste
            </p>
            <ThemeToggle />
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="box-decoration-clone bg-[var(--accent)] px-1.5 text-[var(--accent-foreground)]">
              Your wallet copilot for Celo
            </span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Celeste turns wallet actions into guided chats. Connect your
            wallet, ask in plain language, and Celeste helps you route sends,
            swaps, savings, and GoodDollar actions across the Celo ecosystem.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <section className="relative rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] p-4 shadow-[var(--shadow-brutal-sm)]">
              <span className="absolute -right-1 -top-2 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--accent-foreground)]">
                4
              </span>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                What Celeste can do
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                <li>Send stablecoins and tokens on Celo</li>
                <li>Swap across Mento, reserve, and Uniswap routes</li>
                <li>Save and withdraw on Aave V3</li>
                <li>Claim and manage GoodDollar flows</li>
              </ul>
            </section>

            <section className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] p-4 shadow-[var(--shadow-brutal-sm)]">
              <h2 className="text-sm font-bold text-[var(--ink)]">
                How it works
              </h2>
              <ol className="mt-2 space-y-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                <li>1. You describe the action in chat.</li>
                <li>2. Celeste prepares the transaction steps.</li>
                <li>3. You review and sign in your wallet.</li>
                <li>4. Celeste confirms completion in-thread.</li>
              </ol>
            </section>
          </div>

          <section className="relative mt-6 overflow-hidden rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] p-4 shadow-[var(--shadow-brutal-sm)]">
            <div className="dot-grid pointer-events-none absolute inset-y-0 right-0 w-16 opacity-25" aria-hidden />
            <h2 className="text-sm font-bold text-[var(--ink)]">
              Built for clarity and control
            </h2>
            <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)] sm:text-sm">
              Celeste does not auto-send transactions. It prepares flows and keeps
              the final signature with you. You stay in control of the wallet while
              Celeste handles route intelligence and execution guidance.
            </p>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="btn-brutal btn-primary px-4 py-2 text-sm"
            >
              Return to chat
            </Link>
            <a
              href="https://usecelina.xyz"
              target="_blank"
              rel="noreferrer"
              className="btn-brutal btn-secondary px-4 py-2 text-sm"
            >
              Explore Celina ecosystem
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
