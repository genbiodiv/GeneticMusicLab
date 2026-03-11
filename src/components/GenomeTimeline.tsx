import React from "react";
import { MusicalGenome } from "../types";
import { motion } from "motion/react";

interface GenomeTimelineProps {
  genome: MusicalGenome;
  currentTime: number;
}

export const GenomeTimeline: React.FC<GenomeTimelineProps> = ({ genome, currentTime }) => {
  const maxDuration = 5;
  const pixelsPerSecond = 180; // Increased for better resolution on 5s

  return (
    <div className="w-full bg-zinc-900/50 rounded-xl border border-white/10 p-4 overflow-x-auto">
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
            <div key={layer.layerId} className="relative h-12 bg-white/5 rounded-lg border border-white/5 group">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full pr-4 text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
                {layer.layerId}
              </div>
              {(layer.events || []).map((event) => (
                <motion.div
                  key={event.eventId}
                  className="absolute top-1 bottom-1 bg-emerald-500/30 border border-emerald-500/50 rounded-sm flex items-center justify-center overflow-hidden"
                  style={{
                    left: `${event.start * pixelsPerSecond}px`,
                    width: `${event.duration * pixelsPerSecond}px`,
                  }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.5)" }}
                >
                  <span className="text-[8px] text-emerald-200 font-mono truncate px-1">
                    {event.sampleId}
                  </span>
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* Time Markers */}
        <div className="mt-4 flex border-t border-white/10 pt-2">
          {Array.from({ length: maxDuration + 1 }).map((_, i) => (
            <div key={i} className="relative" style={{ width: `${pixelsPerSecond}px` }}>
              <div className="absolute left-0 h-2 w-px bg-white/20" />
              <span className="absolute left-1 top-2 text-[10px] text-zinc-600 font-mono">{i}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
