import React from "react";
import { motion } from "motion/react";

interface LabLogoProps {
  size?: number;
  theme?: "dark" | "light";
}

export const LabLogo: React.FC<LabLogoProps> = ({ size = 40, theme = "dark" }) => {
  // DNA Helix parameters
  const rungs = 6;
  const width = size;
  const height = size;
  const padding = size * 0.1;
  const helixWidth = size - padding * 2;
  const helixHeight = size - padding * 2;

  return (
    <div 
      className="relative flex items-center justify-center overflow-hidden rounded-xl"
      style={{ width, height }}
    >
      {/* Background Glow */}
      <motion.div 
        className="absolute inset-0 bg-emerald-600/20 blur-xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* DNA Strands */}
        <motion.path
          d={`M ${padding} ${padding} Q ${width/2} ${height/2} ${width-padding} ${height-padding}`}
          stroke="currentColor"
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          className="text-emerald-500 opacity-40"
          animate={{ 
            d: [
              `M ${padding} ${padding} Q ${width/2} ${height/2} ${width-padding} ${height-padding}`,
              `M ${padding} ${height-padding} Q ${width/2} ${height/2} ${width-padding} ${padding}`,
              `M ${padding} ${padding} Q ${width/2} ${height/2} ${width-padding} ${height-padding}`,
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d={`M ${width-padding} ${padding} Q ${width/2} ${height/2} ${padding} ${height-padding}`}
          stroke="currentColor"
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          className="text-emerald-400 opacity-40"
          animate={{ 
            d: [
              `M ${width-padding} ${padding} Q ${width/2} ${height/2} ${padding} ${height-padding}`,
              `M ${width-padding} ${height-padding} Q ${width/2} ${height/2} ${padding} ${padding}`,
              `M ${width-padding} ${padding} Q ${width/2} ${height/2} ${padding} ${height-padding}`,
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Musical Rungs (Notes/Bars) */}
        {Array.from({ length: rungs }).map((_, i) => {
          const y = padding + (helixHeight / (rungs - 1)) * i;
          const progress = i / (rungs - 1);
          // Sine wave for helix width at this point
          const xOffset = Math.sin(progress * Math.PI) * (helixWidth / 2);
          
          return (
            <motion.g key={i}>
              {/* The Rung */}
              <motion.line
                x1={width/2 - xOffset}
                y1={y}
                x2={width/2 + xOffset}
                y2={y}
                stroke="currentColor"
                strokeWidth={size * 0.05}
                className={`${theme === "dark" ? "text-white" : "text-zinc-900"} opacity-80`}
                animate={{ 
                  x1: [width/2 - xOffset, width/2 + xOffset, width/2 - xOffset],
                  x2: [width/2 + xOffset, width/2 - xOffset, width/2 + xOffset],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Musical Note Head */}
              <motion.circle
                cx={width/2 + xOffset}
                cy={y}
                r={size * 0.06}
                fill="currentColor"
                className={theme === "dark" ? "text-emerald-300" : "text-emerald-600"}
                animate={{ 
                  cx: [width/2 + xOffset, width/2 - xOffset, width/2 + xOffset],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          );
        })}

        {/* Central Pulse (Change/Mutation) */}
        <motion.circle
          cx={width/2}
          cy={height/2}
          r={size * 0.15}
          fill="currentColor"
          className="text-emerald-500"
          animate={{ 
            scale: [0.8, 1.5, 0.8],
            opacity: [0.4, 0.8, 0.4],
            filter: ["blur(0px)", "blur(4px)", "blur(0px)"]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
};
