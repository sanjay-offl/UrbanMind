'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Square } from 'lucide-react';

interface IntakeResponse {
  reference_id: string;
  sector: string;
  status: string;
  confirmation_text: string;
  confirmation_audio_base64: string | null;
  confirmation_audio_mime_type: string | null;
  model: string;
  demo_mode: boolean;
}

interface TranscriptResponse {
  transcript: string;
  detected_language: string;
  confidence: number;
  model: string;
  demo_mode: boolean;
}

export default function CitizenSubmitPage() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [receipt, setReceipt] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState('');

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const recordingBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        await transcribeRecording(recordingBlob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Microphone access is unavailable. Check browser permissions and try again.');
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return;
    setRecording(false);
    setTranscribing(true);
    recorderRef.current.stop();
  }

  async function transcribeRecording(blob: Blob) {
    try {
      const form = new FormData();
      form.append('file', blob, 'citizen-recording.webm');
      const response = await fetch('/api/intake/voice', { method: 'POST', body: form });
      const data = (await response.json()) as TranscriptResponse & { error?: string; detail?: string };
      if (!response.ok) throw new Error(data.detail || data.error || 'Transcription failed');
      setText((current) => current ? `${current}\n${data.transcript}` : data.transcript);
      setDetectedLanguage(data.detected_language);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  }

  async function submitComplaint(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('text', text);
      if (photo) form.append('photo', photo);
      const response = await fetch('/api/intake/complaints', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Submission failed');
      setReceipt(data as IntakeResponse);
      setText('');
      setPhoto(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  const audioUrl = receipt?.confirmation_audio_base64 && receipt.confirmation_audio_mime_type
    ? `data:${receipt.confirmation_audio_mime_type};base64,${receipt.confirmation_audio_base64}`
    : null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 'clamp(20px, 6vw, 72px) 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: 24, marginBottom: 28 }}>
          <p className="data-label" style={{ color: 'var(--rose)', marginBottom: 10 }}>UrbanMind · Citizen intake</p>
          <h1 style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 600 }}>Tell us what your community needs.</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.6 }}>
            Submit in your own words, record a voice note, or attach a photo of the issue.
          </p>
        </header>

        {receipt ? (
          <section aria-live="polite" style={{ borderLeft: '4px solid #39A983', padding: '8px 0 8px 20px' }}>
            <p className="data-label" style={{ color: '#39A983' }}>Request received</p>
            <h2 style={{ fontSize: 22, marginTop: 8 }}>Reference {receipt.reference_id}</h2>
            <p style={{ marginTop: 10, lineHeight: 1.6 }}>{receipt.confirmation_text}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
              {receipt.sector} · {receipt.status} · {receipt.model}
            </p>
            {audioUrl && <audio controls src={audioUrl} style={{ display: 'block', marginTop: 18, width: 'min(100%, 420px)' }} />}
            <button type="button" onClick={() => setReceipt(null)} style={secondaryButtonStyle}>Submit another request</button>
          </section>
        ) : (
          <form onSubmit={submitComplaint}>
            <section style={{ marginBottom: 24 }}>
              <label htmlFor="complaint-text" className="data-label" style={{ display: 'block', marginBottom: 10 }}>Your request</label>
              <textarea
                id="complaint-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={10000}
                rows={7}
                placeholder="Describe the issue and where it is happening"
                style={{ width: '100%', padding: 16, lineHeight: 1.65, resize: 'vertical', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
              />
              {detectedLanguage && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>Speech detected: {detectedLanguage}. Please review the transcript before sending.</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {recording ? (
                  <button type="button" onClick={stopRecording} style={commandButtonStyle} aria-label="Stop recording"><Square size={16} /> Stop recording</button>
                ) : (
                  <button type="button" onClick={startRecording} disabled={transcribing} style={secondaryButtonStyle} aria-label="Record a voice note"><Mic size={16} /> {transcribing ? 'Transcribing…' : 'Record voice note'}</button>
                )}
                {transcribing && <span role="status" style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Transcribing with Cloud Speech…</span>}
              </div>
            </section>

            <section style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, marginBottom: 20 }}>
              <label htmlFor="issue-photo" className="data-label" style={{ display: 'block', marginBottom: 10 }}>Photo (optional)</label>
              <label htmlFor="issue-photo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
                <ImagePlus size={18} /> {photo ? photo.name : 'Choose an issue photo'}
              </label>
              <input id="issue-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} style={{ display: 'none' }} />
            </section>

            {error && <p role="alert" style={{ color: '#EE4C7C', marginBottom: 16 }}>{error}</p>}
            <button type="submit" disabled={submitting || (!text.trim() && !photo)} style={{ ...commandButtonStyle, minWidth: 180, opacity: submitting || (!text.trim() && !photo) ? 0.55 : 1 }}>
              <Send size={16} /> {submitting ? 'Sending…' : 'Send request'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

const commandButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  padding: '11px 16px', border: 0, borderRadius: 6, background: '#9A1750',
  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
  padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 6,
  background: 'transparent', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
};