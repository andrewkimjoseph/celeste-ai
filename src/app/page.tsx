import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <main className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
        <AppShell />
      </main>
    </Providers>
  );
}
