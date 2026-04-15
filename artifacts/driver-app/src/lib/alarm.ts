let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playBeep(ctx: AudioContext, startTime: number, freq: number, duration: number, gain: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playAlarm(urgent = false) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    if (urgent) {
      const pattern = [
        { freq: 880, dur: 0.15, gap: 0.08 },
        { freq: 1046, dur: 0.15, gap: 0.08 },
        { freq: 880, dur: 0.15, gap: 0.08 },
        { freq: 1046, dur: 0.25, gap: 0.25 },
        { freq: 880, dur: 0.15, gap: 0.08 },
        { freq: 1046, dur: 0.15, gap: 0.08 },
        { freq: 880, dur: 0.15, gap: 0.08 },
        { freq: 1046, dur: 0.4, gap: 0 },
      ];
      let t = now + 0.05;
      for (const p of pattern) {
        playBeep(ctx, t, p.freq, p.dur, 0.6);
        t += p.dur + p.gap;
      }
    } else {
      playBeep(ctx, now + 0.05, 880, 0.2, 0.5);
      playBeep(ctx, now + 0.35, 880, 0.2, 0.5);
      playBeep(ctx, now + 0.65, 1046, 0.35, 0.5);
    }
  } catch {
  }
}

export function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
  } catch {}
}
