import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <main className="app-frame flex min-h-0 w-full flex-col overflow-hidden">
        <AppShell />
      </main>
    </Providers>
  );
}
