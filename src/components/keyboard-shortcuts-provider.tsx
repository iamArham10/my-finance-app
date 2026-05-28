"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts, formatShortcut, type ShortcutMapping } from "@/lib/hooks/use-keyboard-shortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Command } from "lucide-react";

interface KeyboardShortcutsContextType {
  openHelp: () => void;
  closeHelp: () => void;
  registerGlobalShortcuts: (shortcuts: ShortcutMapping[]) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  openHelp: () => {},
  closeHelp: () => {},
  registerGlobalShortcuts: () => {},
});

export function useKeyboardShortcutsContext() {
  return useContext(KeyboardShortcutsContext);
}

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Registry of all active shortcuts to display in the help modal
  const [registry, setRegistry] = useState<ShortcutMapping[]>([]);

  const registerGlobalShortcuts = useCallback((newShortcuts: ShortcutMapping[]) => {
    setRegistry((prev) => {
      const merged = [...prev];
      for (const s of newShortcuts) {
        if (!merged.find((m) => m.key === s.key && m.meta === s.meta && m.ctrl === s.ctrl)) {
          merged.push(s);
        }
      }
      return merged;
    });
  }, []);

  const defaultShortcuts: ShortcutMapping[] = useMemo(
    () => [
      {
        key: "/",
        meta: true,
        description: "Show keyboard shortcuts",
        category: "General",
        action: () => setIsOpen((o) => !o),
      },
      {
        key: "d",
        meta: true,
        shift: true,
        description: "Go to Dashboard",
        category: "Navigation",
        action: () => router.push("/dashboard"),
      },
      {
        key: "m",
        meta: true,
        shift: true,
        description: "Go to Manage",
        category: "Navigation",
        action: () => router.push("/dashboard/manage"),
      },
      {
        key: "a",
        meta: true,
        shift: true,
        description: "Go to Analytics",
        category: "Navigation",
        action: () => router.push("/dashboard/analytics"),
      },
      {
        key: ",",
        meta: true,
        description: "Go to Settings",
        category: "Navigation",
        action: () => router.push("/dashboard/settings"),
      },
    ],
    [router]
  );

  // Apply the default shortcuts
  useKeyboardShortcuts(defaultShortcuts);

  // Sync defaults to registry once on mount
  useMemo(() => {
    setRegistry(defaultShortcuts);
  }, [defaultShortcuts]);

  const value = {
    openHelp: () => setIsOpen(true),
    closeHelp: () => setIsOpen(false),
    registerGlobalShortcuts,
  };

  // Group registry by category
  const grouped = registry.reduce((acc, curr) => {
    if (!acc[curr.category]) acc[curr.category] = [];
    acc[curr.category].push(curr);
    return acc;
  }, {} as Record<string, ShortcutMapping[]>);

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--text-primary)]">
              <Command className="w-5 h-5 text-[var(--text-secondary)]" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(grouped).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {s.description}
                      </span>
                      <kbd className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-primary)]">
                        {formatShortcut(s)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </KeyboardShortcutsContext.Provider>
  );
}
