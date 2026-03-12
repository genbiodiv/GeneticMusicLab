import { MusicalGenome, MutationFilters } from "../types";
import { DEFAULT_GENOME, SAMPLE_LIBRARY } from "../constants";

/**
 * Hardcoded evolution engine.
 * Replaces AI integration with local deterministic/probabilistic logic.
 */

export async function generateInitialGenome(count: number = 4): Promise<MusicalGenome[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const genomes: MusicalGenome[] = [];
  
  const styles = [
    {
      name: "Techno Pulse",
      summary: "High-energy 4/4 industrial beat with driving bass and sharp leads.",
      tempo: 128,
      drums: [
        { id: "kick_01", times: [0, 1, 2, 3, 4] },
        { id: "snare_01", times: [1, 3] },
        { id: "hihat_01", times: [0.5, 1.5, 2.5, 3.5, 4.5] }
      ],
      bass: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
      melody: [0.25, 1.25, 2.25, 3.25, 4.25]
    },
    {
      name: "Ambient Drift",
      summary: "Ethereal soundscapes with slow-evolving pads and minimal percussion.",
      tempo: 70,
      drums: [
        { id: "kick_01", times: [0, 4] },
        { id: "hihat_01", times: [2] }
      ],
      bass: [0, 2.5],
      melody: [0.5, 3.5]
    },
    {
      name: "Neo-Funk",
      summary: "Syncopated rhythmic patterns with groovy basslines and playful melodies.",
      tempo: 105,
      drums: [
        { id: "kick_01", times: [0, 0.75, 2, 2.75] },
        { id: "snare_01", times: [1, 3] },
        { id: "hihat_01", times: [0.25, 0.5, 1.25, 1.5, 2.25, 2.5, 3.25, 3.5] }
      ],
      bass: [0, 0.75, 1.5, 2, 2.75, 3.5],
      melody: [0.5, 1, 2.5, 3]
    },
    {
      name: "Glitch Core",
      summary: "Erratic, high-speed sequences with chaotic pitch shifts and unpredictable timing.",
      tempo: 160,
      drums: [
        { id: "kick_01", times: [0, 0.1, 0.5, 1.2, 2, 2.1, 3.5] },
        { id: "snare_01", times: [0.8, 1.8, 2.8, 3.8] },
        { id: "hihat_01", times: [0.05, 0.15, 0.25, 0.35, 1.05, 2.05, 3.05] }
      ],
      bass: [0.1, 1.1, 2.1, 3.1],
      melody: [0.2, 0.4, 0.6, 1.2, 1.4, 2.2, 2.4, 3.2, 3.4]
    }
  ];

  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length];
    const id = `gen_${Math.random().toString(36).substring(2, 11)}`;
    
    const genome: MusicalGenome = {
      genomeId: id,
      parentId: null,
      rootAncestorId: id,
      durationTarget: 5,
      tempo: style.tempo,
      timeSignature: "4/4",
      generation: 0,
      summary: style.summary,
      regulatoryRules: [],
      mutationHistory: [],
      layers: [
        {
          layerId: "drums",
          role: "drums",
          events: style.drums.flatMap(d => d.times.map((t, idx) => ({
            eventId: `d_${i}_${idx}_${Math.random()}`,
            sampleId: d.id,
            start: t,
            duration: 0.1,
            gain: 0.7,
            pitchShift: 0
          })))
        },
        {
          layerId: "bass",
          role: "bass",
          events: style.bass.map((t, idx) => ({
            eventId: `b_${i}_${idx}_${Math.random()}`,
            sampleId: i === 1 ? "pad_01" : "bass_01",
            start: t,
            duration: i === 1 ? 2 : 0.4,
            gain: 0.6,
            pitchShift: -12
          }))
        },
        {
          layerId: "melody",
          role: "melody",
          events: style.melody.map((t, idx) => ({
            eventId: `m_${i}_${idx}_${Math.random()}`,
            sampleId: i === 1 ? "pad_01" : "lead_01",
            start: t,
            duration: i === 1 ? 3 : 0.3,
            gain: 0.5,
            pitchShift: Math.floor(Math.random() * 12)
          }))
        }
      ]
    };

    genomes.push(genome);
  }

  return genomes;
}

export async function mutateGenome(
  genome: MusicalGenome, 
  mutationRate: number, 
  intensity: "conservative" | "radical",
  filters: MutationFilters
): Promise<MusicalGenome> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Deep clone the genome
  const newGenome: MusicalGenome = JSON.parse(JSON.stringify(genome));
  
  newGenome.parentId = genome.genomeId;
  newGenome.genomeId = `gen_${Math.random().toString(36).substring(2, 11)}`;
  newGenome.generation = (genome.generation || 0) + 1;
  newGenome.mutationHistory = [];

  const isConservative = intensity === "conservative";

  newGenome.layers.forEach(layer => {
    const role = layer.role.toLowerCase();
    const shouldMutate = 
      (role.includes('drum') && filters.drums) ||
      (role.includes('bass') && filters.bass) ||
      (role.includes('melody') && filters.melody) ||
      (role.includes('lead') && filters.melody) ||
      (role.includes('pad') && filters.melody);

    if (!shouldMutate) return;

    layer.events = layer.events.map(event => {
      if (Math.random() > mutationRate) return event;

      const mutatedEvent = { ...event, eventId: `e_${Math.random().toString(36).substring(2, 7)}` };

      if (isConservative) {
        // Small tweaks
        mutatedEvent.pitchShift += (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2));
        mutatedEvent.start = Math.max(0, Math.min(newGenome.durationTarget - 0.1, mutatedEvent.start + (Math.random() - 0.5) * 0.2));
        mutatedEvent.gain = Math.max(0.1, Math.min(1, mutatedEvent.gain + (Math.random() - 0.5) * 0.1));
      } else {
        // Radical tweaks
        const pitchOptions = [0, 3, 5, 7, 10, 12, -12];
        mutatedEvent.pitchShift += pitchOptions[Math.floor(Math.random() * pitchOptions.length)];
        mutatedEvent.start = Math.max(0, Math.min(newGenome.durationTarget - 0.1, Math.random() * newGenome.durationTarget));
        
        // Randomly change sample within role
        const relevantSamples = SAMPLE_LIBRARY.filter(s => {
            if (role.includes('drum')) return s.role === 'percussion';
            if (role.includes('bass')) return s.role === 'bass';
            return s.role === 'melody' || s.role === 'pad';
        });
        
        if (relevantSamples.length > 0) {
          mutatedEvent.sampleId = relevantSamples[Math.floor(Math.random() * relevantSamples.length)].id;
        }
      }

      return mutatedEvent;
    });

    // Radical mode: add or remove events
    if (!isConservative && Math.random() < mutationRate) {
      if (Math.random() > 0.4 && layer.events.length < 16) {
        // Add event
        const baseEvent = layer.events[Math.floor(Math.random() * layer.events.length)] || DEFAULT_GENOME.layers[0].events[0];
        layer.events.push({
          ...baseEvent,
          eventId: `e_${Math.random().toString(36).substring(2, 7)}`,
          start: Math.random() * newGenome.durationTarget,
          pitchShift: baseEvent.pitchShift + (Math.random() > 0.5 ? 12 : -12)
        });
      } else if (layer.events.length > 1) {
        // Remove event
        layer.events.splice(Math.floor(Math.random() * layer.events.length), 1);
      }
    }
  });

  newGenome.summary = `Generation ${newGenome.generation} - ${intensity.toUpperCase()} local mutation at ${Math.round(mutationRate * 100)}% rate.`;
  
  return newGenome;
}
