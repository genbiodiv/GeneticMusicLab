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
    },
    {
      layerId: "melody",
      role: "melody",
      events: [
        { eventId: "m1", sampleId: "lead_01", start: 0.25, duration: 0.25, gain: 0.5, pitchShift: 0 },
        { eventId: "m2", sampleId: "lead_01", start: 1.25, duration: 0.25, gain: 0.5, pitchShift: 4 },
        { eventId: "m3", sampleId: "lead_01", start: 2.25, duration: 0.25, gain: 0.5, pitchShift: 7 },
        { eventId: "m4", sampleId: "lead_01", start: 3.25, duration: 0.25, gain: 0.5, pitchShift: 5 },
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

