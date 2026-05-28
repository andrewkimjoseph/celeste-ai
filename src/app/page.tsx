import { ChatPanel } from "@/components/chat-panel";
import { Providers } from "@/components/providers";

export default function Home() {
  return (
    <Providers>
      <main className="mx-auto flex h-dvh max-w-3xl flex-col bg-zinc-950">
        <ChatPanel />
      </main>
    </Providers>
  );
}
