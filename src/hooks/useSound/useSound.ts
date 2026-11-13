import { useCallback, useEffect } from "react";

export interface UseSoundOptions {
  /** Linear gain applied to every playback from this hook instance. Default: 1 */
  volume?: number;
  /** Fetches and decodes all sources while true. Default: true */
  preload?: boolean;
}

export interface PlayOptions {
  /** Linear gain for this playback, multiplied by the hook volume. Default: 1 */
  volume?: number;
  /** Loops the buffer until stopped. Default: false */
  loop?: boolean;
  /** Linear fade-in duration from silence, in seconds. Default: 0 */
  fadeIn?: number;
  /** Start position in seconds, or "random" for a uniformly random position within the buffer. Default: 0 */
  offset?: number | "random";
}

export interface Playback {
  /** Stops playback after a linear fade-out of `fadeOut` seconds. Idempotent. */
  stop: (fadeOut?: number) => void;
}

// Events that grant transient user activation. Touch input activates on release only, hence pointerup and touchend.
const GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"];

let context: AudioContext | null = null;
const loading = new Map<string, Promise<void>>();
const buffers = new Map<string, AudioBuffer>();

/** Creates or resumes the shared AudioContext. Must run within a user activation to satisfy autoplay policies. */
function unlock() {
  context ??= new AudioContext();
  if (context.state !== "running") context.resume().catch(() => {});
}

function listenForGestures() {
  for (const type of GESTURES) {
    // Capture phase, so the context resumes before application handlers call play().
    window.addEventListener(type, unlock, { capture: true });
  }
  return () => {
    for (const type of GESTURES) {
      window.removeEventListener(type, unlock, { capture: true });
    }
  };
}

/** Fetches and decodes a source once per URL. Decodes with an OfflineAudioContext, which requires no user activation. */
function load(url: string) {
  if (!loading.has(url)) {
    const promise = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) =>
        new OfflineAudioContext(1, 1, 44100).decodeAudioData(data),
      )
      .then((buffer) => {
        buffers.set(url, buffer);
      })
      .catch(() => {
        // Evicts the failed request so that a later call retries.
        loading.delete(url);
      });
    loading.set(url, promise);
  }
  return loading.get(url)!;
}

// Reference count of mounted hook instances sharing the gesture listeners.
let listeners = 0;
let stopListening = () => {};

/**
 * Plays named audio sources through a shared Web Audio context.
 * `play` returns null until the context is unlocked by a user activation and the source is decoded.
 *
 * @param sounds - Record of sound names to source URLs. Must be referentially stable.
 * @param options - Hook-level volume and preload control.
 * @returns `play`, which starts a playback and returns its `Playback` handle.
 */
export function useSound<Name extends string>(
  sounds: Record<Name, string>,
  options: UseSoundOptions = {},
) {
  const { volume = 1, preload = true } = options;

  useEffect(() => {
    if (listeners++ === 0) stopListening = listenForGestures();
    return () => {
      if (--listeners === 0) stopListening();
    };
  }, []);

  useEffect(() => {
    if (!preload) return;
    for (const url of Object.values<string>(sounds)) load(url);
  }, [sounds, preload]);

  const play = useCallback(
    (name: Name, playOptions: PlayOptions = {}): Playback | null => {
      const buffer = buffers.get(sounds[name]);
      if (!context || !buffer) return null;

      const now = context.currentTime;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = playOptions.loop ?? false;
      source.connect(gain).connect(context.destination);

      const level = volume * (playOptions.volume ?? 1);
      if (playOptions.fadeIn) {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(level, now + playOptions.fadeIn);
      } else {
        gain.gain.value = level;
      }

      const offset =
        playOptions.offset === "random"
          ? Math.random() * buffer.duration
          : (playOptions.offset ?? 0);
      source.start(now, offset);

      let stopped = false;
      return {
        stop(fadeOut = 0) {
          if (stopped || !context) return;
          stopped = true;
          const at = context.currentTime;
          gain.gain.cancelScheduledValues(at);
          gain.gain.setValueAtTime(gain.gain.value, at);
          gain.gain.linearRampToValueAtTime(0, at + fadeOut);
          source.stop(at + fadeOut);
        },
      };
    },
    [sounds, volume],
  );

  return { play };
}
