import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { MusicalGenome, MutationType } from "../types";
import { INITIAL_GENOME_PROMPT, MUTATION_PROMPT, DEFAULT_GENOME } from "../constants";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const GENOME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    genomeId: { type: Type.STRING, description: "Short unique ID, e.g., 'gen-001'" },
    parentId: { type: Type.STRING, description: "ID of the parent genome" },
    rootAncestorId: { type: Type.STRING, description: "ID of the root ancestor" },
    durationTarget: { type: Type.NUMBER },
    tempo: { type: Type.NUMBER },
    timeSignature: { type: Type.STRING, description: "e.g., '4/4'" },
    generation: { type: Type.NUMBER },
    layers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          layerId: { type: Type.STRING, description: "Short ID, e.g., 'L1'" },
          role: { type: Type.STRING, description: "One word role: 'drums', 'bass', 'melody', or 'pad'" },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                eventId: { type: Type.STRING, description: "Short ID, e.g., 'e1'" },
                sampleId: { type: Type.STRING },
                start: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                gain: { type: Type.NUMBER },
                pitchShift: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    },
    mutationHistory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          target: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    },
    summary: { type: Type.STRING }
  },
  required: ["genomeId", "rootAncestorId", "durationTarget", "tempo", "layers", "mutationHistory", "summary", "generation"]
};

export async function generateInitialGenome(): Promise<MusicalGenome> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: INITIAL_GENOME_PROMPT }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: GENOME_SCHEMA,
        maxOutputTokens: 2048,
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    // Clean potential markdown if AI ignores responseMimeType
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText) as MusicalGenome;
  } catch (e) {
    console.warn("Failed to generate initial genome with AI, using default fallback.", e);
    return { ...DEFAULT_GENOME, genomeId: `default_${Date.now()}` };
  }
}

export async function mutateGenome(
  genome: MusicalGenome, 
  mutationRate: number, 
  intensity: "conservative" | "radical"
): Promise<MusicalGenome> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: MUTATION_PROMPT(genome, mutationRate, intensity) }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: GENOME_SCHEMA,
        maxOutputTokens: 2048,
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    let newGenome: MusicalGenome;
    const cleanText = text.replace(/```json|```/g, "").trim();
    newGenome = JSON.parse(cleanText) as MusicalGenome;
    
    // Ensure IDs are unique and parentage is correct if AI missed it
    newGenome.parentId = genome.genomeId;
    newGenome.rootAncestorId = genome.rootAncestorId;
    newGenome.generation = (genome.generation || 0) + 1;
    newGenome.genomeId = `g_${Date.now()}`;
    
    return newGenome;
  } catch (e) {
    console.warn("Failed to mutate genome with AI, returning original with minor timestamp change.", e);
    return {
      ...genome,
      genomeId: `g_${Date.now()}`,
      parentId: genome.genomeId,
      generation: (genome.generation || 0) + 1,
      summary: `${genome.summary} (Mutation failed, preserved state)`
    };
  }
}
