/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import * as Tone from "tone";
import { MusicalGenome, MutationFilters } from "./types";
import { generateInitialGenome, mutateGenome, recombineGenomes } from "./services/evolutionService";
import { usePlaybackEngine } from "./hooks/usePlaybackEngine";
import { GenomeTimeline } from "./components/GenomeTimeline";
import { LineageTree } from "./components/LineageTree";
import { LabLogo } from "./components/LabLogo";
import { translations } from "./translations";
import { getAccentClasses, AccentColor } from "./utils/theme";
import { DEFAULT_GENOME, SAMPLE_LIBRARY } from "./constants";
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
  ArrowLeft,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  BookOpen,
  HelpCircle,
  X,
  GitBranch,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Layers as LayersIcon,
  ShieldCheck,
  MousePointer2,
  Music,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentGenome, setCurrentGenome] = useState<MusicalGenome | null>(null);
  const [evolutionParent, setEvolutionParent] = useState<MusicalGenome | null>(null);
  const [offspring, setOffspring] = useState<MusicalGenome[] | null>(null);
  const [initialOptions, setInitialOptions] = useState<MusicalGenome[] | null>(null);
  const [lineage, setLineage] = useState<MusicalGenome[]>([]);
  const [mutationRate, setMutationRate] = useState(0.3);
  const [numDescendants, setNumDescendants] = useState(3);
  const [intensity, setIntensity] = useState<"conservative" | "radical">("conservative");
  const [mutationFilters, setMutationFilters] = useState<MutationFilters>({
    drums: true,
    bass: true,
    melody: true
  });
  const [pitchGate, setPitchGate] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [lang, setLang] = useState<"en" | "es">("es");
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isRadical = intensity === "radical";
  const accent: AccentColor = isRadical ? "blue" : "emerald";
  const ac = getAccentClasses(accent, theme);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showAncestry, setShowAncestry] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);
  const [isAudioSuspended, setIsAudioSuspended] = useState(false);
  const [offspringStatus, setOffspringStatus] = useState<("live" | "die")[]>([]);
  const [shouldRecombine, setShouldRecombine] = useState(false);

  const t = translations[lang];

  const { play, pause, stop, resume, unlock, status, isPlaying, isLoaded, currentTime } = usePlaybackEngine();

  // Audio context resume on first interaction for mobile
  useEffect(() => {
    const resumeAudioContext = async () => {
      await unlock();
    };
    window.addEventListener("click", resumeAudioContext, { once: true });
    window.addEventListener("touchstart", resumeAudioContext, { once: true });
    window.addEventListener("mousedown", resumeAudioContext, { once: true });
    window.addEventListener("pointerdown", resumeAudioContext, { once: true });
    return () => {
      window.removeEventListener("click", resumeAudioContext);
      window.removeEventListener("touchstart", resumeAudioContext);
      window.removeEventListener("mousedown", resumeAudioContext);
      window.removeEventListener("pointerdown", resumeAudioContext);
    };
  }, [unlock]);

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

  useEffect(() => {
    const checkAudio = () => {
      if (Tone.context.state === "suspended") {
        setIsAudioSuspended(true);
      } else {
        setIsAudioSuspended(false);
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAudio();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(checkAudio, 1000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const resumeAudio = async () => {
    const success = await unlock();
    if (success) {
      setIsAudioSuspended(false);
    }
  };

  const handleInitialGenerate = async () => {
    await resumeAudio();
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
      // Generate descendants based on user choice
      const mutationPromises = Array.from({ length: numDescendants }).map(() => 
        mutateGenome(parent, mutationRate, intensity, mutationFilters, { pitchGate })
      );
      const children = await Promise.all(mutationPromises);
      setOffspring(children);
      setOffspringStatus(new Array(children.length).fill("live"));
    } catch (error) {
      console.error("Failed to mutate genome", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEventMove = (layerId: string, eventId: string, newStart: number) => {
    if (!currentGenome) return;
    const newGenome = { ...currentGenome };
    newGenome.layers = newGenome.layers.map(layer => {
      if (layer.layerId === layerId) {
        return {
          ...layer,
          events: layer.events.map(event => 
            event.eventId === eventId ? { ...event, start: newStart } : event
          )
        };
      }
      return layer;
    });
    setCurrentGenome(newGenome);
  };

  const handleInstrumentChange = (layerId: string, sampleId: string) => {
    if (!currentGenome) return;
    const newGenome = { ...currentGenome };
    newGenome.layers = newGenome.layers.map(layer => {
      if (layer.layerId === layerId) {
        return {
          ...layer,
          events: layer.events.map(event => ({ ...event, sampleId }))
        };
      }
      return layer;
    });
    setCurrentGenome(newGenome);
  };

  const toggleComparison = (id: string) => {
    setSelectedForComparison(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-5)
    );
  };

  const toggleOffspringStatus = (index: number) => {
    setOffspringStatus(prev => {
      const next = [...prev];
      next[index] = next[index] === "live" ? "die" : "live";
      return next;
    });
  };

  const handleProceedToNextGen = async () => {
    if (!offspring) return;
    
    const survivors = offspring.filter((_, i) => offspringStatus[i] === "live");
    
    if (survivors.length === 0) {
      // If none survive, maybe just go back or reset? 
      // Let's just reset offspring and stay on current genome
      setOffspring(null);
      return;
    }

    setIsGenerating(true);
    try {
      let parent: MusicalGenome;
      
      if (shouldRecombine && survivors.length >= 2) {
        // Pick two random survivors
        const shuffled = [...survivors].sort(() => 0.5 - Math.random());
        parent = await recombineGenomes(shuffled[0], shuffled[1]);
      } else {
        // Pick the first survivor (or random)
        parent = survivors[Math.floor(Math.random() * survivors.length)];
      }

      // Save to lineage
      setLineage([...lineage, parent]);
      setCurrentGenome(parent);
      setEvolutionParent(parent);
      setOffspring(null);
      stop();

      // Trigger next generation mutation
      handleMutate(parent);
    } catch (error) {
      console.error("Failed to proceed to next generation", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectFromLineage = (genome: MusicalGenome) => {
    setCurrentGenome(genome);
    setEvolutionParent(genome);
    setOffspring(null);
  };

  const handleLoadStarter = async () => {
    await resumeAudio();
    const starter = { ...DEFAULT_GENOME, genomeId: `starter_${Date.now()}` };
    setCurrentGenome(starter);
    setEvolutionParent(starter);
    setLineage([starter]);
    setShowInstructions(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${ac.selectionBg} ${
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
          <LabLogo size={40} theme={theme} intensity={intensity} />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">{t.title}</h1>
            <p className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-mono font-bold ${
              theme === "dark" ? "text-white" : "text-zinc-600"
            }`}>
              {isLoaded ? t.subtitle : t.loading}
            </p>
          </div>
        </div>

        <nav className="flex items-center justify-between sm:justify-end gap-2 md:gap-4 w-full sm:w-auto" aria-label="Global controls">
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className={`p-2 rounded-lg transition-all ${ac.ring500} outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label={lang === "en" ? "Cambiar a Español" : "Switch to English"}
            >
              <Languages size={18} />
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-lg transition-all ${ac.ring500} outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label={theme === "dark" ? "Switch to High Contrast Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className={`p-2 rounded-lg transition-all ${ac.ring500} outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-zinc-700"
              }`}
              aria-label="View Lab Instructions"
              title={t.instructionsDesc}
            >
              <HelpCircle size={18} />
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-1 hidden xs:block" />

            <button
              onClick={handleExportSession}
              disabled={!currentGenome}
              title={t.exportSessionDesc}
              className={`p-2 rounded-lg transition-all ${ac.ring500} outline-none disabled:opacity-30 ${
                theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-zinc-700"
              }`}
            >
              <Download size={18} />
            </button>

            <label 
              title={t.importSessionDesc}
              className={`p-2 rounded-lg cursor-pointer transition-all focus-within:ring-4 ${ac.ring500} outline-none ${
                theme === "dark" ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-zinc-700"
              }`}
            >
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
              title={t.resetDesc}
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
                onClick={stop}
                disabled={!isLoaded}
                title={t.stopDesc}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all bg-red-600 text-white hover:bg-red-500"
              >
                <Square size={18} fill="currentColor" />
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="p-4 md:p-6 pb-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
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
                <div className={`flex items-center gap-2 ${ac.text600}`}>
                  <Settings2 size={14} className="md:w-4 md:h-4" aria-hidden="true" />
                  <h2 id="mutation-controls-title" className="text-[10px] md:text-xs font-mono uppercase tracking-widest font-bold">{t.mutationParams}</h2>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label htmlFor="descendant-count" className={`flex justify-between text-[9px] md:text-[10px] ${theme === "dark" ? "text-white" : "text-zinc-500"} mb-1 md:mb-2 font-mono font-bold`}>
                      <span>{t.descendantCount}</span>
                      <span>{numDescendants}</span>
                    </label>
                    <input
                      id="descendant-count"
                      type="range"
                      min="2"
                      max="10"
                      step="1"
                      value={numDescendants}
                      onChange={(e) => setNumDescendants(parseInt(e.target.value))}
                      className={`w-full ${ac.accent600} h-1.5 md:h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer`}
                    />
                  </div>

                  <div>
                    <label htmlFor="mutation-rate" className={`flex justify-between text-[9px] md:text-[10px] ${theme === "dark" ? "text-white" : "text-zinc-500"} mb-1 md:mb-2 font-mono font-bold`}>
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
                      title={t.mutationRateDesc}
                      onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                      className={`w-full ${ac.accent600} h-1.5 md:h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer`}
                    />
                    <p className={`text-[8px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-400"} mt-1`}>{t.mutationRateDesc}</p>
                  </div>

                  <fieldset className={`flex p-1 rounded-lg border ${
                    theme === "dark" ? "bg-black/40 border-white/10" : "bg-zinc-100 border-black"
                  }`}>
                    <legend className="sr-only">Mutation Intensity</legend>
                    <button
                      onClick={() => setIntensity("conservative")}
                      aria-pressed={intensity === "conservative"}
                      title={t.conservativeDesc}
                      className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-mono rounded-md transition-all ${ac.ring500} outline-none ${
                        intensity === "conservative" ? `${ac.bg600} text-white font-bold` : (theme === "dark" ? "text-white" : "text-zinc-500")
                      }`}
                    >
                      {t.conservative.toUpperCase()}
                    </button>
                    <button
                      onClick={() => setIntensity("radical")}
                      aria-pressed={intensity === "radical"}
                      title={t.radicalDesc}
                      className={`flex-1 py-1.5 md:py-2 text-[9px] md:text-[10px] font-mono rounded-md transition-all ${ac.ring500} outline-none ${
                        intensity === "radical" ? `${ac.bg600} text-white font-bold` : (theme === "dark" ? "text-white" : "text-zinc-500")
                      }`}
                    >
                      {t.radical.toUpperCase()}
                    </button>
                  </fieldset>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] md:text-[10px] font-mono font-bold uppercase ${theme === "dark" ? "text-white" : "text-zinc-500"}`}>{t.mutationFocus}</span>
                      <div className="group relative">
                        <HelpCircle size={12} className={theme === "dark" ? "text-white" : "text-zinc-500"} />
                        <div className="absolute left-full ml-2 top-0 w-32 p-2 bg-black text-[8px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-white/10">
                          {t.filterDesc}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                      {(['drums', 'bass', 'melody'] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => setMutationFilters(prev => ({ ...prev, [role]: !prev[role] }))}
                          title={t.filterDesc}
                          className={`py-1.5 md:py-2 text-[7px] md:text-[8px] font-mono rounded-lg border transition-all ${
                            mutationFilters[role] 
                              ? `${ac.bg600_20} ${ac.border600} ${ac.text600} font-bold` 
                              : "bg-transparent border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {t[`filter${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pitch Gate UI Removed as per request, but logic remains active */}

                  <button
                    onClick={() => handleMutate()}
                    disabled={isGenerating}
                    aria-busy={isGenerating}
                    title={t.evolveDesc}
                    className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${ac.ring500} outline-none ${
                      theme === "dark" ? `bg-white text-black ${ac.hoverBg500}` : `bg-black text-white ${ac.hoverBg600}`
                    }`}
                  >
                    {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Dna size={18} />}
                    {t.evolve}
                  </button>
                  <p className={`text-[8px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-400"} text-center`}>{t.evolveDesc}</p>
                </div>
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
                  <h2 id="initial-selection-title" className={`text-2xl font-bold ${ac.text600}`}>{t.chooseRootAncestor}</h2>
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
                    className={`rounded-2xl md:rounded-3xl border-2 p-3 md:p-4 space-y-3 transition-all ${
                      theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className={`text-sm font-bold ${ac.text600} uppercase tracking-wider`}>{t.option} {idx + 1}</h3>
                      <button
                        onClick={() => play(genome)}
                        className={`w-8 h-8 rounded-full ${ac.bg600} text-white flex items-center justify-center ${ac.hoverBg500} transition-all`}
                      >
                        <Play size={14} fill="currentColor" className="ml-0.5" />
                      </button>
                    </div>
                    
                    <p className={`text-[10px] font-medium italic leading-tight ${theme === "dark" ? "text-zinc-200" : "text-zinc-600"}`}>
                      {genome.summary}
                    </p>

                    <div className={`h-44 overflow-hidden rounded-xl border transition-colors duration-300 ${
                      theme === "dark" ? "bg-black/20 border-white/5" : "bg-zinc-100 border-zinc-200"
                    }`}>
                      <GenomeTimeline genome={genome} currentTime={-1} theme={theme} />
                    </div>

                    <button
                      onClick={() => handleSelectInitial(genome)}
                      title={t.selectThisAncestor}
                      className={`w-full py-3 ${ac.bg600} text-white font-bold rounded-xl ${ac.hoverBg500} transition-all flex items-center justify-center gap-2`}
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
                <LabLogo size={120} theme={theme} />
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
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${ac.ring500} outline-none ${
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
                  className={`w-full py-4 ${ac.bg600} text-white text-lg font-bold rounded-full ${ac.hoverBg500} transition-all flex items-center justify-center gap-3 shadow-xl ${ac.ring400} outline-none`}
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={24} /> : <Activity size={24} />}
                  <span>{t.initialize}</span>
                </button>
              </div>
            </section>
          ) : offspring ? (
            <section className="space-y-6" aria-labelledby="selection-title">
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-4">
                  <h2 id="selection-title" className={`text-xl font-bold ${ac.text600}`}>{t.selectionRoom}</h2>
                  <button
                    onClick={() => setOffspring(null)}
                    className={`p-1.5 rounded-full transition-all hover:bg-red-500/10 text-zinc-500 hover:text-red-500`}
                    title={t.leaveSelectionRoom}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className={`text-xs ${theme === "dark" ? "text-zinc-200" : "text-zinc-500"} max-w-2xl mx-auto`}>{t.selectionDesc}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {offspring.map((child, idx) => (
                  <motion.div
                    key={child.genomeId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border p-3 space-y-3 transition-all ${
                      theme === "dark" 
                        ? "bg-zinc-900/50 border-white/10" 
                        : "bg-white border-black shadow-sm"
                    } ${offspringStatus[idx] === "die" ? "opacity-50 grayscale" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 ${ac.bg600_10} ${ac.text600} rounded-full text-[9px] font-mono font-bold uppercase`}>
                        {t.option} {idx + 1}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (status === "playing") pause();
                            else if (status === "paused") resume();
                            else play(child);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            status === "playing" ? "bg-amber-500 text-white" : `${ac.bg600} text-white`
                          }`}
                        >
                          {status === "playing" ? <div className="flex gap-0.5"><div className="w-0.5 h-2 bg-white rounded-full"/><div className="w-0.5 h-2 bg-white rounded-full"/></div> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button
                          onClick={stop}
                          className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all"
                        >
                          <Square size={12} fill="currentColor" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-zinc-600"}`}>{t.die}</span>
                      <button 
                        onClick={() => toggleOffspringStatus(idx)}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          offspringStatus[idx] === "live" ? ac.bg600 : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          offspringStatus[idx] === "live" ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                      <span className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-zinc-600"}`}>{t.live}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 pt-4 border-t border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={shouldRecombine}
                          onChange={(e) => setShouldRecombine(e.target.checked)}
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${shouldRecombine ? ac.bg600 : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${shouldRecombine ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-xs font-bold">{t.recombineQuestion}</span>
                    </label>
                    <p className={`text-[10px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-500"} mt-1`}>{t.recombineDesc}</p>
                  </div>
                </div>

                <button
                  onClick={handleProceedToNextGen}
                  disabled={isGenerating || offspringStatus.filter(s => s === "live").length === 0}
                  className={`px-10 py-3 ${ac.bg600} text-white font-bold rounded-full ${ac.hoverBg500} transition-all flex items-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <GitBranch size={18} />}
                  {t.proceed}
                </button>
              </div>
            </section>
          ) : (
            <>
              {/* Genome Overview */}
              <section className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4" aria-label="Genome statistics">
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${ac.bg500_10} flex items-center justify-center ${ac.text600}`} aria-hidden="true">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className={`text-[8px] md:text-[10px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-500"} font-mono uppercase font-bold`}>{t.tempo}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.tempo} BPM</p>
                  </div>
                </div>
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${ac.bg500_10} flex items-center justify-center ${ac.text600}`} aria-hidden="true">
                    <History size={18} />
                  </div>
                  <div>
                    <p className={`text-[8px] md:text-[10px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-500"} font-mono uppercase font-bold`}>{t.generation}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.generation}</p>
                  </div>
                </div>
                <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 flex items-center gap-3 md:gap-4 col-span-2 md:col-span-1 ${
                  theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                }`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${ac.bg500_10} flex items-center justify-center ${ac.text600}`} aria-hidden="true">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className={`text-[8px] md:text-[10px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-500"} font-mono uppercase font-bold`}>{t.duration}</p>
                    <p className="text-sm md:text-lg font-bold">{currentGenome.durationTarget.toFixed(2)}s</p>
                  </div>
                </div>
              </section>

              {/* Timeline */}
              <section className="space-y-4" aria-labelledby="phenotype-title">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 id="phenotype-title" className="text-sm font-bold">{t.phenotype}</h2>
                    <p className={`text-xs ${theme === "dark" ? "text-white" : "text-zinc-500"} font-medium`}>{t.structuralMap}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAnalysis(!showAnalysis)}
                      aria-expanded={showAnalysis}
                      title={t.mutationAnalysis}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all font-bold ${ac.ring500} outline-none ${
                        showAnalysis ? `${ac.bg600} text-white ${ac.border600}` : "bg-white/5 border-white/10 text-zinc-500"
                      }`}
                    >
                      {t.mutationAnalysis.toUpperCase()}
                    </button>
                  </div>
                </div>
                
                <div role="img" aria-label="Visual timeline of musical events">
                  <GenomeTimeline 
                    genome={currentGenome} 
                    currentTime={currentTime} 
                    theme={theme} 
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onEventMove={handleEventMove}
                    lineage={lineage}
                    analysisMode={showAnalysis}
                    labels={{
                      zoomIn: t.zoomInDesc,
                      zoomOut: t.zoomOutDesc,
                      fit: t.fitDesc
                    }}
                    overlayGenomes={lineage.filter(g => selectedForComparison.includes(g.genomeId))}
                  />
                </div>
              </section>

              {/* Mutation Analysis Legend */}
              <AnimatePresence>
                {showAnalysis && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`rounded-2xl border p-6 space-y-4 ${
                      theme === "dark" ? "bg-zinc-900/50 border-white/10" : "bg-white border-black shadow-sm"
                    }`}
                    aria-labelledby="analysis-legend-title"
                  >
                    <div className={`flex items-center gap-2 ${ac.text600}`}>
                      <Activity size={16} aria-hidden="true" />
                      <h3 id="analysis-legend-title" className="text-xs font-mono uppercase tracking-widest font-bold">{t.mutationAnalysis}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded ${intensity === 'radical' ? 'bg-blue-500/40 border-blue-500' : 'bg-green-500/40 border-green-500'}`} />
                        <span className="text-xs font-medium">{t.conserved}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-yellow-500/40 border border-yellow-500" />
                        <span className="text-xs font-medium">{t.shared}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-red-500/40 border border-red-500" />
                        <span className="text-xs font-medium">{t.unique}</span>
                      </div>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </main>

      {/* Evolutionary Path Drawer */}
      {currentGenome && (
        <motion.div
          initial={false}
          animate={{ height: isLineageOpen ? "auto" : "48px" }}
          className={`fixed bottom-0 left-0 right-0 z-[60] border-t backdrop-blur-xl transition-colors duration-300 ${
            theme === "dark" ? "bg-zinc-900/90 border-white/10 text-white" : "bg-white/90 border-black text-black shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={() => setIsLineageOpen(!isLineageOpen)}
              className="w-full h-12 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <GitBranch size={18} className={ac.text500} />
                <span className="text-xs font-mono font-bold uppercase tracking-widest">{t.lineageTitle}</span>
                <span className={`text-[10px] font-mono opacity-50 px-2 py-0.5 ${ac.bg500_10} rounded-full`}>
                  {lineage.length} {lang === 'en' ? 'Generations' : 'Generaciones'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono opacity-40 group-hover:opacity-100 transition-opacity">
                  {t.compareDesc}
                </div>
                {isLineageOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </div>
            </button>

            <AnimatePresence>
              {isLineageOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pb-8 pt-2"
                >
                  <p className={`text-[10px] mb-4 opacity-70 italic ${theme === "dark" ? "text-white" : "text-zinc-600"}`}>
                    {t.lineageInstructions}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {lineage.map((g, idx) => (
                      <div 
                        key={g.genomeId} 
                        className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                          selectedForComparison.includes(g.genomeId)
                            ? `${ac.border500} ${ac.bg500_5}`
                            : theme === "dark" ? "border-white/5 bg-black/20 hover:border-white/20" : "border-black/10 bg-zinc-50 hover:border-black"
                        }`}
                        onClick={() => toggleComparison(g.genomeId)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono font-bold">GEN {g.generation}</span>
                          <div className={`w-2 h-2 rounded-full ${selectedForComparison.includes(g.genomeId) ? ac.bg500 : 'bg-zinc-700'}`} />
                        </div>
                        <p className="text-[9px] font-mono opacity-50 truncate mb-2">{g.genomeId.slice(-8)}</p>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              play(g);
                            }}
                            className={`p-1.5 rounded-lg ${ac.bg600} text-white ${ac.hoverBg500} transition-all`}
                          >
                            <Play size={10} fill="currentColor" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentGenome(g);
                              setEvolutionParent(g);
                              setOffspring(null);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              theme === "dark" ? "bg-white/10 hover:bg-white/20" : "bg-black/5 hover:bg-black/10"
                            }`}
                            title={t.selectThisAncestor}
                          >
                            <Activity size={10} />
                          </button>
                        </div>

                        {g.genomeId === currentGenome.genomeId && (
                          <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 ${ac.bg600} text-white text-[7px] font-bold rounded-md uppercase`}>
                            Current
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Audio Unlock Overlay for Mobile */}
      {isAudioSuspended && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full ${ac.bg500_20} flex items-center justify-center animate-pulse`}>
            <Music size={40} className={ac.text500} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{lang === 'en' ? 'Audio is Muted' : 'Audio Silenciado'}</h2>
            <p className="text-white text-sm max-w-xs">
              {lang === 'en' 
                ? 'Browsers require a user gesture to enable audio. Click below to start the engine. Also, ensure your hardware silent switch is OFF.' 
                : 'Los navegadores requieren un gesto del usuario para activar el audio. Haz clic abajo para iniciar. Asegúrate también de que el interruptor de silencio físico esté DESACTIVADO.'}
            </p>
          </div>
          <button
            onClick={resumeAudio}
            className={`px-8 py-4 ${ac.bg600} text-white font-bold rounded-2xl ${ac.hoverBg500} transition-all shadow-lg ${ac.shadow500_20} flex items-center gap-3`}
          >
            <Play size={20} fill="currentColor" />
            {lang === 'en' ? 'START AUDIO ENGINE' : 'INICIAR MOTOR DE AUDIO'}
          </button>
        </div>
      )}

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
                  <HelpCircle className={ac.text600} aria-hidden="true" />
                  {t.instructionsTitle}
                </h3>
                <button 
                  onClick={() => setShowInstructions(false)}
                  aria-label={t.closeInstructions}
                  className={`p-2 rounded-full transition-all ${ac.ring500} outline-none ${
                    theme === "dark" ? "hover:bg-white/5" : "hover:bg-black/5"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {!showManual ? (
                  <>
                    <div className="space-y-6">
                      <h4 className={`text-lg font-bold ${ac.text600}`}>{t.quickGuideTitle}</h4>
                      <div className="space-y-4">
                        {t.quickGuideSteps.map((step, i) => {
                          const [title, ...rest] = step.split(':');
                          return (
                            <div key={i} className="flex gap-4 items-start">
                              <div className={`w-6 h-6 rounded-lg ${ac.bg600} text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                                {i + 1}
                              </div>
                              <div className="space-y-1">
                                <h5 className={`text-sm font-bold uppercase tracking-wider ${theme === "dark" ? ac.text500 : ac.text600}`}>
                                  {title}
                                </h5>
                                <p className={`text-sm font-medium leading-relaxed ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                                  {rest.join(':').trim()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={() => setShowManual(true)}
                        className={`w-full py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                          theme === "dark" 
                            ? "border-white/10 hover:bg-white/5 text-white" 
                            : "border-black hover:bg-black/5 text-black"
                        }`}
                      >
                        <BookOpen size={18} />
                        {t.openManual}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-lg font-bold ${ac.text600}`}>{t.manualTitle}</h4>
                      <button
                        onClick={() => setShowManual(false)}
                        className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${ac.text600} hover:opacity-70 transition-all`}
                      >
                        <ArrowLeft size={14} />
                        {t.backToGuide}
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h5 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>{t.manualWelcome}</h5>
                        <p className={`text-sm font-bold italic ${ac.text500}`}>{t.manualIntro}</p>
                      </div>
                      
                      <div className="space-y-4">
                        {t.manualBody.map((paragraph, i) => (
                          <p key={i} className={`text-sm leading-relaxed ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => setShowManual(false)}
                        className={`w-full py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                          theme === "dark" 
                            ? "border-white/10 hover:bg-white/5 text-white" 
                            : "border-black hover:bg-black/5 text-black"
                        }`}
                      >
                        <ArrowLeft size={18} />
                        {t.backToGuide}
                      </button>
                    </div>
                  </div>
                )}
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
                  <GitBranch className={ac.text600} aria-hidden="true" />
                  {t.lineageTitle}
                </h3>
                <button 
                  onClick={() => setShowAncestry(false)}
                  aria-label="Close ancestry path"
                  className={`p-2 rounded-full transition-all ${ac.ring500} outline-none ${
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
                      <div className={`absolute left-4 top-10 bottom-[-24px] w-0.5 ${ac.bg600_30}`} />
                    )}
                    <div className="flex gap-6 items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 ${
                        genome.genomeId === currentGenome?.genomeId 
                          ? `${ac.bg600} text-white ring-4 ${ac.ring600_20}` 
                          : "bg-zinc-800 text-white"
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
                            ? `${ac.bg600_10} ${ac.border600}`
                            : theme === "dark" 
                              ? `bg-black/40 border-white/10 ${ac.hoverBorder600_50}` 
                              : `bg-zinc-50 border-black ${ac.hoverBorder600}`
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-mono ${ac.text600} font-bold`}>GEN {genome.generation}</span>
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
          {t.footer}
        </p>
      </footer>
    </div>
  );
}
