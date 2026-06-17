'use client'
import { useState, useEffect } from 'react'
import { Star, MessageSquare } from 'lucide-react'

interface Review {
  id: number
  rating: number
  review: string | null
  user: { name: string }
  updatedAt: string
}

interface RatingData {
  avg: number | null
  count: number
  reviews: Review[]
  myRating: { rating: number; review: string | null } | null
}

function StarRow({
  value, onChange, size = 20, readOnly = false,
}: {
  value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`transition-transform ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
        >
          <Star
            size={size}
            className={`transition-colors ${
              n <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function CourseRating({ courseId, enrolled }: { courseId: number; enrolled: boolean }) {
  const [data,    setData]    = useState<RatingData | null>(null)
  const [rating,  setRating]  = useState(0)
  const [review,  setReview]  = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch(`/api/courses/${courseId}/rate`)
      .then(r => r.json())
      .then((d: RatingData) => {
        setData(d)
        if (d.myRating) {
          setRating(d.myRating.rating)
          setReview(d.myRating.review ?? '')
        }
      })
  }, [courseId])

  async function submit() {
    if (!rating || saving) return
    setSaving(true)
    const res = await fetch(`/api/courses/${courseId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review }),
    })
    const updated = await res.json()
    if (res.ok) {
      setSaved(true)
      setShowForm(false)
      // Re-fetch to update average
      fetch(`/api/courses/${courseId}/rate`)
        .then(r => r.json())
        .then((d: RatingData) => setData({ ...d, myRating: { rating, review } }))
    }
    setSaving(false)
  }

  if (!data) return null

  const LABEL: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Star size={13} className="text-amber-400 fill-amber-400" /> Ratings & Reviews
      </h2>

      {/* Summary */}
      <div className="flex items-center gap-6 bg-slate-50 rounded-2xl px-6 py-5 mb-5 border border-slate-100">
        {data.avg !== null ? (
          <>
            <div className="text-center shrink-0">
              <p className="text-4xl font-extrabold text-slate-900">{data.avg.toFixed(1)}</p>
              <StarRow value={Math.round(data.avg)} size={14} readOnly />
              <p className="text-xs text-slate-400 mt-1">{data.count} review{data.count !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const cnt = data.reviews.filter(r => r.rating === star).length
                const pct = data.count > 0 ? Math.round((cnt / data.count) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3">{star}</span>
                    <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-7 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No ratings yet. Be the first!</p>
        )}
      </div>

      {/* Rate this course */}
      {enrolled && (
        <div className="mb-5">
          {!showForm && !saved ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Star size={14} /> {data.myRating ? 'Edit your rating' : 'Rate this course'}
            </button>
          ) : showForm ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">Your rating</p>
                <div className="flex items-center gap-3">
                  <StarRow value={rating} onChange={setRating} size={28} />
                  {rating > 0 && (
                    <span className="text-sm font-semibold text-amber-600">{LABEL[rating]}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 mb-2">Review (optional)</p>
                <textarea
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="What did you think of this course?"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{review.length}/500</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={!rating || saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Submit Rating'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
              <Star size={14} className="fill-emerald-500 text-emerald-500" /> Rating submitted!{' '}
              <button onClick={() => { setSaved(false); setShowForm(true) }} className="text-blue-600 underline font-normal">Edit</button>
            </div>
          )}
        </div>
      )}

      {/* Reviews list */}
      {data.reviews.length > 0 && (
        <div className="space-y-3">
          {data.reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {r.user.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.user.name}</p>
                    <StarRow value={r.rating} size={11} readOnly />
                  </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(r.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {r.review && (
                <p className="text-sm text-slate-600 leading-relaxed mt-2 flex items-start gap-1.5">
                  <MessageSquare size={12} className="text-slate-300 mt-0.5 shrink-0" />
                  {r.review}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
