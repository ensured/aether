"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CameraPanningIndicatorProps {
  isVisible: boolean;
  message?: string;
}

export const CameraPanningIndicator = ({
  isVisible,
  message = "Focusing on new nodes...",
}: CameraPanningIndicatorProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
              />
              <span className="text-sm font-medium text-foreground">
                {message}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Variant for corner placement
export const CornerCameraPanningIndicator = ({
  isVisible,
  message = "Panning...",
}: CameraPanningIndicatorProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full"
              />
              <span className="text-xs font-medium">{message}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Minimal dot indicator
export const DotCameraPanningIndicator = ({
  isVisible,
}: Omit<CameraPanningIndicatorProps, "message">) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.15 }}
          className="fixed top-6 left-6 sm:top-8 sm:left-8 z-50"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-3 h-3 bg-primary rounded-full shadow-lg"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
