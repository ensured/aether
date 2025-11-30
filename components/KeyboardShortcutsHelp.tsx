"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useKeyboardShortcutHelp } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp = ({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) => {
  const { shortcuts } = useKeyboardShortcutHelp();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-background border rounded-lg shadow-2xl max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-foreground">
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  aria-label="Close help"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="space-y-3">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted text-muted-foreground rounded border border-border">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-xs text-muted-foreground">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional tips */}
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Tips
                  </h3>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Click on nodes to generate child concepts</li>
                    <li>• Camera automatically pans to new nodes</li>
                    <li>• Use mouse wheel to zoom in/out</li>
                    <li>• Drag to pan manually</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background text-foreground rounded border">
                      ?
                    </kbd>{" "}
                    to toggle this help
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Floating help button component
export const KeyboardShortcutsButton = ({
  onClick,
}: {
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 bg-primary text-primary-foreground w-10 h-10 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
      aria-label="Show keyboard shortcuts"
      title="Keyboard shortcuts (?)"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </motion.button>
  );
};

// Hook to manage help modal state
export const useKeyboardShortcutsHelp = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);
  const toggleHelp = () => setIsHelpOpen((prev) => !prev);

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
  };
};
