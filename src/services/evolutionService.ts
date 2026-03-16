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
      nameKey: "styleTechno",
      summaryKey: "styleTechnoDesc",
      tempo: 128,
      drums: [
        { id: "kick_01", times: [0, 1, 2, 3, 4] },
        { id: "snare_01", times: [1, 3] },
        { id: "hihat_01", times: [0.5, 1.5, 2.5, 3.5, 4.5] }
      ],
      bass: [0, 0.5, 1.5, 2, 2.5, 3.5, 4, 4.5],
      melody: [0.25, 1.25, 2.25, 3.25, 4.25]
    },
    {
      nameKey: "styleMinimal",
      summaryKey: "styleMinimalDesc",
      tempo: 72,
      drums: [
        { id: "hihat_01", times: [0, 2.5] }
      ],
      bass: [0, 2.5],
      melody: [1.25, 3.75]
    },
    {
      nameKey: "styleFunk",
      summaryKey: "styleFunkDesc",
      tempo: 100,
      drums: [
        { id: "kick_01", times: [0, 0.75, 2, 2.75] },
        { id: "snare_01", times: [1, 3] },
        { id: "hihat_01", times: [0.25, 0.5, 1.25, 1.5, 2.25, 2.5, 3.25, 3.5] }
      ],
      bass: [0, 1, 2, 3, 4],
      melody: [0.5, 1.5, 2.5, 3.5]
    },
    {
      nameKey: "styleGlitch",
      summaryKey: "styleGlitchDesc",
      tempo: 140,
      drums: [
        { id: "kick_01", times: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5] },
        { id: "snare_01", times: [0.75, 1.75, 2.75, 3.75, 4.75] },
        { id: "hihat_01", times: [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75, 4.25, 4.75] }
      ],
      bass: [0.25, 1.25, 2.25, 3.25, 4.25],
      melody: [0, 1, 2, 3, 4]
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
      summary: style.summaryKey, // Store key for translation
      regulatoryRules: [],
      mutationHistory: [],
      layers: [
        {
          layerId: "drums",
          role: "drums",
          events: style.drums.flatMap(d => d.times.map((t, idx) => ({
            eventId: `d_${i}_${idx}_${Math.random().toString(36).substring(2, 11)}`,
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
            eventId: `b_${i}_${idx}_${Math.random().toString(36).substring(2, 11)}`,
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
            eventId: `m_${i}_${idx}_${Math.random().toString(36).substring(2, 11)}`,
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
  filters: MutationFilters,
  options: { pitchGate?: boolean, variantType?: number } = {}
): Promise<MusicalGenome> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Deep clone the genome
  const newGenome: MusicalGenome = JSON.parse(JSON.stringify(genome));
  
  newGenome.parentId = genome.genomeId;
  newGenome.genomeId = `gen_${Math.random().toString(36).substring(2, 11)}`;
  newGenome.generation = (genome.generation || 0) + 1;
  newGenome.mutationHistory = [];

  const isConservative = intensity === "conservative";
  const { pitchGate = false, variantType = 2 } = options;

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
      // Variant 3: Just shuffle instruments, no structural mutation
      if (variantType === 3) {
        const relevantSamples = SAMPLE_LIBRARY.filter(s => {
          if (role.includes('drum')) return s.role === 'percussion';
          if (role.includes('bass')) return s.role === 'bass';
          return s.role === 'melody' || s.role === 'pad';
        });
        
        const newEvent = { ...event, eventId: `e_${Math.random().toString(36).substring(2, 11)}` };
        if (relevantSamples.length > 0) {
          newEvent.sampleId = relevantSamples[Math.floor(Math.random() * relevantSamples.length)].id;
        }
        return newEvent;
      }

      // Variant 1: First 3 seconds identical
      if (variantType === 1 && event.start < 3) return event;

      if (Math.random() > mutationRate) return event;

      const mutatedEvent = { ...event, eventId: `e_${Math.random().toString(36).substring(2, 11)}` };

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

      // Apply Pitch Gate
      if (pitchGate && mutatedEvent.pitchShift > 12) {
        mutatedEvent.pitchShift = 12;
      }

      return mutatedEvent;
    });

    // Radical mode: add or remove events
    if (!isConservative && Math.random() < mutationRate && variantType !== 3) {
      if (Math.random() > 0.4 && layer.events.length < 16) {
        // Add event
        const baseEvent = layer.events[Math.floor(Math.random() * layer.events.length)] || DEFAULT_GENOME.layers[0].events[0];
        const newStart = Math.random() * newGenome.durationTarget;
        
        // Variant 1 check
        if (variantType === 1 && newStart < 3) return;

        layer.events.push({
          ...baseEvent,
          eventId: `e_${Math.random().toString(36).substring(2, 11)}`,
          start: newStart,
          pitchShift: baseEvent.pitchShift + (Math.random() > 0.5 ? 12 : -12)
        });
      } else if (layer.events.length > 1) {
        // Remove event
        const idx = Math.floor(Math.random() * layer.events.length);
        // Variant 1 check
        if (variantType === 1 && layer.events[idx].start < 3) return;
        layer.events.splice(idx, 1);
      }
    }
  });

  const variantNames = ["", "variant1", "variant2", "variant3"];
  newGenome.summary = `Generation ${newGenome.generation} - ${variantNames[variantType]}`;
  
  // Resolve overlaps and cap duration to target
  newGenome.layers.forEach(layer => {
    layer.events = resolveOverlaps(layer.events, newGenome.durationTarget);
  });
  
  return newGenome;
}

function resolveOverlaps(events: any[], maxDuration: number): any[] {
  if (events.length === 0) return [];
  
  // Sort by start time
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const resolved: any[] = [];
  
  sorted.forEach((event, i) => {
    // Cap duration to not exceed maxDuration
    if (event.start + event.duration > maxDuration) {
      event.duration = Math.max(0.05, maxDuration - event.start);
    }

    if (i === 0) {
      resolved.push(event);
      return;
    }
    
    const last = resolved[resolved.length - 1];
    const overlap = last.start + last.duration - event.start;
    
    if (overlap > 0) {
      // If they overlap, shorten the previous one
      last.duration = Math.max(0.05, last.duration - overlap);
      
      // If even after shortening they still overlap
      if (last.start + last.duration > event.start) {
        event.start = last.start + last.duration;
      }
    }

    // Final check for the current event after potential start shift
    if (event.start + event.duration > maxDuration) {
      event.duration = Math.max(0.05, maxDuration - event.start);
    }
    
    // If start is pushed beyond maxDuration, don't add it
    if (event.start < maxDuration) {
      resolved.push(event);
    }
  });
  
  return resolved;
}

export async function recombineGenomes(
  genomeA: MusicalGenome,
  genomeB: MusicalGenome
): Promise<MusicalGenome> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const newGenome: MusicalGenome = JSON.parse(JSON.stringify(genomeA));
  newGenome.genomeId = `rec_${Math.random().toString(36).substring(2, 11)}`;
  newGenome.parentId = `${genomeA.genomeId}+${genomeB.genomeId}`;
  newGenome.generation = Math.max(genomeA.generation, genomeB.generation) + 1;
  newGenome.summary = "Recombination of survivors";

  // Mix layers
  newGenome.layers = newGenome.layers.map((layer, idx) => {
    const otherLayer = genomeB.layers[idx];
    if (!otherLayer) return layer;

    // Mix events within the layer
    const splitA = Math.floor(layer.events.length * Math.random());
    const splitB = Math.floor(otherLayer.events.length * Math.random());
    
    const mixedEvents = [
      ...layer.events.slice(0, splitA),
      ...otherLayer.events.slice(splitB)
    ].map(event => ({
      ...event,
      eventId: `e_${Math.random().toString(36).substring(2, 11)}`
    }));
    
    // Resolve overlaps and cap duration
    return { ...layer, events: resolveOverlaps(mixedEvents, newGenome.durationTarget) };
  });

  return newGenome;
}
