/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { MusicalGenome } from "./types";
import { generateInitialGenome, mutateGenome } from "./services/geminiService";
import { usePlaybackEngine } from "./hooks/usePlaybackEngine";
import { GenomeTimeline } from "./components/GenomeTimeline";
import { LineageTree } from "./components/LineageTree";
import { translations } from "./translations";
import { DEFAULT_GENOME } from "./constants";
import { 
  Play, 
  Square, 
  Dna, 
  History, 
  Settings2, 
  Activity, 
  Info,
  RefreshCw,
  ArrowRightLeft,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  BookOpen,
  HelpCircle,
  X,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentGenome, setCurrentGenome] = useState<MusicalGenome | null>(DEFAULT_GENOME);
  const [evolutionParent, setEvolutionParent] = useState<MusicalGenome | null>(DEFAULT_GENOME);
  const [offspring, setOffspring] = useState<[MusicalGenome, MusicalGenome] | null>(null);
  const [lineage, setLineage] = useState<MusicalGenome[]>([DEFAULT_GENOME]);
  const [mutationRate, setMutationRate] = useState(0.3);
  const [intensity, setIntensity] = useState<"conservative" | "radical">("conservative");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);

  const t = translations[lang];

  const { play, stop, isPlaying, isLoaded, currentTime } = usePlaybackEngine();

  const handleInitialGenerate = async () => {
    setIsGenerating(true);
    try {
      const genome = await generateInitialGenome();
      setCurrentGenome(genome);
      setEvolutionParent(genome);
      setLineage([genome]);
      setShowInstructions(false);
    } catch (error) {
      console.error("Failed to generate initial genome", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMutate = async (parent: MusicalGenome | null = evolutionParent) => {
    if (!parent) return;
    setIsGenerating(true);
    try {
      // Generate two descendants in parallel
      const [childA, childB] = await Promise.all([
        mutateGenome(parent, mutationRate, intensity),
        mutateGenome(parent, mutationRate, intensity)
      ]);
      setOffspring([childA, childB]);
    } catch (error) {
      console.error("Failed to mutate genome", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = (livingIndex: number) => {
    if (!offspring) return;
    const living = offspring[livingIndex];

    // The one who lives is saved to lineage and becomes the next parent
    setLineage([...lineage, living]);
    setCurrentGenome(living);
    setEvolutionParent(living);
    setOffspring(null);

    // Streamline: automatically trigger next generation from the survivor
    handleMutate(living);
  };

  const selectFromLineage = (genome: MusicalGenome) => {
    setCurrentGenome(genome);
    setEvolutionParent(genome);
    setOffspring(null);
  };

  const handleDownload = () => {
    if (lineage.length === 0) return;
    
    const exportData = {
      experimentId: `music-lab-${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalGenerations: lineage.length,
      lineage: lineage.map(g => ({
        generation: g.generation,
        genomeId: g.genomeId,
        parentId: g.parentId,
        summary: g.summary,
        tempo: g.tempo,
        timeSignature: g.timeSignature,
        mutationHistory: g.mutationHistory,
        layers: g.layers
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `musical-lineage-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-emerald-500/30 ${
      theme === "dark" ? "bg-[#050505] text-zinc-100" : "bg-white text-black"
    }`}>
      <div className="sr-only" aria-live="polite">
        {isGenerating ? t.loading : currentGenome ? "Genome ready" : "Welcome to the lab"}
        {isPlaying ? "Music playing" : "Music stopped"}
      </div>

      {/* Header */}
      <header 
        role="banner"
        className={`border-b p-6 flex justify-between items-center backdrop-blur-md sticky top-0 z-50 ${
          theme === "dark" ? "border-white/10 bg-[#050505]/80" : "border-black bg-white/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]" aria-hidden="true">
            <Dna className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-mono font-bold ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-600"
            }`}>
              {isLoaded ? t.subtitle : t.loading}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4" aria-label="Global controls">
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
              theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
            }`}
            aria-label={lang === "en" ? "Cambiar a Español" : "Switch to English"}
          >
            <Languages size={20} />
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
              theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
            }`}
            aria-label={theme === "dark" ? "Switch to High Contrast Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {currentGenome && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                  theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
                }`}
                aria-label={t.download}
                title={t.download}
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => {
                  setCurrentGenome(null);
                  setLineage([]);
                }}
                className={`px-4 py-2 text-[10px] font-mono transition-all uppercase tracking-widest font-bold focus:ring-2 focus:ring-red-500 outline-none ${
                  theme === "dark" ? "text-zinc-400 hover:text-red-400" : "text-zinc-700 hover:text-red-600"
                }`}
              >
                {t.reset}
              </button>
            </div>
          )}
          {!currentGenome ? (
            <button
              onClick={handleInitialGenerate}
              disabled={isGenerating}
              aria-busy={isGenerating}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition-all flex items-center gap-2 disabled:opacity-50 focus:ring-4 focus:ring-emerald-400 outline-none"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Activity size={18} />}
              {t.initialize}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => isPlaying ? stop() : play(currentGenome)}
                aria-label={isPlaying ? "Stop music" : "Play music"}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                  isPlaying ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
            </div>
          )}
        </nav>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Lineage */}
        <aside className="lg:col-span-3 space-y-8" aria-label="Genome management">
          {currentGenome && (
            <>
              <section 
                className={`rounded-2xl border p-5 space-y-6 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}
                aria-labelledby="mutation-controls-title"
              >
                <div className="flex items-center gap-2 text-emerald-600">
                  <Settings2 size={16} aria-hidden="true" />
                  <h2 id="mutation-controls-title" className="text-xs font-mono uppercase tracking-widest font-bold">{t.mutationParams}</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="mutation-rate" className="flex justify-between text-[10px] text-zinc-500 mb-2 font-mono font-bold">
                      <span>{t.mutationRate}</span>
                      <span>{(mutationRate * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      id="mutation-rate"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={mutationRate}
                      onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <fieldset className={`flex p-1 rounded-lg border ${
                    theme === "dark" ? "bg-black/40 border-white/10" : "bg-zinc-100 border-black"
                  }`}>
                    <legend className="sr-only">Mutation Intensity</legend>
                    <button
                      onClick={() => setIntensity("conservative")}
                      aria-pressed={intensity === "conservative"}
                      className={`flex-1 py-2 text-[10px] font-mono rounded-md transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                        intensity === "conservative" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"
                      }`}
                    >
                      {t.conservative.toUpperCase()}
                    </button>
                    <button
                      onClick={() => setIntensity("radical")}
                      aria-pressed={intensity === "radical"}
                      className={`flex-1 py-2 text-[10px] font-mono rounded-md transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                        intensity === "radical" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"
                      }`}
                    >
                      {t.radical.toUpperCase()}
                    </button>
                  </fieldset>

                  <button
                    onClick={() => handleMutate()}
                    disabled={isGenerating}
                    aria-busy={isGenerating}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:ring-4 focus:ring-emerald-500 outline-none ${
                      theme === "dark" ? "bg-white text-black hover:bg-emerald-500" : "bg-black text-white hover:bg-emerald-600"
                    }`}
                  >
                    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Dna size={18} />}
                    {t.evolve}
                  </button>
                </div>
              </section>

              <section 
                className={`rounded-2xl border p-5 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}
                aria-labelledby="lineage-title"
              >
                <LineageTree lineage={lineage} currentGenomeId={currentGenome.genomeId} onSelect={selectFromLineage} title={t.lineageTitle} />
              </section>
            </>
          )}
        </aside>

        {/* Center Column: Visualization */}
        <div className="lg:col-span-9 space-y-8">
          {!currentGenome ? (
            <section className="h-[70vh] flex flex-col items-center justify-center text-center space-y-8" aria-labelledby="welcome-title">
              <div className="relative" aria-hidden="true">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                <Dna size={100} className="text-emerald-600 relative animate-pulse" />
              </div>
              <div className="max-w-xl space-y-4">
                <h2 id="welcome-title" className="text-3xl font-bold tracking-tight">{t.welcome}</h2>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                  {t.welcomeDesc}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowInstructions(true)}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                    theme === "dark" ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-white text-black border-2 border-black hover:bg-zinc-50"
                  }`}
                >
                  <HelpCircle size={18} />
                  {t.instructionsTitle}
                </button>
                <button
                  onClick={() => setShowChallenges(true)}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                    theme === "dark" ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-2 border-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  <BookOpen size={18} />
                  {t.challengesTitle}
                </button>
              </div>

              <button
                onClick={handleInitialGenerate}
                disabled={isGenerating}
                aria-busy={isGenerating}
                className="px-10 py-4 bg-emerald-600 text-white text-lg font-bold rounded-full hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-xl focus:ring-4 focus:ring-emerald-400 outline-none"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Activity size={24} />}
                <span>{t.initialize}</span>
              </button>
            </section>
          ) : offspring ? (
            <section className="space-y-8" aria-labelledby="selection-title">
              <div className="text-center space-y-2">
                <h2 id="selection-title" className="text-2xl font-bold text-emerald-600">{t.selectionRoom}</h2>
                <p className="text-zinc-500 text-sm max-w-2xl mx-auto">{t.selectionDesc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {offspring.map((child, idx) => (
                  <motion.div
                    key={child.genomeId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-3xl border-2 p-6 space-y-6 transition-all ${
                      theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-emerald-600/10 text-emerald-600 rounded-full text-[10px] font-mono font-bold uppercase">
                        Candidate {idx === 0 ? 'A' : 'B'}
                      </span>
                      <button
                        onClick={() => play(child)}
                        className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all"
                      >
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>

                    <div className="h-32 overflow-hidden rounded-xl bg-black/20 border border-white/5">
                      <GenomeTimeline genome={child} currentTime={-1} />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSelect(idx)}
                        className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Sun size={18} />
                        {t.live}
                      </button>
                      <button
                        onClick={() => handleSelect(idx === 0 ? 1 : 0)}
                        className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                          theme === "dark" ? "bg-zinc-800 text-white hover:bg-red-600" : "bg-zinc-100 text-black hover:bg-red-600 hover:text-white border border-black"
                        }`}
                      >
                        <Moon size={18} />
                        {t.die}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : (
            <>
              {/* Genome Overview */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Genome statistics">
                <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.tempo}</p>
                    <p className="text-lg font-bold">{currentGenome.tempo} BPM</p>
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <History size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.generation}</p>
                    <p className="text-lg font-bold">{currentGenome.generation}</p>
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.duration}</p>
                    <p className="text-lg font-bold">{currentGenome.durationTarget.toFixed(2)}s</p>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="space-y-4" aria-labelledby="phenotype-title">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 id="phenotype-title" className="text-sm font-bold">{t.phenotype}</h2>
                    <p className="text-xs text-zinc-500 font-medium">{t.structuralMap}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      aria-expanded={showHistory}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${
                        showHistory ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/5 border-white/10 text-zinc-500"
                      }`}
                    >
                      {t.mutationLog.toUpperCase()}
                    </button>
                  </div>
                </div>
                
                <div role="img" aria-label="Visual timeline of musical events">
                  <GenomeTimeline genome={currentGenome} currentTime={currentTime} />
                </div>
              </section>

              {/* Mutation Log / Info */}
              <AnimatePresence>
                {showHistory && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`rounded-2xl border p-6 space-y-4 ${
                      theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                    }`}
                    aria-labelledby="drift-log-title"
                  >
                    <div className="flex items-center gap-2 text-emerald-600">
                      <History size={16} aria-hidden="true" />
                      <h3 id="drift-log-title" className="text-xs font-mono uppercase tracking-widest font-bold">{t.geneticDrift}</h3>
                    </div>
                    <div className="space-y-3">
                      {(currentGenome.mutationHistory || []).map((mut, i) => (
                        <div key={i} className={`flex gap-4 items-start p-3 rounded-xl border ${
                          theme === "dark" ? "bg-black/20 border-white/10" : "bg-zinc-50 border-black"
                        }`}>
                          <div className="mt-1 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[8px] font-mono font-bold border border-emerald-700">
                            {mut.type}
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${theme === "dark" ? "text-zinc-300" : "text-zinc-900"}`}>{mut.description}</p>
                            <p className="text-[10px] text-zinc-600 mt-1 font-mono uppercase font-bold">Target: {mut.target}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="modal-instructions-title">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-lg w-full rounded-3xl p-8 shadow-2xl ${
                theme === "dark" ? "bg-zinc-900 border border-white/10" : "bg-white border-2 border-black"
              }`}
            >
              <button 
                onClick={() => setShowInstructions(false)}
                aria-label="Close instructions"
                className={`absolute top-6 right-6 p-2 rounded-full transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
              >
                <X size={20} />
              </button>
              <h3 id="modal-instructions-title" className="text-2xl font-bold mb-6 flex items-center gap-3">
                <HelpCircle className="text-emerald-600" aria-hidden="true" />
                {t.instructionsTitle}
              </h3>
              <div className="space-y-4">
                {t.instructions.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-zinc-600 font-bold leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {showChallenges && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="modal-challenges-title">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowChallenges(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-2xl w-full rounded-3xl p-8 shadow-2xl ${
                theme === "dark" ? "bg-zinc-900 border border-white/10" : "bg-white border-2 border-black"
              }`}
            >
              <button 
                onClick={() => setShowChallenges(false)}
                aria-label="Close challenges"
                className={`absolute top-6 right-6 p-2 rounded-full transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                  theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                }`}
              >
                <X size={20} />
              </button>
              <h3 id="modal-challenges-title" className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BookOpen className="text-emerald-600" aria-hidden="true" />
                {t.challengesTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {t.challenges.map((challenge) => (
                  <div key={challenge.id} className={`p-5 rounded-2xl border ${
                    theme === "dark" ? "bg-black/40 border-white/10" : "bg-zinc-50 border-black"
                  }`}>
                    <h4 className="font-bold text-emerald-600 mb-2">{challenge.title}</h4>
                    <p className="text-xs text-zinc-700 font-bold leading-relaxed">{challenge.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 p-8 text-center" role="contentinfo">
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em] font-bold">
          &copy; 2026 {t.title} &bull; Experimental Bio-Acoustic Research
        </p>
      </footer>
    </div>
  );
}
