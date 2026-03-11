/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MutationType {
  SNP = "SNP",
  INSERTION = "INSERTION",
  DELETION = "DELETION",
  DUPLICATION = "DUPLICATION",
  INVERSION = "INVERSION",
  TRANSLOCATION = "TRANSLOCATION",
  REGULATORY = "REGULATORY",
  RECOMBINATION = "RECOMBINATION"
}

export interface SampleLibraryItem {
  id: string;
  name: string;
  synthType: "membrane" | "metal" | "mono" | "poly" | "fm";
  role: "percussion" | "bass" | "melody" | "pad" | "fx";
  category: string;
}

export interface MusicalEvent {
  eventId: string;
  sampleId: string;
  start: number; // in seconds
  duration: number; // in seconds
  gain: number; // 0 to 1
  pitchShift: number; // in semitones
}

export interface MusicalLayer {
  layerId: string;
  role: string;
  events: MusicalEvent[];
}

export interface RegulatoryRule {
  ruleId: string;
  targetLayer: string;
  parameter: "gain" | "pitch" | "playbackRate";
  startTime: number;
  endTime: number;
  value: number;
}

export interface MutationEvent {
  type: MutationType;
  target: string;
  from?: any;
  to?: any;
  description: string;
}

export interface MusicalGenome {
  genomeId: string;
  parentId: string | null;
  rootAncestorId: string;
  durationTarget: number;
  tempo: number;
  timeSignature: string;
  layers: MusicalLayer[];
  regulatoryRules: RegulatoryRule[];
  mutationHistory: MutationEvent[];
  summary: string;
  generation: number;
}

export interface LineageNode {
  genome: MusicalGenome;
  children: LineageNode[];
}
