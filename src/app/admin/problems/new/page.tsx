import { prisma } from '@/lib/prisma'
import { ProblemForm } from './ProblemForm'

export default async function NewProblemPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams
  const editId = edit ? parseInt(edit) : null

  const problem = editId
    ? await prisma.practiceQuestion.findUnique({ where: { id: editId } })
    : null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        {problem ? 'Edit Problem' : 'Add New Problem'}
      </h1>
      <ProblemForm problem={problem} />
    </div>
  )
}
