'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string; size: number
  rotation: number; rotationSpeed: number
  opacity: number; life: number
}

const COLORS = ['#3b82f6','#8b5cf6','#f59e0b','#10b981','#ec4899','#f97316']

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    // Spawn 160 particles
    particles.current = Array.from({ length: 160 }, () => ({
      x:             Math.random() * canvas.width,
      y:             -10,
      vx:            (Math.random() - 0.5) * 6,
      vy:            Math.random() * 4 + 2,
      color:         COLORS[Math.floor(Math.random() * COLORS.length)],
      size:          Math.random() * 8 + 4,
      rotation:      Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity:       1,
      life:          1,
    }))

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.current = particles.current.filter(p => p.opacity > 0.05)

      for (const p of particles.current) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.12   // gravity
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height * 0.7) p.opacity -= 0.02

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
    />
  )
}
