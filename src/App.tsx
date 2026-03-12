/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import * as Tone from "tone";
import { MusicalGenome, MutationFilters } from "./types";
import { generateInitialGenome, mutateGenome } from "./services/evolutionService";
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
  GitBranch,
  Download,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentGenome, setCurrentGenome] = useState<MusicalGenome | null>(null);
  const [evolutionParent, setEvolutionParent] = useState<MusicalGenome | null>(null);
  const [offspring, setOffspring] = useState<[MusicalGenome, MusicalGenome] | null>(null);
  const [initialOptions, setInitialOptions] = useState<MusicalGenome[] | null>(null);
  const [lineage, setLineage] = useState<MusicalGenome[]>([]);
  const [mutationRate, setMutationRate] = useState(0.3);
  const [intensity, setIntensity] = useState<"conservative" | "radical">("conservative");
  const [mutationFilters, setMutationFilters] = useState<MutationFilters>({
    drums: true,
    bass: true,
    melody: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("es");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAncestry, setShowAncestry] = useState(false);

  const t = translations[lang];

  const { play, stop, isPlaying, isLoaded, currentTime } = usePlaybackEngine();

  // Audio context resume on first interaction for mobile
  useEffect(() => {
    const resumeAudio = async () => {
      if (Tone.context.state !== "running") {
        await Tone.start();
        await Tone.context.resume();
      }
    };
    window.addEventListener("click", resumeAudio, { once: true });
    window.addEventListener("touchstart", resumeAudio, { once: true });
    return () => {
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("touchstart", resumeAudio);
    };
  }, []);

  const getAncestryPath = () => {
    if (!currentGenome) return [];
    const path: MusicalGenome[] = [];
    let currentId: string | undefined = currentGenome.genomeId;
    
    while (currentId) {
      const ancestor = lineage.find(g => g.genomeId === currentId);
      if (ancestor) {
        path.unshift(ancestor);
        currentId = ancestor.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const handleExportSession = () => {
    if (!currentGenome) return;
    const sessionData = {
      currentGenome,
      lineage,
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genetic-music-session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.currentGenome && Array.isArray(data.lineage)) {
          setLineage(data.lineage);
          setCurrentGenome(data.currentGenome);
          setInitialOptions(null);
          setOffspring(null);
        } else {
          alert(t.sessionError);
        }
      } catch (err) {
        console.error("Import failed", err);
        alert(t.sessionError);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  const handleInitialGenerate = async () => {
    setIsGenerating(true);
    try {
      const options = await generateInitialGenome(4);
      setInitialOptions(options);
      setShowInstructions(false);
    } catch (error) {
      console.error("Failed to generate initial genomes", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectInitial = (genome: MusicalGenome) => {
    setCurrentGenome(genome);
    setEvolutionParent(genome);
    setLineage([genome]);
    setInitialOptions(null);
  };

  const handleMutate = async (parent: MusicalGenome | null = evolutionParent) => {
    if (!parent) return;
    setIsGenerating(true);
    try {
      // Generate two descendants in parallel
      const [childA, childB] = await Promise.all([
        mutateGenome(parent, mutationRate, intensity, mutationFilters),
        mutateGenome(parent, mutationRate, intensity, mutationFilters)
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

  const handleLoadStarter = () => {
    const starter = { ...DEFAULT_GENOME, genomeId: `starter_${Date.now()}` };
    setCurrentGenome(starter);
    setEvolutionParent(starter);
    setLineage([starter]);
    setShowInstructions(false);
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
        className={`border-b p-4 md:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 backdrop-blur-md sticky top-0 z-50 ${
          theme === "dark" ? "border-white/10 bg-[#050505]/80" : "border-black bg-white/80"
        }`}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]" aria-hidden="true">
            <Dna className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">{t.title}</h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-mono font-bold ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-600"
            }`}>
              {isLoaded ? t.subtitle : t.loading}
            </p>
          </div>
        </div>

        <nav className="flex items-center justify-between sm:justify-end gap-2 md:gap-4 w-full sm:w-auto" aria-label="Global controls">
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label={lang === "en" ? "Cambiar a Español" : "Switch to English"}
            >
              <Languages size={18} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label={theme === "dark" ? "Switch to High Contrast Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label="View Lab Instructions"
              title="Instructions"
            >
              <HelpCircle size={18} />
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-1 hidden xs:block" />

            <button
              onClick={handleExportSession}
              disabled={!currentGenome}
              title={t.exportSession}
              className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-emerald-500 outline-none disabled:opacity-30 ${
                theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
              }`}
            >
              <Download size={18} />
            </button>

            <label className={`p-2 rounded-lg cursor-pointer transition-all focus-within:ring-4 focus-within:ring-emerald-500 outline-none ${
              theme === "dark" ? "hover:bg-white/5 text-zinc-400" : "hover:bg-black/5 text-zinc-700"
            }`}>
              <Upload size={18} />
              <input type="file" accept=".json" onChange={handleImportSession} className="sr-only" />
            </label>

            <button
              onClick={() => {
                setCurrentGenome(null);
                setLineage([]);
                setInitialOptions(null);
                setOffspring(null);
              }}
              title={t.reset}
              className={`p-2 rounded-lg transition-all focus:ring-4 focus:ring-red-500 outline-none ${
                theme === "dark" ? "hover:bg-red-500/10 text-zinc-500 hover:text-red-500" : "hover:bg-red-500/10 text-zinc-500 hover:text-red-500"
              }`}
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentGenome && (
              <button
                onClick={() => isPlaying ? stop() : play(currentGenome)}
                disabled={!isLoaded}
                aria-label={isPlaying ? "Stop music" : "Play music"}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all focus:ring-4 focus:ring-emerald-500 outline-none ${
                  !isLoaded ? "opacity-50 cursor-not-allowed bg-zinc-600" :
                  isPlaying ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {!isLoaded ? <RefreshCw className="animate-spin" size={18} /> :
                 isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Controls & Lineage */}
        <aside className="lg:col-span-3 space-y-4 md:space-y-8" aria-label="Genome management">
          {currentGenome && (
            <>
              <section 
                className={`rounded-xl md:rounded-2xl border p-3 md:p-5 space-y-4 md:space-y-6 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}
                aria-labelledby="mutation-controls-title"
              >
                <div className="flex items-center gap-2 text-emerald-600">
                  <Settings2 size={14} className="md:w-4 md:h-4" aria-hidden="true" />
                  <h2 id="mutation-controls-title" className="text-[10px] md:text-xs font-mono uppercase tracking-widest font-bold">{t.mutationParams}</h2>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label htmlFor="mutation-rate" className="flex justify-between text-[9px] md:text-[10px] text-zinc-500 mb-1 md:mb-2 font-mono font-bold">
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
                      className="w-full accent-emerald-600 h-1.5 md:h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <fieldset className={`flex p-1 rounded-lg border ${
                    theme === "dark" ? "bg-black/40 border-white/10" : "bg-zinc-100 border-black"
                  }`}>
                    <legend className="sr-only">Mutation Intensity</legend>
                    <button
                      onClick={() => setIntensity("conservative")}
                      aria-pressed={intensity === "conservative"}
                      title={t.conservativeDesc}
                      className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-mono rounded-md transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                        intensity === "conservative" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"
                      }`}
                    >
                      {t.conservative.toUpperCase()}
                    </button>
                    <button
                      onClick={() => setIntensity("radical")}
                      aria-pressed={intensity === "radical"}
                      title={t.radicalDesc}
                      className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-mono rounded-md transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                        intensity === "radical" ? "bg-emerald-600 text-white font-bold" : "text-zinc-500"
                      }`}
                    >
                      {t.radical.toUpperCase()}
                    </button>
                  </fieldset>

                  <div className="space-y-2">
                    <p className="text-[9px] md:text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.mutationFocus}</p>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {(['drums', 'bass', 'melody'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => setMutationFilters(prev => ({ ...prev, [role]: !prev[role] }))}
                          className={`py-1.5 md:py-2 text-[7px] md:text-[8px] font-mono rounded-lg border transition-all ${
                            mutationFilters[role] 
                              ? "bg-emerald-600/20 border-emerald-600 text-emerald-600 font-bold" 
                              : "bg-transparent border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {t[`filter${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof t]}
                        </button>
                      ))}
                    </div>
                  </div>

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
                <LineageTree lineage={lineage} currentGenomeId={currentGenome.genomeId} onSelect={selectFromLineage} title={t.lineageTitle} theme={theme} />
              </section>
            </>
          )}
        </aside>

        {/* Center Column: Visualization */}
        <div className="lg:col-span-9 space-y-8">
          {initialOptions ? (
            <section className="space-y-8" aria-labelledby="initial-selection-title">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-4">
                  <h2 id="initial-selection-title" className="text-2xl font-bold text-emerald-600">{t.chooseRootAncestor}</h2>
                  <button
                    onClick={() => setInitialOptions(null)}
                    className={`p-2 rounded-full transition-all hover:bg-red-500/10 text-zinc-500 hover:text-red-500`}
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-zinc-500 text-sm max-w-2xl mx-auto">{t.selectAncestorDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {initialOptions.map((genome, idx) => (
                  <motion.div
                    key={genome.genomeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`rounded-2xl md:rounded-3xl border-2 p-4 md:p-6 space-y-4 transition-all ${
                      theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider">{t.option} {idx + 1}</h3>
                      <button
                        onClick={() => play(genome)}
                        className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-all"
                      >
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                    
                    <p className={`text-xs font-medium italic ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      {genome.summary}
                    </p>

                    <div className={`h-48 overflow-hidden rounded-xl border transition-colors duration-300 ${
                      theme === "dark" ? "bg-black/20 border-white/5" : "bg-zinc-100 border-zinc-200"
                    }`}>
                      <GenomeTimeline genome={genome} currentTime={-1} theme={theme} />
                    </div>

                    <button
                      onClick={() => handleSelectInitial(genome)}
                      className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Activity size={18} />
                      {t.selectThisAncestor}
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          ) : lineage.length === 0 ? (
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
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                  onClick={handleInitialGenerate}
                  disabled={isGenerating}
                  aria-busy={isGenerating}
                  className="w-full py-4 bg-emerald-600 text-white text-lg font-bold rounded-full hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-xl focus:ring-4 focus:ring-emerald-400 outline-none"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Activity size={24} />}
                  <span>{t.initialize}</span>
                </button>
                <button
                  onClick={handleLoadStarter}
                  className={`w-full py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-emerald-500 outline-none ${
                    theme === "dark" ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-zinc-100 text-black border border-black hover:bg-zinc-200"
                  }`}
                >
                  <RefreshCw size={18} />
                  {t.loadStarter}
                </button>
              </div>
            </section>
          ) : offspring ? (
            <section className="space-y-8" aria-labelledby="selection-title">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-4">
                  <h2 id="selection-title" className="text-2xl font-bold text-emerald-600">{t.selectionRoom}</h2>
                  <button
                    onClick={() => setOffspring(null)}
                    className={`p-2 rounded-full transition-all hover:bg-red-500/10 text-zinc-500 hover:text-red-500`}
                    title={t.leaveSelectionRoom}
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-zinc-500 text-sm max-w-2xl mx-auto">{t.selectionDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                {offspring.map((child, idx) => (
                  <motion.div
                    key={child.genomeId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl md:rounded-3xl border-2 p-4 md:p-6 space-y-4 md:space-y-6 transition-all ${
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

                    <div className={`h-32 overflow-hidden rounded-xl border transition-colors duration-300 ${
                      theme === "dark" ? "bg-black/20 border-white/5" : "bg-zinc-100 border-zinc-200"
                    }`}>
                      <GenomeTimeline genome={child} currentTime={-1} theme={theme} />
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
              <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" aria-label="Genome statistics">
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.tempo}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.tempo} BPM</p>
                  </div>
                </div>
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <History size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.generation}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.generation}</p>
                  </div>
                </div>
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 col-span-2 md:col-span-1 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600" aria-hidden="true">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 font-mono uppercase font-bold">{t.duration}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.durationTarget.toFixed(2)}s</p>
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
                      onClick={() => setShowAncestry(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${
                        theme === "dark" ? "bg-white/5 border-white/10 text-zinc-500 hover:text-emerald-400" : "bg-zinc-100 border-black text-zinc-700 hover:text-emerald-600"
                      }`}
                    >
                      {t.viewPath}
                    </button>
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
                  <GenomeTimeline genome={currentGenome} currentTime={currentTime} theme={theme} />
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
              className={`relative max-w-2xl w-full rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${
                theme === "dark" ? "bg-zinc-900 border border-white/10" : "bg-white border-2 border-black"
              }`}
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center shrink-0">
                <h3 id="modal-instructions-title" className="text-2xl font-bold flex items-center gap-3">
                  <HelpCircle className="text-emerald-600" aria-hidden="true" />
                  {t.instructionsTitle}
                </h3>
                <button 
                  onClick={() => setShowInstructions(false)}
                  aria-label={t.closeInstructions}
                  className={`p-2 rounded-full transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {t.instructions.map((step, i) => {
                  const [title, ...rest] = step.split(':');
                  return (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 border border-emerald-500/20">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        {rest.length > 0 ? (
                          <>
                            <h4 className={`text-sm font-bold uppercase tracking-wider ${theme === "dark" ? "text-emerald-500" : "text-emerald-600"}`}>
                              {title}
                            </h4>
                            <p className={`text-sm font-medium leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                              {rest.join(':').trim()}
                            </p>
                          </>
                        ) : (
                          <p className={`text-sm font-bold leading-relaxed ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                            {step}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {showAncestry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="modal-ancestry-title">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowAncestry(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-2xl w-full rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${
                theme === "dark" ? "bg-zinc-900 border border-white/10" : "bg-white border-2 border-black"
              }`}
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <h3 id="modal-ancestry-title" className="text-2xl font-bold flex items-center gap-3">
                  <GitBranch className="text-emerald-600" aria-hidden="true" />
                  {t.lineageTitle}
                </h3>
                <button 
                  onClick={() => setShowAncestry(false)}
                  aria-label="Close ancestry path"
                  className={`p-2 rounded-full transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {getAncestryPath().map((genome, i) => (
                  <div key={genome.genomeId} className="relative">
                    {i < getAncestryPath().length - 1 && (
                      <div className="absolute left-4 top-10 bottom-[-24px] w-0.5 bg-emerald-600/30" />
                    )}
                    <div className="flex gap-6 items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                        genome.genomeId === currentGenome?.genomeId 
                          ? "bg-emerald-600 text-white ring-4 ring-emerald-600/20" 
                          : "bg-zinc-800 text-zinc-400"
                      }`}>
                        {genome.generation}
                      </div>
                      <div 
                        onClick={() => {
                          selectFromLineage(genome);
                          setShowAncestry(false);
                        }}
                        className={`flex-1 p-4 rounded-2xl border cursor-pointer transition-all group ${
                          genome.genomeId === currentGenome?.genomeId
                            ? "bg-emerald-600/10 border-emerald-600"
                            : theme === "dark" 
                              ? "bg-black/40 border-white/10 hover:border-emerald-600/50" 
                              : "bg-zinc-50 border-black hover:border-emerald-600"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">GEN {genome.generation}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{genome.genomeId}</span>
                        </div>
                        <p className={`text-sm font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-900"}`}>
                          {genome.summary}
                        </p>
                        <div className="mt-3 flex gap-4 text-[10px] text-zinc-500 font-mono">
                          <span>{genome.tempo} BPM</span>
                          <span>{genome.layers.length} {t.layers}</span>
                        </div>
                      </div>
                    </div>
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
