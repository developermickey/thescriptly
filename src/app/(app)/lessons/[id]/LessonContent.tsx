'use client'

import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js',         javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts',         typescript)
hljs.registerLanguage('python',     python)
hljs.registerLanguage('cpp',        cpp)
hljs.registerLanguage('java',       java)
hljs.registerLanguage('bash',       bash)
hljs.registerLanguage('shell',      bash)
hljs.registerLanguage('css',        css)
hljs.registerLanguage('html',       xml)
hljs.registerLanguage('xml',        xml)
hljs.registerLanguage('json',       json)
hljs.registerLanguage('sql',        sql)

export function LessonContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.querySelectorAll<HTMLElement>('pre code').forEach(block => {
      hljs.highlightElement(block)
      // Add copy button to each code block
      const pre = block.parentElement as HTMLPreElement
      if (pre && !pre.querySelector('.copy-btn')) {
        const lang = (block.className.match(/language-(\w+)/) ?? [])[1] ?? ''
        if (lang) {
          const label = document.createElement('span')
          label.className = 'code-lang-label'
          label.textContent = lang.toUpperCase()
          pre.appendChild(label)
        }
        const btn = document.createElement('button')
        btn.className = 'copy-btn'
        btn.textContent = 'Copy'
        btn.onclick = () => {
          navigator.clipboard.writeText(block.textContent ?? '')
          btn.textContent = 'Copied!'
          btn.classList.add('copied')
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied') }, 2000)
        }
        pre.appendChild(btn)
      }
    })
  }, [html])

  return (
    <div
      ref={ref}
      className="prose prose-lesson max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
