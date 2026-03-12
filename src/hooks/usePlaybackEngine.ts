import * as Tone from "tone";
import { MusicalGenome, MusicalEvent } from "../types";
import { SAMPLE_LIBRARY } from "../constants";
import { useState, useEffect, useRef } from "react";

export function usePlaybackEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const synthsRef = useRef<Map<string, any>>(new Map());
  const partRef = useRef<Tone.Part | null>(null);

  useEffect(() => {
    // Initialize synths based on library
    const initSynths = () => {
      SAMPLE_LIBRARY.forEach((item) => {
        let synth: any;
        
        switch (item.synthType) {
          case "membrane":
            synth = new Tone.MembraneSynth().toDestination();
            break;
          case "metal":
            synth = new Tone.MetalSynth({
              envelope: { attack: 0.001, decay: 0.1, release: 0.1 }
            }).toDestination();
            break;
          case "mono":
            synth = new Tone.MonoSynth({
              oscillator: { type: "sine" },
              envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
            }).toDestination();
            break;
          case "poly":
            synth = new Tone.PolySynth(Tone.Synth).toDestination();
            break;
          case "fm":
            synth = new Tone.FMSynth().toDestination();
            break;
          default:
            synth = new Tone.Synth().toDestination();
        }
        
        synthsRef.current.set(item.id, synth);
      });
      setIsLoaded(true);
    };

    initSynths();

    return () => {
      synthsRef.current.forEach(s => s.dispose());
      partRef.current?.dispose();
    };
  }, []);

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    partRef.current?.dispose();
    partRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const play = async (genome: MusicalGenome) => {
    if (!isLoaded) return;
    
    try {
      stop();
      await Tone.start();
      if (Tone.context.state !== "running") {
        await Tone.context.resume();
      }

      const events: any[] = [];
    (genome.layers || []).forEach((layer) => {
      (layer.events || []).forEach((event) => {
        events.push({
          time: Number(event.start),
          sampleId: event.sampleId,
          duration: Number(event.duration),
          gain: Number(event.gain),
          pitchShift: Number(event.pitchShift),
        });
      });
    });

    partRef.current = new Tone.Part((time, value) => {
      const synth = synthsRef.current.get(value.sampleId);
      if (synth) {
        // Map pitchShift to MIDI note (0 = C4)
        const note = Tone.Frequency("C4").transpose(value.pitchShift).toNote();
        const gain = Math.max(value.gain || 0.5, 0.4); // Ensure minimum audibility
        
        if (synth instanceof Tone.PolySynth) {
          synth.triggerAttackRelease(note, value.duration, time, gain);
        } else if (synth instanceof Tone.MembraneSynth || synth instanceof Tone.MetalSynth) {
          synth.triggerAttackRelease(note, value.duration, time, gain);
        } else {
          (synth as any).triggerAttackRelease(note, value.duration, time, gain);
        }
      }
    }, events).start(0);

    Tone.Transport.bpm.value = genome.tempo;
    Tone.Destination.volume.value = -3; // Set to -3dB to avoid clipping
    Tone.Transport.start("+0.1");
    setIsPlaying(true);

    // Update current time
    const interval = setInterval(() => {
      setCurrentTime(Tone.Transport.seconds);
      if (Tone.Transport.seconds >= genome.durationTarget) {
        stop();
        clearInterval(interval);
      }
    }, 100);
    } catch (error) {
      console.error("Audio playback failed", error);
    }
  };

  return { play, stop, isPlaying, isLoaded, currentTime };
}
