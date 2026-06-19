"use client";

import {
  createEmptyActiveChat,
  resolveChatUiState,
  toChatListItem,
  type ActiveChatState,
  type ChatListItem,
  type ChatUiState,
} from "@/lib/chats";
import {
  deleteChat as deleteChatFromDb,
  getChat,
  listChats,
  upsertChat,
} from "@/lib/chat-db";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import type { UIMessage } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ChatContextValue {
  chats: ChatListItem[];
  activeChatId: string | null;
  activeChat: ActiveChatState | null;
  isLoading: boolean;
  persistenceEnabled: boolean;
  isHistoryOpen: boolean;
  openHistory: () => void;
  closeHistory: () => void;
  createChat: () => Promise<void>;
  selectChat: (id: string) => Promise<void>;
  deleteChat: (id: string) => Promise<void>;
  saveActiveChat: (
    messages: UIMessage[],
    uiState: ChatUiState,
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const EMPTY_CHATS: ChatListItem[] = [];

interface ChatProviderProps {
  address?: `0x${string}`;
  children: ReactNode;
}

function createChatId(): string {
  return crypto.randomUUID();
}

export function ChatProvider({ address, children }: ChatProviderProps) {
  const [chats, setChats] = useState<ChatListItem[]>(EMPTY_CHATS);
  const [activeChat, setActiveChat] = useState<ActiveChatState | null>(() =>
    createEmptyActiveChat(createChatId()),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const activeChatRef = useRef<ActiveChatState | null>(null);
  const persistenceEnabledRef = useRef(true);

  const walletAddress = address?.toLowerCase();

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    persistenceEnabledRef.current = persistenceEnabled;
  }, [persistenceEnabled]);

  const refreshChatList = useCallback(async (wallet: string) => {
    const rows = await listChats(wallet);
    setChats(rows.map(toChatListItem));
    return rows;
  }, []);

  const persistChat = useCallback(
    async (
      chat: ActiveChatState,
      wallet: `0x${string}`,
    ): Promise<void> => {
      if (!persistenceEnabledRef.current) {
        return;
      }

      try {
        const saved = await upsertChat({
          id: chat.id,
          address: wallet,
          messages: chat.messages,
          uiState: {
            dismissedFlowKey: chat.dismissedFlowKey,
            txCardBlockedUntilUserMessage: chat.txCardBlockedUntilUserMessage,
          },
        });

        if (saved) {
          setChats((current) => {
            const item = toChatListItem(saved);
            const without = current.filter((entry) => entry.id !== saved.id);
            return [item, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
          });
          return;
        }

        setChats((current) => current.filter((entry) => entry.id !== chat.id));
      } catch (error) {
        console.warn("Celeste chat persistence unavailable:", error);
        setPersistenceEnabled(false);
      }
    },
    [],
  );

  const flushActiveChat = useCallback(async () => {
    const chat = activeChatRef.current;
    if (!chat || !address) {
      return;
    }

    await persistChat(chat, address);
  }, [address, persistChat]);

  const loadChatById = useCallback(
    async (id: string, wallet: `0x${string}`): Promise<ActiveChatState> => {
      if (!persistenceEnabledRef.current) {
        return createEmptyActiveChat(id);
      }

      try {
        const stored = await getChat(id);
        if (!stored || stored.address !== wallet.toLowerCase()) {
          return createEmptyActiveChat(id);
        }

        const uiState = resolveChatUiState(stored.messages, stored);
        return {
          id: stored.id,
          messages: stored.messages,
          dismissedFlowKey: uiState.dismissedFlowKey,
          txCardBlockedUntilUserMessage: uiState.txCardBlockedUntilUserMessage,
        };
      } catch (error) {
        console.warn("Celeste chat load failed:", error);
        setPersistenceEnabled(false);
        return createEmptyActiveChat(id);
      }
    },
    [],
  );

  useEffect(() => {
    if (!address || !walletAddress) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const rows = await listChats(address);
        if (cancelled) {
          return;
        }

        setChats(rows.map(toChatListItem));
        setPersistenceEnabled(true);

        if (rows.length > 0) {
          const latest = rows[0];
          const uiState = resolveChatUiState(latest.messages, latest);
          setActiveChat({
            id: latest.id,
            messages: latest.messages,
            dismissedFlowKey: uiState.dismissedFlowKey,
            txCardBlockedUntilUserMessage:
              uiState.txCardBlockedUntilUserMessage,
          });
          return;
        }

        setActiveChat(createEmptyActiveChat(createChatId()));
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.warn("Celeste chat persistence unavailable:", error);
        setPersistenceEnabled(false);
        setChats(EMPTY_CHATS);
        setActiveChat(createEmptyActiveChat(createChatId()));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, walletAddress]);

  const saveActiveChat = useCallback(
    async (messages: UIMessage[], uiState: ChatUiState) => {
      const current = activeChatRef.current;
      if (!current || !address) {
        return;
      }

      const next: ActiveChatState = {
        id: current.id,
        messages,
        dismissedFlowKey: uiState.dismissedFlowKey,
        txCardBlockedUntilUserMessage: uiState.txCardBlockedUntilUserMessage,
      };

      activeChatRef.current = next;
      setActiveChat(next);
      await persistChat(next, address);
    },
    [address, persistChat],
  );

  const createChat = useCallback(async () => {
    if (!address) {
      return;
    }

    await flushActiveChat();

    const current = activeChatRef.current;
    if (current && current.messages.length === 0) {
      trackEvent("new_chat_started", {});
      return;
    }

    const next = createEmptyActiveChat(createChatId());
    activeChatRef.current = next;
    setActiveChat(next);
    trackEvent("new_chat_started", {});
  }, [address, flushActiveChat]);

  const selectChat = useCallback(
    async (id: string) => {
      if (!address || activeChatRef.current?.id === id) {
        setIsHistoryOpen(false);
        return;
      }

      await flushActiveChat();

      const loaded = await loadChatById(id, address);
      activeChatRef.current = loaded;
      setActiveChat(loaded);
      setIsHistoryOpen(false);

      trackEvent("chat_thread_selected", {
        message_count: loaded.messages.length,
      });
    },
    [address, flushActiveChat, loadChatById],
  );

  const deleteChat = useCallback(
    async (id: string) => {
      if (!address) {
        return;
      }

      if (persistenceEnabledRef.current) {
        try {
          await deleteChatFromDb(id);
        } catch (error) {
          console.warn("Celeste chat delete failed:", error);
          setPersistenceEnabled(false);
        }
      }

      setChats((current) => current.filter((entry) => entry.id !== id));
      trackEvent("chat_thread_deleted", {});

      if (activeChatRef.current?.id !== id) {
        return;
      }

      const rows = persistenceEnabledRef.current
        ? await refreshChatList(address).catch(() => [])
        : [];

      if (rows.length > 0) {
        const latest = rows[0];
        const uiState = resolveChatUiState(latest.messages, latest);
        const next: ActiveChatState = {
          id: latest.id,
          messages: latest.messages,
          dismissedFlowKey: uiState.dismissedFlowKey,
          txCardBlockedUntilUserMessage: uiState.txCardBlockedUntilUserMessage,
        };
        activeChatRef.current = next;
        setActiveChat(next);
        return;
      }

      const next = createEmptyActiveChat(createChatId());
      activeChatRef.current = next;
      setActiveChat(next);
    },
    [address, refreshChatList],
  );

  const openHistory = useCallback(() => {
    trackEvent("chat_history_drawer_opened", { thread_count: chats.length });
    setIsHistoryOpen(true);
  }, [chats.length]);

  const closeHistory = useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      chats,
      activeChatId: activeChat?.id ?? null,
      activeChat,
      isLoading,
      persistenceEnabled,
      isHistoryOpen,
      openHistory,
      closeHistory,
      createChat,
      selectChat,
      deleteChat,
      saveActiveChat,
    }),
    [
      chats,
      activeChat,
      isLoading,
      persistenceEnabled,
      isHistoryOpen,
      openHistory,
      closeHistory,
      createChat,
      selectChat,
      deleteChat,
      saveActiveChat,
    ],
  );

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChats(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChats must be used within ChatProvider");
  }
  return context;
}
