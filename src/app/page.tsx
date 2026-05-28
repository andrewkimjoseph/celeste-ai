import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <main className="mx-auto flex h-dvh w-full max-w-7xl flex-col">
        <AppShell />
      </main>
    </Providers>
  );
}
