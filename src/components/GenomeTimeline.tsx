import React, { useRef, useEffect, useState } from "react";
import { MusicalGenome } from "../types";
import { motion } from "motion/react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { getAccentClasses } from "../utils/theme";

interface GenomeTimelineProps {
  genome: MusicalGenome;
  currentTime: number;
  theme?: "dark" | "light";
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onEventMove?: (layerId: string, eventId: string, newStart: number) => void;
  overlayGenomes?: MusicalGenome[];
  lineage?: MusicalGenome[];
  analysisMode?: boolean;
  intensity?: "conservative" | "radical";
  labels?: {
    zoomIn: string;
    zoomOut: string;
    fit: string;
  };
}

export const GenomeTimeline: React.FC<GenomeTimelineProps> = ({ 
  genome, 
  currentTime, 
  theme = "dark", 
  zoom: zoomProp,
  onZoomChange,
  onEventMove,
  overlayGenomes = [],
  lineage = [],
  analysisMode = false,
  intensity = "conservative",
  labels
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [internalZoom, setInternalZoom] = useState(zoomProp || 1);
  
  const zoom = zoomProp !== undefined ? zoomProp : internalZoom;
  const duration = genome.durationTarget || 5;
  const basePixelsPerSecond = 180;
  const pixelsPerSecond = basePixelsPerSecond * zoom;

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(4, newZoom));
    if (onZoomChange) {
      onZoomChange(clampedZoom);
    } else {
      setInternalZoom(clampedZoom);
    }
  };

  // Helper to determine conservation status of an event
  const getConservationStatus = (layerId: string, event: any, targetGenome: MusicalGenome = genome) => {
    if (!analysisMode || lineage.length === 0) return null;

    // Ancestors are all lineage members except the target one
    const ancestors = lineage.filter(g => g.genomeId !== targetGenome.genomeId);
    if (ancestors.length === 0) return "conserved"; // Root is conserved by default

    let matchCount = 0;
    ancestors.forEach(ancestor => {
      const ancestorLayer = ancestor.layers.find(l => l.layerId === layerId);
      if (ancestorLayer) {
        const hasMatch = ancestorLayer.events.some(e => 
          e.sampleId === event.sampleId && 
          Math.abs(e.start - event.start) < 0.01 && 
          Math.abs(e.duration - event.duration) < 0.01
        );
        if (hasMatch) matchCount++;
      }
    });

    if (matchCount === ancestors.length) return "conserved";
    if (matchCount > 0) return "shared";
    return "unique";
  };

  const getSegmentStatus = (layerId: string, sampleId: string, time: number, targetGenome: MusicalGenome) => {
    const ancestors = lineage.filter(g => g.genomeId !== targetGenome.genomeId);
    if (ancestors.length === 0) return "conserved";

    let matchCount = 0;
    ancestors.forEach(ancestor => {
      const ancestorLayer = ancestor.layers.find(l => l.layerId === layerId);
      if (ancestorLayer) {
        const isPlaying = ancestorLayer.events.some(e => 
          e.sampleId === sampleId && 
          time >= e.start && 
          time < (e.start + e.duration)
        );
        if (isPlaying) matchCount++;
      }
    });

    if (matchCount === ancestors.length) return "conserved";
    if (matchCount > 0) return "shared";
    return "unique";
  };

  const isRadical = intensity === "radical";
  const accent = isRadical ? "blue" : "emerald";
  const ac = getAccentClasses(accent, theme as "dark" | "light");

  const getStatusColorValue = (status: string) => {
    switch (status) {
      case "conserved": 
        if (isRadical) return theme === "dark" ? "#f59e0b66" : "#3b82f6"; // amber-500/40 or blue-500
        return theme === "dark" ? "#10b98166" : "#059669"; // emerald-500/40 or emerald-600
      case "shared": return theme === "dark" ? "#eab30866" : "#ca8a04"; // yellow-500/40 or yellow-600
      case "unique": return theme === "dark" ? "#ef444466" : "#dc2626"; // red-500/40 or red-600
      default: 
        if (isRadical) return theme === "dark" ? "#f59e0b4d" : "#3b82f6"; // amber-500/30 or blue-500
        return theme === "dark" ? "#10b9814d" : "#059669"; // emerald-500/30 or emerald-600
    }
  };

  const getAnalysisGradient = (layerId: string, event: any, targetGenome: MusicalGenome) => {
    if (!analysisMode || lineage.length === 0) return null;
    
    const segmentDuration = 0.1;
    const segments = Math.max(1, Math.ceil(event.duration / segmentDuration));
    const stops: string[] = [];
    
    for (let i = 0; i < segments; i++) {
      const t = event.start + i * segmentDuration + segmentDuration / 2;
      const status = getSegmentStatus(layerId, event.sampleId, t, targetGenome);
      const color = getStatusColorValue(status);
      const startPercent = (i / segments) * 100;
      const endPercent = ((i + 1) / segments) * 100;
      stops.push(`${color} ${startPercent}%`, `${color} ${endPercent}%`);
    }
    
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const getEventColor = (status: string | null, isGhost: boolean = false) => {
    if (!status) {
      if (isGhost) return ""; // Use default ghost color logic
      return theme === "dark" ? `${ac.bg500_30} ${ac.border500_50}` : `bg-zinc-200 border-zinc-400 text-zinc-900`;
    }
    
    switch (status) {
      case "conserved":
        if (isRadical) return theme === "dark" ? "bg-amber-500/40 border-amber-500" : "bg-blue-500 border-blue-700";
        return theme === "dark" ? "bg-emerald-500/40 border-emerald-500" : "bg-emerald-500 border-emerald-700";
      case "shared":
        return theme === "dark" ? "bg-yellow-500/40 border-yellow-500" : "bg-yellow-500 border-yellow-700";
      case "unique":
        return theme === "dark" ? "bg-red-500/40 border-red-500" : "bg-red-500 border-red-700";
      default:
        return theme === "dark" ? `${ac.bg500_30} ${ac.border500_50}` : `bg-zinc-200 border-zinc-400 text-zinc-900`;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (containerWidth > 0) {
      handleFitToScreen();
    }
  }, [containerWidth]);

  const handleFitToScreen = () => {
    // Use the actual measured width of the container
    const targetWidth = containerWidth || containerRef.current?.getBoundingClientRect().width || window.innerWidth;
    // Subtract padding (p-2 on mobile, p-4 on md)
    const padding = window.innerWidth < 768 ? 16 : 32;
    const availableWidth = targetWidth - padding - 8; // Extra buffer
    const newZoom = availableWidth / (duration * basePixelsPerSecond);
    handleZoomChange(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent, layerId: string, eventId: string, currentStart: number) => {
    if (!onEventMove) return;
    
    const startX = e.clientX;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / pixelsPerSecond;
      const newStart = Math.max(0, Math.min(duration - 0.1, currentStart + deltaSeconds));
      onEventMove(layerId, eventId, newStart);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full rounded-xl border p-2 md:p-4 overflow-x-auto transition-colors duration-300 relative ${
      theme === "dark" 
        ? "bg-zinc-900/50 border-white/10" 
        : "bg-white border-black"
    }`}>
      {/* Timeline Controls - Top Left */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-40">
        <div className={`flex items-center gap-1 p-1 rounded-lg border shadow-lg backdrop-blur-md ${
          theme === "dark" ? "bg-black/60 border-white/10" : "bg-white/80 border-black/10"
        }`}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleZoomChange(zoom - 0.2);
            }}
            className={`p-1 ${ac.hoverText500} transition-colors cursor-pointer`}
            title={labels?.zoomOut || "Zoom Out"}
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-mono w-10 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleZoomChange(zoom + 0.2);
            }}
            className={`p-1 ${ac.hoverText500} transition-colors cursor-pointer`}
            title={labels?.zoomIn || "Zoom In"}
          >
            <ZoomIn size={14} />
          </button>
          <div className="w-px h-3 bg-zinc-700 mx-1" />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleFitToScreen();
            }}
            className={`p-1 ${ac.hoverText500} transition-colors flex items-center gap-1 cursor-pointer`}
            title={labels?.fit || "Fit to Screen"}
          >
            <Maximize2 size={14} />
            <span className="text-[8px] font-bold uppercase hidden sm:inline">Fit</span>
          </button>
        </div>
      </div>

      <div className="relative pt-8" style={{ width: `${duration * pixelsPerSecond}px`, minHeight: "120px" }}>
        {/* Playhead */}
        <motion.div 
          className={`absolute top-0 bottom-0 w-0.5 ${ac.bg500} z-30`}
          animate={{ left: `${currentTime * pixelsPerSecond}px` }}
          transition={{ type: "tween", ease: "linear", duration: 0.1 }}
        />

        {/* Layers */}
        <div className="space-y-1 md:space-y-2">
          {(genome.layers || []).map((layer, idx) => (
            <div key={layer.layerId} className={`relative rounded-lg border group transition-all duration-300 ${
              overlayGenomes.length > 0 ? "h-16 md:h-20" : "h-8 md:h-10"
            } ${
              theme === "dark"
                ? "bg-white/5 border-white/5"
                : "bg-zinc-100/50 border-black/10"
            }`}>
              <div className={`absolute -left-1 md:-left-2 top-1/2 -translate-y-1/2 -translate-x-full pr-2 md:pr-4 text-[8px] md:text-[10px] uppercase tracking-widest font-mono font-bold text-right min-w-[60px] z-20 ${
                theme === "dark" ? "text-zinc-300" : "text-zinc-900"
              }`}>
                {layer.role || layer.layerId}
              </div>

              {/* Overlay Genomes (ghost events) */}
              {overlayGenomes.map((ghost, gIdx) => {
                const ghostLayer = ghost.layers.find(l => l.layerId === layer.layerId);
                if (!ghostLayer) return null;
                
                const totalTracks = overlayGenomes.length + 1;
                const trackHeightPercent = 100 / totalTracks;
                const topOffset = gIdx * trackHeightPercent;

                return (
                  <React.Fragment key={ghost.genomeId}>
                    {(ghostLayer.events || []).map(event => {
                      const gradient = getAnalysisGradient(layer.layerId, event, ghost);
                      
                      return (
                        <div
                          key={`${ghost.genomeId}-${event.eventId}`}
                          className="absolute border rounded-sm opacity-40 pointer-events-none z-0"
                          style={{
                            top: `${topOffset}%`,
                            height: `${trackHeightPercent * 0.8}%`,
                            left: `${event.start * pixelsPerSecond}px`,
                            width: `${event.duration * pixelsPerSecond}px`,
                            background: gradient || `hsl(${(gIdx * 60) % 360}, 70%, 50%)`,
                            borderColor: gradient ? "transparent" : `hsl(${(gIdx * 60) % 360}, 70%, 40%)`
                          }}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Main Genome Events */}
              {(layer.events || []).map((event) => {
                const totalTracks = overlayGenomes.length + 1;
                const trackHeightPercent = 100 / totalTracks;
                const topOffset = overlayGenomes.length * trackHeightPercent;
                const gradient = getAnalysisGradient(layer.layerId, event, genome);

                return (
                  <motion.div
                    key={event.eventId}
                    onMouseDown={(e) => handleMouseDown(e, layer.layerId, event.eventId, event.start)}
                    className={`absolute border rounded-sm flex items-center justify-center overflow-hidden transition-colors duration-300 z-10 cursor-grab active:cursor-grabbing ${
                      !gradient ? getEventColor(null) : ""
                    }`}
                    style={{
                      top: overlayGenomes.length > 0 ? `${topOffset}%` : "4px",
                      bottom: overlayGenomes.length > 0 ? "0" : "4px",
                      height: overlayGenomes.length > 0 ? `${trackHeightPercent}%` : "auto",
                      left: `${event.start * pixelsPerSecond}px`,
                      width: `${event.duration * pixelsPerSecond}px`,
                      background: gradient || undefined,
                      borderColor: gradient ? "rgba(255,255,255,0.1)" : undefined
                    }}
                    whileHover={{ scale: 1.05, backgroundColor: theme === "dark" 
                      ? (isRadical ? "rgba(59, 130, 246, 0.5)" : "rgba(16, 185, 129, 0.5)") 
                      : (isRadical ? "rgba(59, 130, 246, 0.8)" : "rgba(16, 185, 129, 0.8)") }}
                  >
                    <span className={`text-[8px] font-mono truncate px-1 font-bold ${
                      theme === "dark" 
                        ? (isRadical ? ac.text200 : ac.text200) 
                        : (isRadical ? ac.text950 : ac.text950)
                    } ${overlayGenomes.length > 2 ? 'hidden' : ''}`}>
                      {event.sampleId}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Time Markers */}
        <div className={`mt-2 relative border-t pt-1 transition-colors duration-300 ${
          theme === "dark" ? "border-white/10" : "border-black/20"
        }`} style={{ height: '20px' }}>
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            <div key={i} className="absolute" style={{ left: `${i * pixelsPerSecond}px` }}>
              <div className={`h-1.5 w-px transition-colors duration-300 ${
                theme === "dark" ? "bg-white/20" : "bg-black/20"
              }`} />
              <span className={`absolute left-1 top-1 text-[9px] font-mono font-bold ${
                theme === "dark" ? "text-zinc-600" : "text-zinc-900"
              }`}>{i}s</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
