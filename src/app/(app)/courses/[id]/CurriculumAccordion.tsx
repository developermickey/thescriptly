'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, Play, Lock, CheckCircle, Clock,
  Code2, FileText, HelpCircle,
} from 'lucide-react'

interface Lesson  { id: number; title: string; type: string; duration: number | null }
interface Module  { id: number; title: string; lessons: Lesson[] }

function lessonIcon(type: string) {
  switch (type) {
    case 'video': return <Play size={11} className="text-blue-500" />
    case 'quiz':  return <HelpCircle size={11} className="text-amber-500" />
    case 'code':  return <Code2 size={11} className="text-emerald-500" />
    default:      return <FileText size={11} className="text-slate-400" />
  }
}

export function CurriculumAccordion({
  modules, enrolled, doneIds,
}: {
  modules:  Module[]
  enrolled: boolean
  doneIds:  number[]
}) {
  const done   = new Set(doneIds)
  const [open, setOpen] = useState<number[]>(modules.length > 0 ? [modules[0].id] : [])

  function toggle(id: number) {
    setOpen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="divide-y divide-slate-100">
      {modules.map((mod, mi) => {
        const isOpen  = open.includes(mod.id)
        const modDone = mod.lessons.filter(l => done.has(l.id)).length
        const allDone = modDone === mod.lessons.length && mod.lessons.length > 0
        const modMins = mod.lessons.reduce((s, l) => s + (l.duration ?? 10), 0)

        return (
          <div key={mod.id}>
            {/* Module header */}
            <button
              onClick={() => toggle(mod.id)}
              className="w-full flex items-center gap-4 px-7 py-4 hover:bg-slate-50 transition-colors text-left group"
            >
              {/* Step badge */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                allDone ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
              }`}>
                {allDone ? <CheckCircle size={15} /> : mi + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{mod.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mod.lessons.length} lessons · ~{modMins}m
                  {modDone > 0 && !allDone && <span className="text-blue-500 ml-1.5">· {modDone}/{mod.lessons.length} done</span>}
                  {allDone && <span className="text-emerald-500 ml-1.5">· Complete ✓</span>}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Lessons */}
            {isOpen && (
              <div className="bg-slate-50/50 divide-y divide-slate-100/80 border-t border-slate-100">
                {mod.lessons.map((lesson, li) => {
                  const isDone   = done.has(lesson.id)
                  const isLocked = !enrolled && li > 0

                  if (isLocked) {
                    return (
                      <div key={lesson.id} className="flex items-center gap-4 px-7 py-3 opacity-50">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <Lock size={11} className="text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-500 font-medium truncate">{lesson.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-medium text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {lessonIcon(lesson.type)} {lesson.type}
                          </span>
                          {lesson.duration && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {lesson.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      className="flex items-center gap-4 px-7 py-3 hover:bg-blue-50/60 transition-colors group"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-emerald-100'
                          : 'bg-white border border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50'
                      }`}>
                        {isDone
                          ? <CheckCircle size={13} className="text-emerald-600" />
                          : <Play size={10} className="text-slate-400 group-hover:text-blue-500 ml-0.5" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${
                          isDone ? 'text-slate-500 line-through' : 'text-slate-700 group-hover:text-blue-700'
                        }`}>{lesson.title}</p>
                        {li === 0 && !enrolled && (
                          <span className="text-[10px] font-bold text-emerald-600">Free preview</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-slate-400 capitalize bg-white border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors">
                          {lessonIcon(lesson.type)} {lesson.type}
                        </span>
                        {lesson.duration && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {lesson.duration}m
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
