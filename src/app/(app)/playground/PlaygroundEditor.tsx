'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Play, ChevronDown, Trash2, Clock, Cpu, Copy, Check } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const LANGS = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', starter: '// Write your code here\nconsole.log("Hello, World!");\n' },
  { id: 'typescript', label: 'TypeScript',  monaco: 'typescript', starter: '// Write your code here\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("World"));\n' },
  { id: 'python',     label: 'Python',      monaco: 'python',     starter: '# Write your code here\nprint("Hello, World!")\n' },
  { id: 'java',       label: 'Java',        monaco: 'java',       starter: 'System.out.println("Hello, World!");\n' },
  { id: 'cpp',        label: 'C++',         monaco: 'cpp',        starter: 'cout << "Hello, World!" << endl;\n' },
  { id: 'go',         label: 'Go',          monaco: 'go',         starter: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n' },
  { id: 'rust',       label: 'Rust',        monaco: 'rust',       starter: 'fn main() {\n    println!("Hello, World!");\n}\n' },
  { id: 'ruby',       label: 'Ruby',        monaco: 'ruby',       starter: 'puts "Hello, World!"\n' },
  { id: 'csharp',     label: 'C#',          monaco: 'csharp',     starter: 'using System;\nConsole.WriteLine("Hello, World!");\n' },
  { id: 'kotlin',     label: 'Kotlin',      monaco: 'kotlin',     starter: 'fun main() {\n    println("Hello, World!")\n}\n' },
]

const STORAGE_KEY = 'codex_playground'

interface Output {
  status:     string
  stdout:     string | null
  stderr:     string | null
  runtime_ms: number | null
  memory_kb:  number | null
}

export function PlaygroundEditor() {
  const [lang, setLang]       = useState('javascript')
  const [code, setCode]       = useState(LANGS[0].starter)
  const [stdin, setStdin]     = useState('')
  const [showStdin, setShowStdin] = useState(false)
  const [running, setRunning] = useState(false)
  const [output, setOutput]   = useState<Output | null>(null)
  const [copied, setCopied]   = useState(false)
  const [editorTheme, setEditorTheme] = useState('vs-dark')
  const [fontSize, setFontSize]       = useState(14)
  const codeRef = useRef(code)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { lang: l, codes } = JSON.parse(saved)
        if (l && LANGS.find(x => x.id === l)) {
          setLang(l)
          setCode(codes?.[l] ?? LANGS.find(x => x.id === l)!.starter)
        }
      }
      const settings = localStorage.getItem('codex_settings')
      if (settings) {
        const s = JSON.parse(settings)
        if (s.editorTheme) setEditorTheme(s.editorTheme)
        if (s.editorFontSize) setFontSize(s.editorFontSize)
      }
    } catch {}
  }, [])

  function persist(newLang: string, newCode: string) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const prev  = saved ? JSON.parse(saved) : { codes: {} }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lang: newLang,
        codes: { ...prev.codes, [newLang]: newCode },
      }))
    } catch {}
  }

  function switchLang(newLang: string) {
    persist(lang, codeRef.current)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const prev  = saved ? JSON.parse(saved) : { codes: {} }
      const starter = LANGS.find(l => l.id === newLang)!.starter
      setCode(prev.codes?.[newLang] ?? starter)
    } catch {
      setCode(LANGS.find(l => l.id === newLang)!.starter)
    }
    setLang(newLang)
    setOutput(null)
  }

  function handleChange(val: string | undefined) {
    const v = val ?? ''
    setCode(v)
    codeRef.current = v
    persist(lang, v)
  }

  async function run() {
    setRunning(true)
    setOutput(null)
    persist(lang, codeRef.current)
    try {
      const res = await fetch('/api/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, code: codeRef.current, stdin }),
      })
      setOutput(await res.json())
    } catch {
      setOutput({ status: 'Error', stdout: null, stderr: 'Network error', runtime_ms: null, memory_kb: null })
    } finally {
      setRunning(false)
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(codeRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const isOk = output?.status === 'Accepted' || output?.status === 'OK' || output?.stdout
  const monacoLang = LANGS.find(l => l.id === lang)?.monaco ?? 'javascript'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-700 shrink-0">
        {/* Language select */}
        <div className="relative">
          <select
            value={lang}
            onChange={e => switchLang(e.target.value)}
            className="appearance-none bg-slate-800 text-slate-200 text-xs font-bold pl-3 pr-7 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        {/* Copy */}
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
        >
          {copied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>

        {/* Clear */}
        <button
          onClick={() => { setCode(LANGS.find(l => l.id === lang)!.starter); setOutput(null) }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-all"
        >
          <Trash2 size={12} /> Reset
        </button>

        {/* Stdin toggle */}
        <button
          onClick={() => setShowStdin(s => !s)}
          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${showStdin ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        >
          stdin
        </button>

        {/* Run */}
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-md"
        >
          <Play size={12} fill="currentColor" />
          {running ? 'Running…' : 'Run'}
        </button>
      </div>

      {/* Main area: editor + output side-by-side */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <MonacoEditor
            language={monacoLang}
            theme={editorTheme}
            value={code}
            onChange={handleChange}
            options={{
              fontSize,
              minimap:        { enabled: false },
              scrollBeyondLastLine: false,
              padding:        { top: 16 },
              fontFamily:     "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures:  true,
              lineNumbers:    'on',
              tabSize:        2,
            }}
          />
          {showStdin && (
            <div className="border-t border-slate-700 bg-slate-900 px-4 py-3 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Input</p>
              <textarea
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                rows={3}
                placeholder="Enter stdin here…"
                className="w-full bg-slate-800 text-slate-200 text-xs font-mono rounded-lg border border-slate-600 px-3 py-2 resize-none focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="w-[380px] flex flex-col border-l border-slate-700 bg-slate-950 shrink-0">
          <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Output</span>
            {output && (
              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOk ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'
              }`}>
                {output.status}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {running && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                Executing…
              </div>
            )}

            {!running && !output && (
              <p className="text-slate-600 text-sm">Run your code to see output here.</p>
            )}

            {output && (
              <div className="space-y-4">
                {/* Perf */}
                {(output.runtime_ms !== null || output.memory_kb !== null) && (
                  <div className="flex gap-4 text-[11px] text-slate-500">
                    {output.runtime_ms !== null && (
                      <span className="flex items-center gap-1"><Clock size={10} /> {output.runtime_ms}ms</span>
                    )}
                    {output.memory_kb !== null && (
                      <span className="flex items-center gap-1"><Cpu size={10} /> {Math.round(output.memory_kb / 1024)}MB</span>
                    )}
                  </div>
                )}

                {/* stdout */}
                {output.stdout && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">stdout</p>
                    <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all bg-slate-900 rounded-lg px-3 py-2.5 leading-relaxed">
                      {output.stdout}
                    </pre>
                  </div>
                )}

                {/* stderr / error */}
                {output.stderr && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">stderr</p>
                    <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-all bg-slate-900 rounded-lg px-3 py-2.5 leading-relaxed">
                      {output.stderr}
                    </pre>
                  </div>
                )}

                {/* error message */}
                {output.status === 'error' && output.status && (
                  <p className="text-sm text-red-400">{(output as any).message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
