import { OrbionMark } from './OrbionMark'

interface MachineNode {
  name: string
  kind: 'Tailscale' | 'SSH' | 'Direct'
  /** health dot color token */
  health: 'accent' | 'blue' | 'warm'
  pulse?: boolean
  /** angle on the ring, degrees */
  angle: number
}

const INNER: MachineNode[] = [
  { name: 'vm-berlin', kind: 'Tailscale', health: 'accent', angle: 20 },
  { name: 'homelab-01', kind: 'SSH', health: 'accent', angle: 150 },
  { name: 'mac-studio', kind: 'Direct', health: 'blue', angle: 265 },
]

const OUTER: MachineNode[] = [
  { name: 'vm-oslo', kind: 'Tailscale', health: 'accent', angle: 75 },
  { name: 'build-box', kind: 'SSH', health: 'warm', pulse: true, angle: 200 },
  { name: 'pi-cluster', kind: 'Tailscale', health: 'accent', angle: 320 },
]

const HEALTH_CLASS: Record<MachineNode['health'], string> = {
  accent: 'bg-accent',
  blue: 'bg-blue',
  warm: 'bg-warm',
}

function Node({ node, radius }: { node: MachineNode; radius: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 h-0 w-0"
      style={{
        transform: `rotate(${node.angle}deg) translateX(${radius}px)`,
      }}
    >
      {/* Counter-rotation keeps the chip upright while the ring spins. */}
      <div
        className="orbit-counter"
        style={{ ['--angle' as string]: `${node.angle}deg` }}
      >
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-elevated py-1.5 pl-2.5 pr-3">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_CLASS[node.health]} ${
              node.pulse ? 'animate-pulse' : ''
            }`}
          />
          <span className="font-mono text-[11px] leading-none text-text">
            {node.name}
          </span>
          <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.08em] text-text-muted">
            {node.kind}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * The fleet, drawn as what the name promises: machines in orbit around one
 * control plane. A topology diagram, not a screenshot. Rings drift slowly;
 * everything freezes under prefers-reduced-motion.
 */
export function OrbitDiagram() {
  return (
    <div className="relative flex h-[360px] w-full items-center justify-center sm:h-[460px] lg:h-[560px]">
      <div className="absolute h-[560px] w-[560px] scale-[0.58] sm:scale-75 lg:scale-100">
        {/* Ring guides */}
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-subtle" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-subtle/60" />

        {/* Inner orbit */}
        <div className="orbit-spin absolute inset-0">
          {INNER.map((n) => (
            <Node key={n.name} node={n} radius={170} />
          ))}
        </div>

        {/* Outer orbit, opposite direction */}
        <div className="orbit-spin-slow absolute inset-0">
          {OUTER.map((n) => (
            <Node key={n.name} node={n} radius={260} />
          ))}
        </div>

        {/* Core: double-bezel tile */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[22px] border border-line-subtle bg-panel/70 p-1.5">
          <div className="flex flex-col items-center gap-2 rounded-[16px] border border-line bg-sidebar px-7 py-6">
            <OrbionMark className="h-10 w-10" />
            <span className="font-mono text-xs font-semibold tracking-tight text-text">
              orbion
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
