import { useState, useRef, useEffect } from 'react'

type Step = { id: number; label: string }

export default function Stepper({ steps, active, onSelectStep }: { steps: Step[]; active: number; onSelectStep?: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // close on outside click or escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return
      const p = panelRef.current
      const b = btnRef.current
      if (p && !p.contains(e.target as Node) && b && !b.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!steps || steps.length === 0) return null

  const total = steps.length
  const current = Math.max(1, Math.min(active, total))
  const pct = Math.round((current / total) * 100)

  const toggle = () => setOpen(o => !o)

  const select = (id: number) => {
    onSelectStep?.(id)
    setOpen(false)
  }

  const snippet = (text: string) => {
    const words = String(text).split(/\s+/).filter(Boolean)
    return words.slice(0, 10).join(' ') + (words.length > 10 ? '…' : '')
  }

  return (
    <div className="mb-4 w-full flex items-center relative">
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Recipe steps: Step ${current} of ${total}`}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
          if (e.key === 'ArrowLeft') { e.preventDefault(); onSelectStep?.(Math.max(1, current - 1)) }
          if (e.key === 'ArrowRight') { e.preventDefault(); onSelectStep?.(Math.min(total, current + 1)) }
        }}
        className="relative text-sm text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-amber-300"
      >
        <div className="flex flex-col leading-none w-full">
          <span className="font-medium">Step {current} of {total}</span>
          <div className="h-1 bg-gray-100 rounded-full mt-1 w-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>

      {open && (
        <div ref={panelRef} role="menu" className="absolute z-50 mt-2 w-[min(90vw,28rem)] bg-white border rounded shadow-lg p-2">
          <div className="max-h-64 overflow-auto">
            {steps.map(s => (
              <button
                key={s.id}
                role="menuitem"
                onClick={() => select(s.id)}
                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${s.id === current ? 'bg-amber-50' : ''}`}
                title={s.label}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-800">{`Step ${s.id}`}</div>
                  <div className="text-xs text-gray-500">{snippet(s.label)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
