import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import { useEffect, useState, type ReactNode } from "react";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";

const queryClient = new QueryClient();

function redirectToLoginIfUnauthorized(error: unknown) {
  if (!(error instanceof TRPCClientError) || typeof window === "undefined" || error.message !== UNAUTHED_ERR_MSG) return;
  window.location.href = getLoginUrl();
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type !== "updated" || event.action.type !== "error") return;
  redirectToLoginIfUnauthorized(event.query.state.error);
  console.error("[API Query Error]", event.query.state.error);
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type !== "updated" || event.action.type !== "error") return;
  redirectToLoginIfUnauthorized(event.mutation.state.error);
  console.error("[API Mutation Error]", event.mutation.state.error);
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          const prefix = `${COOKIE_NAME}=`;
          const token = raw?.split(";").find(value => value.trim().startsWith(prefix))?.trim().slice(prefix.length);
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch {
          return {};
        }
      },
      fetch(input, init) {
        return globalThis.fetch(input, { ...(init ?? {}), credentials: "include" });
      },
    }),
  ],
});

function PlatformEntrance({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <div className={`workspace-platform-shell${isReady ? " is-ready" : ""}`}>{children}</div>;
}

export function mountPlatform(root: HTMLElement) {
  createRoot(root).render(
    <PlatformEntrance>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    </PlatformEntrance>,
  );
}
