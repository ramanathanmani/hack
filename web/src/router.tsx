/**
 * router.tsx — minimal hand-rolled router. Only "/" and "/audit" need to
 * work for M1 (design.md §1: "/" is self-sufficient, "/audit" is the one
 * required second stop). No router dependency is named in architecture.md,
 * so no new dependency is added — this is ~30 lines of pushState + a
 * useSyncExternalStore subscription.
 */
import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot(): string {
  return window.location.pathname;
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => "/");
}

interface NavigateCtx {
  navigate: (path: string) => void;
}

const NavigateContext = createContext<NavigateCtx>({
  navigate: (path: string) => {
    window.location.assign(path);
  },
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const navigate = useCallback((path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <NavigateContext.Provider value={{ navigate }}>
      {children}
    </NavigateContext.Provider>
  );
}

export function useNavigate(): (path: string) => void {
  return useContext(NavigateContext).navigate;
}

export function Link({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
