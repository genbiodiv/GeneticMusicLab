import React from "react";
import { MusicalGenome } from "../types";
import { motion } from "motion/react";
import { GitBranch, ChevronRight } from "lucide-react";

interface LineageTreeProps {
  lineage: MusicalGenome[];
  currentGenomeId: string;
  onSelect: (genome: MusicalGenome) => void;
  title: string;
  theme?: "dark" | "light";
}

export const LineageTree: React.FC<LineageTreeProps> = ({ lineage, currentGenomeId, onSelect, title, theme = "dark" }) => {
  return (
    <nav className="space-y-2" aria-label={title}>
      <div className={`flex items-center gap-2 mb-4 transition-colors duration-300 ${
        theme === "dark" ? "text-zinc-500" : "text-zinc-900"
      }`} aria-hidden="true">
        <GitBranch size={16} />
        <h3 className="text-xs font-mono uppercase tracking-widest font-bold">{title}</h3>
      </div>
      <div className="flex flex-col gap-2">
        {(lineage || []).map((g, idx) => {
          const isActive = g.genomeId === currentGenomeId;
          return (
            <div key={g.genomeId} className="flex items-center gap-2">
              {idx > 0 && <div className={`w-4 h-px transition-colors duration-300 ${
                theme === "dark" ? "bg-zinc-800" : "bg-zinc-300"
              }`} aria-hidden="true" />}
              <button
                onClick={() => onSelect(g)}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Generation ${g.generation}: ${g.summary}`}
                className={`flex-1 text-left p-3 rounded-lg border transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                  isActive
                    ? "bg-emerald-600/10 border-emerald-600 text-emerald-600 font-bold"
                    : theme === "dark"
                      ? "bg-white/5 border-zinc-800 text-zinc-500 hover:bg-white/10"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono">GEN {g.generation}</span>
                  <span className="text-[10px] opacity-50">{g.genomeId.slice(-4)}</span>
                </div>
                <p className="text-xs mt-1 line-clamp-1 italic opacity-80">
                  {g.summary}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
};
