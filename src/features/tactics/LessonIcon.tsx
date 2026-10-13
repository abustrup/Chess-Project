import { Castle, Crosshair, Crown, DoorOpen, GitFork, Hourglass, Lock, Magnet, Pin, ShieldAlert, ShieldOff, Split, Utensils, type LucideIcon } from 'lucide-react'

// One simple, recognisable picture per pattern. Lessons we don't know yet get a target.
const ICONS: Record<string, LucideIcon> = {
  fork: GitFork,
  'discovered-attack': DoorOpen,
  pin: Pin,
  skewer: Utensils,
  'back-rank-mate': Castle,
  'removing-the-defender': ShieldOff,
  deflection: Split,
  'trapped-piece': Lock,
  'loose-pieces': ShieldAlert,
  attraction: Magnet,
  zwischenzug: Hourglass,
  'mate-patterns': Crown,
  'fixture-fork': GitFork,
  'fixture-back-rank': Castle,
}

export default function LessonIcon({ lessonId, size = 26 }: { lessonId: string; size?: number }) {
  const Icon = ICONS[lessonId] ?? Crosshair
  return <Icon size={size} aria-hidden />
}
