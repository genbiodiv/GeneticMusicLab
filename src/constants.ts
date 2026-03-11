import { SampleLibraryItem, MusicalGenome } from "./types";

// Using Tone.js built-in synthesizers to generate sounds programmatically.
// The genome structure maps to these synth configurations.

export const DEFAULT_GENOME: MusicalGenome = {
  genomeId: "default-001",
  parentId: null,
  rootAncestorId: "default-001",
  durationTarget: 5,
  tempo: 120,
  timeSignature: "4/4",
  generation: 0,
  layers: [
    {
      layerId: "drums",
      role: "drums",
      events: [
        { eventId: "d1", sampleId: "kick_01", start: 0, duration: 0.1, gain: 0.8, pitchShift: 0 },
        { eventId: "d2", sampleId: "kick_01", start: 1, duration: 0.1, gain: 0.8, pitchShift: 0 },
        { eventId: "d3", sampleId: "kick_01", start: 2, duration: 0.1, gain: 0.8, pitchShift: 0 },
        { eventId: "d4", sampleId: "kick_01", start: 3, duration: 0.1, gain: 0.8, pitchShift: 0 },
        { eventId: "d5", sampleId: "kick_01", start: 4, duration: 0.1, gain: 0.8, pitchShift: 0 },
        { eventId: "s1", sampleId: "snare_01", start: 0.5, duration: 0.1, gain: 0.6, pitchShift: 0 },
        { eventId: "s2", sampleId: "snare_01", start: 1.5, duration: 0.1, gain: 0.6, pitchShift: 0 },
        { eventId: "s3", sampleId: "snare_01", start: 2.5, duration: 0.1, gain: 0.6, pitchShift: 0 },
        { eventId: "s4", sampleId: "snare_01", start: 3.5, duration: 0.1, gain: 0.6, pitchShift: 0 },
        { eventId: "s5", sampleId: "snare_01", start: 4.5, duration: 0.1, gain: 0.6, pitchShift: 0 },
      ]
    },
    {
      layerId: "bass",
      role: "bass",
      events: [
        { eventId: "b1", sampleId: "bass_01", start: 0, duration: 0.5, gain: 0.7, pitchShift: -12 },
        { eventId: "b2", sampleId: "bass_01", start: 1, duration: 0.5, gain: 0.7, pitchShift: -12 },
        { eventId: "b3", sampleId: "bass_01", start: 2, duration: 0.5, gain: 0.7, pitchShift: -12 },
        { eventId: "b4", sampleId: "bass_01", start: 3, duration: 0.5, gain: 0.7, pitchShift: -12 },
      ]
    }
  ],
  regulatoryRules: [],
  mutationHistory: [],
  summary: "Default rhythmic starter genome.",
};

export const SAMPLE_LIBRARY: SampleLibraryItem[] = [
  { id: "kick_01", name: "Deep Kick", synthType: "membrane", role: "percussion", category: "drums" },
  { id: "snare_01", name: "Sharp Snare", synthType: "metal", role: "percussion", category: "drums" },
  { id: "hihat_01", name: "Crisp Hat", synthType: "metal", role: "percussion", category: "drums" },
  { id: "bass_01", name: "Deep Sine Bass", synthType: "mono", role: "bass", category: "synth" },
  { id: "bass_02", name: "Pluck Bass", synthType: "mono", role: "bass", category: "synth" },
  { id: "lead_01", name: "Bright Lead", synthType: "poly", role: "melody", category: "synth" },
  { id: "lead_02", name: "Soft Lead", synthType: "fm", role: "melody", category: "synth" },
  { id: "pad_01", name: "Ether Pad", synthType: "poly", role: "pad", category: "synth" },
  { id: "fx_01", name: "Sweep FX", synthType: "fm", role: "fx", category: "fx" },
];

export const INITIAL_GENOME_PROMPT = `
Generate a starting musical genome for a 5-second piece. 
Tempo: 100-120 BPM.
Layers: drums (kick, snare, hihat), bass, melody.
Return a JSON object following the MusicalGenome interface.
Use synth IDs from: kick_01, snare_01, hihat_01, bass_01, bass_02, lead_01, lead_02, pad_01.
The piece should be structured and rhythmic.
Note: Events should specify a "pitchShift" which will determine the MIDI note played (0 = C4, 12 = C5, etc.).
Duration MUST be exactly 5 seconds.

CRITICAL RULES:
1. Use simple decimal numbers (e.g., 0.5, 1.25). Max 3 decimal places.
2. NO escape characters in strings (no backslashes).
3. Keep all string values EXTREMELY SHORT (max 20 characters).
4. NO REPETITIVE STRINGS or long concatenated identifiers.
5. Keep it concise: max 12 events per layer.
6. Summary max 100 chars.
`;

export const MUTATION_PROMPT = (genome: any, mutationRate: number, intensity: "conservative" | "radical") => `
You are a genetic music assistant. Mutate the following musical genome.
Current Genome: ${JSON.stringify(genome)}
Mutation Rate: ${mutationRate} (0 to 1)
Intensity: ${intensity}

Rules:
1. Preserve hereditary relationship (parentId = current genomeId).
2. Duration MUST be exactly 5 seconds.
3. Apply ${intensity === 'conservative' ? 'small SNP mutations' : 'structural mutations like duplications, inversions, or translocations'}.
4. Return ONLY the new JSON genome.
5. Use simple decimal numbers. Max 3 decimal places.
6. NO escape characters in strings.
7. Keep all string values EXTREMELY SHORT (max 20 characters).
8. NO REPETITIVE STRINGS or long concatenated identifiers.
9. Include a brief summary (max 100 chars) and update mutationHistory.
10. Keep it concise: max 12 events per layer.
`;
