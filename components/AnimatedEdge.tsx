"use client";

import { memo } from "react";
import { BaseEdge, EdgeProps, getSmoothStepPath } from "@xyflow/react";
import { motion } from "framer-motion";

/**
 * Custom animated edge with fade-in and draw effect
 */
const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <g className="react-flow__edge-animated">
      {/* Background edge for better visibility */}
      <BaseEdge
        id={`${id}-bg`}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: "transparent",
        }}
      />

      {/* Animated edge path */}
      <motion.path
        id={id}
        d={edgePath}
        fill="none"
        className="react-flow__edge-path"
        style={{
          stroke: style?.stroke || "rgba(148, 163, 184, 0.6)",
          strokeWidth: style?.strokeWidth || 1.5,
          strokeLinecap: "round",
        }}
        initial={{
          pathLength: 0,
          opacity: 0,
        }}
        animate={{
          pathLength: 1,
          opacity: 1,
        }}
        transition={{
          pathLength: {
            duration: 0.5,
            ease: "easeOut",
          },
          opacity: {
            duration: 0.3,
            ease: "easeOut",
          },
        }}
        markerEnd={markerEnd}
      />

      {/* Optional: Animated dot traveling along the edge */}
      <motion.circle
        r={2}
        fill="rgba(148, 163, 184, 0.8)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 1.5,
          delay: 0.3,
          ease: "easeInOut",
        }}
      >
        <animateMotion
          dur="1.5s"
          begin="0.3s"
          fill="freeze"
          path={edgePath}
        />
      </motion.circle>
    </g>
  );
};

AnimatedEdge.displayName = "AnimatedEdge";

export default memo(AnimatedEdge);
