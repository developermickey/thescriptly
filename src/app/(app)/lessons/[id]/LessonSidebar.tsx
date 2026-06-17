'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, ChevronDown, ChevronUp, BookOpen, Lock } from 'lucide-react'

interface LessonItem {
  id: number
  title: string
  duration: number | null
}

interface ModuleItem {
  id: number
  title: string
  lessons: LessonItem[]
}

interface Props {
  modules: ModuleItem[]
  doneIds: number[]
  currentLessonId: number
  courseId: number
  enrolled: boolean
}

export function LessonSidebar({ modules, doneIds, currentLessonId, courseId, enrolled }: Props) {
  const done = new Set(doneIds)
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
  const totalDone    = doneIds.length
  const pct          = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  // Start with the current lesson's module open
  const currentModuleId = modules.find(m => m.lessons.some(l => l.id === currentLessonId))?.id
  const [openModules, setOpenModules] = useState<Set<number>>(new Set(currentModuleId ? [currentModuleId] : []))

  function toggle(id: number) {
    setOpenModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 shrink-0">
        <Link href={`/courses/${courseId}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
          ← Back to course
        </Link>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500">{totalDone}/{totalLessons} lessons</span>
            <span className="text-xs font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto">
        {modules.map((mod, mi) => {
          const isOpen     = openModules.has(mod.id)
          const modDone    = mod.lessons.filter(l => done.has(l.id)).length
          const allDone    = modDone === mod.lessons.length && mod.lessons.length > 0

          return (
            <div key={mod.id} className="border-b border-slate-50">
              <button
                onClick={() => toggle(mod.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  allDone ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-700'
                }`}>
                  {allDone ? <CheckCircle size={12} /> : mi + 1}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-700 truncate">{mod.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{modDone}/{mod.lessons.length} done</p>
                </div>
                {isOpen ? <ChevronUp size={13} className="text-slate-400 shrink-0" /> : <ChevronDown size={13} className="text-slate-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="bg-slate-50/60">
                  {mod.lessons.map((lesson, li) => {
                    const isDone    = done.has(lesson.id)
                    const isCurrent = lesson.id === currentLessonId
                    const locked    = !enrolled && li > 0

                    return locked ? (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-2.5 opacity-50">
                        <Lock size={11} className="text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 truncate">{lesson.title}</p>
                      </div>
                    ) : (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 border-r-2 border-blue-600'
                            : 'hover:bg-white'
                        }`}
                      >
                        {isDone
                          ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                          : <Circle size={13} className={`shrink-0 ${isCurrent ? 'text-blue-500' : 'text-slate-300'}`} />}
                        <span className={`text-xs truncate ${
                          isCurrent ? 'font-bold text-blue-700' : isDone ? 'text-slate-500' : 'text-slate-700'
                        }`}>
                          {lesson.title}
                        </span>
                        {lesson.duration && (
                          <span className="text-[10px] text-slate-300 shrink-0 ml-auto">{lesson.duration}m</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
