import { MusicalGenome, MutationFilters } from "../types";
import { DEFAULT_GENOME, SAMPLE_LIBRARY } from "../constants";

/**
 * Hardcoded evolution engine.
 * Replaces AI integration with local deterministic/probabilistic logic.
 */

export async function generateInitialGenome(count: number = 1): Promise<MusicalGenome[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const genomes: MusicalGenome[] = [];
  
  const summaries = [
    "Steady Pulse - A rhythmic foundation with balanced layers.",
    "Melodic Spark - Focused on high-register sequences and clear themes.",
    "Deep Resonance - Heavy bass emphasis with atmospheric textures.",
    "Chaotic Growth - A dense, high-energy sequence with complex interactions."
  ];

  for (let i = 0; i < count; i++) {
    const id = `gen_${Math.random().toString(36).substring(2, 11)}`;
    const baseGenome = JSON.parse(JSON.stringify(DEFAULT_GENOME));
    
    // Add some variety to initial genomes
    if (i === 1) { // Melodic
      baseGenome.tempo = 110;
      baseGenome.layers.forEach(l => {
        if (l.role === 'Melody') l.events.forEach(e => e.gain *= 1.2);
      });
    } else if (i === 2) { // Bass
      baseGenome.tempo = 95;
      baseGenome.layers.forEach(l => {
        if (l.role === 'Bass') l.events.forEach(e => e.gain *= 1.3);
      });
    } else if (i === 3) { // Chaotic
      baseGenome.tempo = 140;
      baseGenome.layers.forEach(l => {
        l.events.forEach(e => {
          e.start = Math.random() * baseGenome.durationTarget;
          e.pitchShift += (Math.random() > 0.5 ? 7 : -5);
        });
      });
    }

    genomes.push({
      ...baseGenome,
      genomeId: id,
      rootAncestorId: id,
      generation: 0,
      summary: summaries[i % summaries.length]
    });
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
