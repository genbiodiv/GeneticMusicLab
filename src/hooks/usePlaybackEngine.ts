import * as Tone from "tone";
import { MusicalGenome, MusicalEvent } from "../types";
import { SAMPLE_LIBRARY } from "../constants";
import { useState, useEffect, useRef } from "react";

export function usePlaybackEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const synthsRef = useRef<Map<string, any>>(new Map());

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
    };
  }, []);

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const play = async (genome: MusicalGenome) => {
    if (!isLoaded) return;
    
    try {
      stop();
      await Tone.start();
      
      // Ensure context is running
      if (Tone.context.state !== "running") {
        await Tone.context.resume();
      }

      Tone.Transport.bpm.value = genome.tempo;
      Tone.Destination.volume.value = -3;

      (genome.layers || []).forEach((layer) => {
        (layer.events || []).forEach((event) => {
          Tone.Transport.schedule((time) => {
            const synth = synthsRef.current.get(event.sampleId);
            if (synth) {
              const note = Tone.Frequency("C4").transpose(event.pitchShift).toNote();
              const gain = Math.max(event.gain || 0.5, 0.4);
              synth.triggerAttackRelease(note, event.duration, time, gain);
            }
          }, event.start);
        });
      });

      // Schedule time updates
      Tone.Transport.scheduleRepeat((time) => {
        Tone.Draw.schedule(() => {
          const now = Tone.Transport.seconds;
          setCurrentTime(now);
          if (now >= genome.durationTarget) {
            stop();
          }
        }, time);
      }, 0.05);

      Tone.Transport.seconds = 0;
      Tone.Transport.start("+0.1");
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback failed", error);
    }
  };

  return { play, stop, isPlaying, isLoaded, currentTime };
}
