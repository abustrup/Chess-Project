import { DEFAULT_PROFILE } from '../types'
import { KEYS, readStored } from './storage'

// Tiny sound effects made on the fly with the browser's WebAudio (no audio files to download).
//
//   playSound('move')
//
// Browsers only allow sound after the person has clicked or pressed a key once, so everything stays
// silent until then. The "Sound" switch in the profile (soundOn) is respected on every call.

export type SoundName = 'move' | 'capture' | 'check' | 'castle' | 'end' | 'tick'

let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

function unlock() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  try {
    ctx = new Ctor()
    void ctx.resume()
  } catch {
    ctx = null
  }
}

if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(ev, unlock, { capture: true, passive: true })
  }
}

function isMuted(): boolean {
  return !readStored(KEYS.profile, DEFAULT_PROFILE).soundOn
}

/** A short burst of filtered noise: the "click" of a piece landing on wood. */
function clack(c: AudioContext, at: number, opts: { freq: number; q?: number; gain: number; length: number }) {
  if (!noise) {
    noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.25), c.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = c.createBufferSource()
  src.buffer = noise
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = opts.freq
  filter.Q.value = opts.q ?? 0.9
  const g = c.createGain()
  g.gain.setValueAtTime(opts.gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + opts.length)
  src.connect(filter).connect(g).connect(c.destination)
  src.start(at)
  src.stop(at + opts.length + 0.02)
}

/** A short pure tone, used for the "thud" under a move and for the check / game-end chimes. */
function tone(
  c: AudioContext,
  at: number,
  opts: { freq: number; gain: number; length: number; type?: OscillatorType; slideTo?: number },
) {
  const osc = c.createOscillator()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, at)
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, at + opts.length)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(opts.gain, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + opts.length)
  osc.connect(g).connect(c.destination)
  osc.start(at)
  osc.stop(at + opts.length + 0.02)
}

function movePiece(c: AudioContext, at: number, strength: number) {
  clack(c, at, { freq: 1500, gain: 0.55 * strength, length: 0.06 })
  tone(c, at, { freq: 190, slideTo: 110, gain: 0.5 * strength, length: 0.09 })
}

export function playSound(name: SoundName): void {
  if (!ctx || ctx.state !== 'running' || isMuted()) return
  const c = ctx
  const t = c.currentTime + 0.005
  switch (name) {
    case 'move':
      movePiece(c, t, 1)
      break
    case 'capture':
      clack(c, t, { freq: 2300, q: 0.7, gain: 0.8, length: 0.1 })
      tone(c, t, { freq: 150, slideTo: 80, gain: 0.7, length: 0.14 })
      break
    case 'castle':
      movePiece(c, t, 0.9)
      movePiece(c, t + 0.13, 1)
      break
    case 'check':
      movePiece(c, t, 1)
      tone(c, t + 0.07, { freq: 784, gain: 0.22, length: 0.16, type: 'triangle' })
      tone(c, t + 0.15, { freq: 1047, gain: 0.2, length: 0.22, type: 'triangle' })
      break
    case 'end':
      for (const [i, f] of [440, 554, 659].entries()) tone(c, t + i * 0.11, { freq: f, gain: 0.2, length: 0.9, type: 'triangle' })
      break
    case 'tick':
      tone(c, t, { freq: 1900, gain: 0.12, length: 0.035, type: 'square' })
      break
  }
}
