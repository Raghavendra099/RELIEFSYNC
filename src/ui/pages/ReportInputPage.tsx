import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { processReportAi } from '../../lib/ai'
import { attachAiOutput, createReport } from '../../lib/store'
import type { GeoPointLite } from '../../lib/types'

type SpeechRecognitionLike = new () => any

function getSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionLike
    webkitSpeechRecognition?: SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

async function getBrowserLocation(): Promise<GeoPointLite> {
  const fallback = { lat: 12.9716, lng: 77.5946 }
  if (!navigator.geolocation) return fallback

  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 6000 },
    )
  })
}

export function ReportInputPage() {
  const qc = useQueryClient()
  const nav = useNavigate()

  const [reporterName, setReporterName] = useState('')
  const [language, setLanguage] = useState('en')
  const [rawText, setRawText] = useState('')
  const [isListening, setIsListening] = useState(false)

  const hasSpeech = useMemo(() => !!getSpeechRecognition(), [])

  const submitM = useMutation({
    mutationFn: async () => {
      const location = await getBrowserLocation()
      const report = await createReport({
        source: isListening ? 'voice' : 'manual',
        reporterName: reporterName || undefined,
        language,
        rawText,
        location,
      })

      const ai = await processReportAi({ rawText, language })
      await attachAiOutput(report.id, ai)
      return { reportId: report.id }
    },
    onSuccess: async ({ reportId }) => {
      await qc.invalidateQueries({ queryKey: ['reports'] })
      nav(`/assignment/${reportId}`)
    },
  })

  function startVoice() {
    const SR = getSpeechRecognition()
    if (!SR) return

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = language || 'en-IN'

    rec.onresult = (e: any) => {
      let full = ''
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0]?.transcript ?? ''
      }
      setRawText(full.trim())
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => setIsListening(false)

    setIsListening(true)
    rec.start()
  }

  function stopVoice() {
    // Browser API stops via UI/mic revoke; keep this as a UX toggle only.
    setIsListening(false)
  }

  async function onUpload(file: File) {
    const text = await file.text()
    setRawText((prev) => (prev ? `${prev}\n\n${text}` : text))
  }

  return (
    <>
      <div className="pageHeader">
        <div>
          <h2>Report input</h2>
          <p>Text / voice / file upload → Gemini classification → urgency score.</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="row">
            <div style={{ flex: 1 }}>
              <label className="muted">Reporter name (optional)</label>
              <input
                className="input"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="NGO field officer / volunteer"
              />
            </div>
            <div style={{ width: 160 }}>
              <label className="muted">Language</label>
              <select
                className="select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <label className="muted">Field report</label>
          <textarea
            className="textarea"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Example: 'Flood near market road. Two people injured, need medical help and clean water ASAP.'"
          />

          <div style={{ height: 12 }} />

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              {hasSpeech ? (
                isListening ? (
                  <button className="btn btnDanger" type="button" onClick={stopVoice}>
                    Stop voice
                  </button>
                ) : (
                  <button className="btn" type="button" onClick={startVoice}>
                    Start voice
                  </button>
                )
              ) : (
                <span className="muted">Voice input not supported in this browser.</span>
              )}

              <label className="btn" style={{ cursor: 'pointer' }}>
                Upload CSV/text
                <input
                  type="file"
                  accept=".csv,.txt"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onUpload(f)
                  }}
                />
              </label>
            </div>

            <button
              className="btn btnPrimary"
              type="button"
              disabled={!rawText.trim() || submitM.isPending}
              onClick={() => submitM.mutate()}
            >
              {submitM.isPending ? 'Processing…' : 'Process & continue'}
            </button>
          </div>

          {submitM.isError ? (
            <p className="muted" style={{ color: 'var(--danger)', marginTop: 12 }}>
              {(submitM.error as Error)?.message ?? 'Failed to process report.'}
            </p>
          ) : null}
        </div>

        <div className="card">
          <h3 style={{ margin: 0, fontSize: 14 }}>What gets generated</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            - Need categories (food/medical/shelter…)<br />
            - Urgency score (0–100)<br />
            - Short summary for coordinators
          </p>
          <div style={{ height: 14 }} />
          <div className="listItem">
            <div className="muted">Tip</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Add signals like “injured”, “trapped”, “no water”, “ASAP” to see urgency increase.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

