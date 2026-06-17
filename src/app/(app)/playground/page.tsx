import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PlaygroundEditor } from './PlaygroundEditor'

export const metadata = { title: 'Code Playground · Codex' }

export default async function PlaygroundPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return <PlaygroundEditor />
}
