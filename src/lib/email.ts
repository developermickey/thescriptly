import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendCourseCompletionEmail(to: string, name: string, courseTitle: string, certUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[DEV] Course completion email for', to, '→', certUrl)
    return
  }
  await resend.emails.send({
    from:    'Codex <noreply@codex.dev>',
    to,
    subject: `🎉 You completed "${courseTitle}" — your certificate is ready!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
          <div style="font-size:48px;margin-bottom:8px">🎓</div>
          <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">Congratulations, ${name}!</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:8px">You've completed <strong>${courseTitle}</strong></p>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.6">Your certificate of completion is ready. Share it with your network to showcase your achievement.</p>
        <a href="${certUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#2563eb;color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">View Your Certificate →</a>
        <p style="color:#94a3b8;font-size:12px">Keep the momentum going — explore more courses on Codex.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#cbd5e1;font-size:11px">Codex · Learn to Code</p>
      </div>
    `,
  })
}

export async function sendWeeklyDigestEmail(
  to: string,
  name: string,
  stats: {
    problemsSolved: number
    lessonsCompleted: number
    currentStreak: number
    newBadges: string[]
    topProblem: string | null
  },
  appUrl: string
) {
  const badgesHtml = stats.newBadges.length
    ? `<p style="color:#475569;font-size:14px;">🏆 New badges earned this week: <strong>${stats.newBadges.join(', ')}</strong></p>`
    : ''

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a8a);border-radius:16px;padding:28px;text-align:center;margin-bottom:24px">
        <div style="font-size:32px;margin-bottom:6px">📊</div>
        <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0">Your Weekly Codex Report</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:6px">Here's what you accomplished this week, ${name}</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
        <div style="background:#f0fdf4;border-radius:12px;padding:16px;text-align:center;border:1px solid #bbf7d0">
          <div style="font-size:28px;font-weight:800;color:#16a34a">${stats.problemsSolved}</div>
          <div style="font-size:11px;color:#4ade80;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Problems Solved</div>
        </div>
        <div style="background:#eff6ff;border-radius:12px;padding:16px;text-align:center;border:1px solid #bfdbfe">
          <div style="font-size:28px;font-weight:800;color:#2563eb">${stats.lessonsCompleted}</div>
          <div style="font-size:11px;color:#60a5fa;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Lessons Done</div>
        </div>
        <div style="background:#fff7ed;border-radius:12px;padding:16px;text-align:center;border:1px solid #fed7aa">
          <div style="font-size:28px;font-weight:800;color:#ea580c">${stats.currentStreak}🔥</div>
          <div style="font-size:11px;color:#fb923c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Day Streak</div>
        </div>
      </div>

      ${stats.topProblem ? `<p style="color:#475569;font-size:14px;">Latest solve: <strong>${stats.topProblem}</strong></p>` : ''}
      ${badgesHtml}

      <a href="${appUrl}/dashboard" style="display:inline-block;margin:20px 0;padding:13px 28px;background:#2563eb;color:#fff;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">Continue Learning →</a>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
      <p style="color:#cbd5e1;font-size:11px">You're receiving this because you're a Codex student. <a href="${appUrl}/settings" style="color:#94a3b8;">Unsubscribe</a></p>
    </div>
  `

  if (!process.env.RESEND_API_KEY) {
    console.log('[DEV] Weekly digest for', to)
    return
  }

  await resend.emails.send({
    from:    'Codex <noreply@codex.dev>',
    to,
    subject: `📊 Your Codex week: ${stats.problemsSolved} problems solved, ${stats.currentStreak}-day streak`,
    html,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[DEV] Password reset URL for', to, '→', resetUrl)
    return
  }
  await resend.emails.send({
    from:    'Codex <noreply@codex.dev>',
    to,
    subject: 'Reset your Codex password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px">Reset your password</h2>
        <p style="color:#475569;font-size:14px;line-height:1.6">Hi ${name}, we received a request to reset your Codex password. Click the button below — this link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#2563eb;color:#fff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none">Reset Password</a>
        <p style="color:#94a3b8;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p style="color:#cbd5e1;font-size:11px">Codex · Learn to Code</p>
      </div>
    `,
  })
}
