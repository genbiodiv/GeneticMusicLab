import React from "react";
import { MusicalGenome } from "../types";
import { motion } from "motion/react";

interface GenomeTimelineProps {
  genome: MusicalGenome;
  currentTime: number;
  theme?: "dark" | "light";
}

export const GenomeTimeline: React.FC<GenomeTimelineProps> = ({ genome, currentTime, theme = "dark" }) => {
  const maxDuration = 5;
  const pixelsPerSecond = 180; // Increased for better resolution on 5s

  return (
    <div className={`w-full rounded-xl border p-4 overflow-x-auto transition-colors duration-300 ${
      theme === "dark" 
        ? "bg-zinc-900/50 border-white/10" 
        : "bg-white border-black"
    }`}>
      <div className="relative" style={{ width: `${maxDuration * pixelsPerSecond}px`, minHeight: "200px" }}>
        {/* Playhead */}
        <motion.div 
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
          animate={{ left: `${currentTime * pixelsPerSecond}px` }}
          transition={{ type: "tween", ease: "linear", duration: 0.1 }}
        />

        {/* Layers */}
        <div className="space-y-4">
          {(genome.layers || []).map((layer, idx) => (
            <div key={layer.layerId} className={`relative h-12 rounded-lg border group transition-colors duration-300 ${
              theme === "dark"
                ? "bg-white/5 border-white/5"
                : "bg-zinc-100/50 border-black/10"
            }`}>
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full pr-4 text-[10px] uppercase tracking-widest font-mono font-bold ${
                theme === "dark" ? "text-zinc-500" : "text-zinc-900"
              }`}>
                {layer.layerId}
              </div>
              {(layer.events || []).map((event) => (
                <motion.div
                  key={event.eventId}
                  className={`absolute top-1 bottom-1 border rounded-sm flex items-center justify-center overflow-hidden transition-colors duration-300 ${
                    theme === "dark"
                      ? "bg-emerald-500/30 border-emerald-500/50"
                      : "bg-emerald-400 border-emerald-600"
                  }`}
                  style={{
                    left: `${event.start * pixelsPerSecond}px`,
                    width: `${event.duration * pixelsPerSecond}px`,
                  }}
                  whileHover={{ scale: 1.05, backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.8)" }}
                >
                  <span className={`text-[8px] font-mono truncate px-1 font-bold ${
                    theme === "dark" ? "text-emerald-200" : "text-emerald-950"
                  }`}>
                    {event.sampleId}
                  </span>
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* Time Markers */}
        <div className={`mt-4 flex border-t pt-2 transition-colors duration-300 ${
          theme === "dark" ? "border-white/10" : "border-black/20"
        }`}>
          {Array.from({ length: maxDuration + 1 }).map((_, i) => (
            <div key={i} className="relative" style={{ width: `${pixelsPerSecond}px` }}>
              <div className={`absolute left-0 h-2 w-px transition-colors duration-300 ${
                theme === "dark" ? "bg-white/20" : "bg-black/20"
              }`} />
              <span className={`absolute left-1 top-2 text-[10px] font-mono font-bold ${
                theme === "dark" ? "text-zinc-600" : "text-zinc-900"
              }`}>{i}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
