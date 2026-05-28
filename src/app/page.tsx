import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <main className="mx-auto flex h-dvh min-h-0 w-full max-w-7xl flex-col overflow-hidden">
        <AppShell />
      </main>
    </Providers>
  );
}
