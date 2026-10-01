'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';

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
      if (!response.ok) throw new Error(data.detail || data.error || 'Submission failed');
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Citizen Grievance Intake"
        description="Submit your civic grievance in your own words, record a voice note in your native language, or attach a photo."
      />

      {receipt ? (
        <div className="civic-panel space-y-4 border-l-4 border-l-[#34A853]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#137333]">
            <CheckCircle2 size={16} /> Request Received
          </div>
          <h2 className="text-xl font-bold text-[#202124]">
            Reference #{receipt.reference_id}
          </h2>
          <p className="text-sm leading-relaxed text-[#202124]">
            {receipt.confirmation_text}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6368]">
            <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">Sector: {receipt.sector}</span>
            <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">Status: {receipt.status}</span>
            <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">Processor: {receipt.model}</span>
          </div>

          {audioUrl && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-[#5F6368] block mb-1.5">Audio Acknowledgement:</span>
              <audio controls src={audioUrl} className="w-full max-w-md" />
            </div>
          )}

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="btn-primary"
            >
              Submit another grievance
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submitComplaint} className="civic-panel space-y-5">
          <div>
            <label htmlFor="complaint-text" className="block text-xs font-semibold uppercase tracking-wider text-[#5F6368] mb-1.5">
              Describe your issue or grievance
            </label>
            <textarea
              id="complaint-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={10000}
              rows={6}
              placeholder="Tell us what is happening, where it is located, and how long it has been a problem (English, தமிழ், हिन्दी, etc.)..."
              className="w-full text-sm leading-relaxed"
            />
            {detectedLanguage && (
              <p className="mt-1.5 text-xs text-[#4285F4]">
                Detected language: {detectedLanguage}. You can review or edit the text before sending.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {recording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#EA4335] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#D93025]"
                >
                  <Square size={14} /> Stop recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={transcribing}
                  className="btn-secondary"
                >
                  <Mic size={15} className="text-[#4285F4]" />
                  {transcribing ? 'Transcribing audio…' : 'Record voice note'}
                </button>
              )}
              {transcribing && (
                <span className="text-xs text-[#5F6368] animate-pulse">
                  Converting speech to text via Gemini / Cloud Speech…
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-[#E8EAED] pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#5F6368] mb-1.5">
              Issue Photo (Optional)
            </label>
            <label
              htmlFor="issue-photo"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DADCE0] bg-[#F8FAFC] px-3.5 py-2 text-xs font-medium text-[#202124] hover:bg-[#F1F3F4]"
            >
              <ImagePlus size={16} className="text-[#5F6368]" />
              <span>{photo ? photo.name : 'Choose an issue photo'}</span>
            </label>
            <input
              id="issue-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[#FAD2CF] bg-[#FCE8E6] p-3 text-xs font-medium text-[#C5221F]">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="border-t border-[#E8EAED] pt-4">
            <button
              type="submit"
              disabled={submitting || (!text.trim() && !photo)}
              className="btn-primary"
            >
              <Send size={15} />
              {submitting ? 'Submitting to UrbanMind…' : 'Send grievance request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
