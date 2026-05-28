"use client";

import { useEffect, useCallback } from "react";

export interface ShortcutMapping {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: string;
}

const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

/**
 * Hook to register global keyboard shortcuts.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMapping[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Allow escape key to still work even when focused in an input
        if (e.key !== "Escape") return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === e.ctrlKey;
        const metaMatch = !!shortcut.meta === e.metaKey;
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format a shortcut for display based on the OS.
 */
export function formatShortcut(shortcut: Omit<ShortcutMapping, "action">): string {
  const parts = [];
  if (shortcut.ctrl || (shortcut.meta && !isMac)) parts.push("Ctrl");
  if (shortcut.meta && isMac) parts.push("⌘");
  if (shortcut.alt && isMac) parts.push("⌥");
  if (shortcut.alt && !isMac) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  
  let key = shortcut.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  
  parts.push(key);
  return parts.join(isMac ? " " : " + ");
}
