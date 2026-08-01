'use client';

import { useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

interface RankedIssue {
  rank: number;
  summary: string;
  reason: string;
  category: string;
  ward: string | null;
  score: number;
  affected_count?: number;
}

const rankColors = [
  { bg: 'rgba(154,23,80,0.20)', color: '#EE4C7C', border: 'rgba(154,23,80,0.40)' },
  { bg: 'rgba(238,76,124,0.15)', color: '#EE4C7C', border: 'rgba(238,76,124,0.30)' },
  { bg: 'rgba(227,175,188,0.15)', color: '#E3AFBC', border: 'rgba(227,175,188,0.30)' },
  { bg: 'rgba(227,226,223,0.10)', color: '#E3E2DF', border: 'rgba(227,226,223,0.20)' },
  { bg: 'rgba(255,255,255,0.06)', color: '#E3E2DF', border: 'rgba(255,255,255,0.12)' },
];

function RankedIssueCard({ rank, item }: { rank: number; item: RankedIssue }) {
  const rc = rankColors[rank - 1] ?? rankColors[4];
  const scoreColor = rank <= 2 ? '#EE4C7C' : rank === 3 ? '#E3AFBC' : '#E3E2DF';

  return (
    <div
      className="glass"
      style={{
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: '48px 1fr auto',
        gap: 16,
        alignItems: 'center',
      }}
    >
      {/* Rank circle */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: rc.bg,
          border: `1px solid ${rc.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 500,
          fontFamily: 'var(--font-data)',
          color: rc.color,
          flexShrink: 0,
        }}
      >
        {rank}
      </div>

      {/* Content */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
          {item.summary}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 8,
            lineHeight: 1.6,
          }}
        >
          {item.reason}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {item.ward && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                background: 'rgba(227,175,188,0.15)',
                color: '#E3AFBC',
                border: '1px solid rgba(227,175,188,0.30)',
                borderRadius: 99,
              }}
            >
              {item.ward}
            </span>
          )}
          {item.category && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                background: 'rgba(154,23,80,0.15)',
                color: '#EE4C7C',
                border: '1px solid rgba(154,23,80,0.30)',
                borderRadius: 99,
              }}
            >
              {item.category}
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div
          className="font-data"
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: scoreColor,
          }}
        >
          {item.score}
        </div>
        <div className="data-label">SCORE</div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const { user, can } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileComplaintCount, setFileComplaintCount] = useState(0);
  const [pastedText, setPastedText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<RankedIssue[] | null>(null);

  if (!can('upload_complaints')) {
    return (
      <div
        style={{
          padding: '48px',
          textAlign: 'center',
          maxWidth: '480px',
          margin: '80px auto',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(154,23,80,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <i
            className="ti ti-lock"
            style={{ fontSize: '28px', color: '#EE4C7C' }}
          />
        </div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '24px',
          }}
        >
          Your role ({user?.role}) does not have permission to upload complaints.
          Contact your Admin Officer to request access.
        </p>
        <a
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #9A1750, #EE4C7C)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <i className="ti ti-arrow-left" />
          Back to Dashboard
        </a>
      </div>
    );
  }

  const complaintCount =
    inputMode === 'upload'
      ? fileComplaintCount
      : pastedText.split('\n').filter(Boolean).length;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResults(null);
      selected.text().then((content) => {
        setFileComplaintCount(
          content.split('\n').filter((l) => l.trim()).length - 1
        );
      });
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setResults(null);
      dropped.text().then((content) => {
        setFileComplaintCount(
          content.split('\n').filter((l) => l.trim()).length - 1
        );
      });
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setResults(null);
    try {
      const formData = new FormData();
      if (inputMode === 'upload' && file) {
        formData.append('file', file);
      } else {
        formData.append('text', pastedText);
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Analysis failed');
      }
      const data = await res.json();
      setResults(data.ranked_issues ?? []);
      if (data.ranked_issues?.length) {
        toast.success(`Top ${data.ranked_issues.length} issues ranked`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function downloadPDF() {
    if (!results?.length) return;
    const rows = results
      .map(
        (item, i) => `
      <div style="display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #e2e8f0">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(154,23,80,0.12);display:flex;align-items:center;justify-content:center;font-weight:700;color:#EE4C7C">${i + 1}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#0D0D0D">${item.summary}</div>
          <div style="font-size:12px;color:#475569;margin-top:4px">${item.reason}</div>
          <div style="margin-top:6px">${item.category ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:rgba(154,23,80,0.10);color:#9A1750;margin-right:6px">${item.category}</span>` : ''}${item.ward ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:rgba(227,175,188,0.20);color:#9A1750">${item.ward}</span>` : ''}</div>
        </div>
        <div style="text-align:center;font-family:monospace">
          <div style="font-size:24px;font-weight:700;color:${i < 2 ? '#EE4C7C' : i === 2 ? '#E3AFBC' : '#E3E2DF'}">${item.score}</div>
          <div style="font-size:10px;letter-spacing:0.1em;color:#94a3b8">SCORE</div>
        </div>
      </div>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><title>UrbanMind — Top 5 Priority Issues</title><style>
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;padding:40px;color:#0D0D0D}
      h1{font-size:22px;margin:0 0 4px 0}
      .sub{font-size:12px;color:#64748b;margin-bottom:24px}
      .rule{height:1px;background:#e2e8f0;margin-bottom:16px}
    </style></head><body>
      <h1>UrbanMind — Top 5 Priority Issues</h1>
      <div class="sub">Analyzed by Claude Sonnet 4.6 · ${new Date().toLocaleString()}</div>
      <div class="rule"></div>
      ${rows}
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <div className="data-label" style={{ marginBottom: 8 }}>
        Upload complaints
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          marginBottom: 4,
        }}
      >
        Complaint Analyzer
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          marginBottom: 32,
          lineHeight: 1.7,
        }}
      >
        Upload a CSV of citizen complaints or paste them directly.
        UrbanMind ranks the top 5 most urgent issues in seconds.
      </p>

      {/* Input tabs */}
      <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            background: 'rgba(255,255,255,0.05)',
            padding: 4,
            borderRadius: 8,
            width: 'fit-content',
          }}
        >
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              background:
                inputMode === 'upload' ? '#9A1750' : 'transparent',
              color:
                inputMode === 'upload' ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}
          >
            Upload CSV
          </button>
          <button
            type="button"
            onClick={() => setInputMode('paste')}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              background:
                inputMode === 'paste' ? '#9A1750' : 'transparent',
              color:
                inputMode === 'paste' ? '#FFFFFF' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}
          >
            Paste Text
          </button>
        </div>

        {inputMode === 'upload' ? (
          /* File drop zone */
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '1px dashed rgba(154,23,80,0.30)',
              borderRadius: 'var(--radius-sm)',
              padding: 48,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#EE4C7C';
              e.currentTarget.style.background = 'rgba(154,23,80,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(154,23,80,0.30)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <i
              className="ti ti-upload"
              style={{
                fontSize: 32,
                color: 'var(--rose)',
                marginBottom: 12,
                display: 'block',
              }}
            />
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Drop CSV file here or click to browse
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Columns: complaint_text, ward (optional), date (optional)
            </p>
            {file && (
              <div
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  background: 'rgba(154,23,80,0.10)',
                  border: '1px solid rgba(154,23,80,0.30)',
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <i className="ti ti-file-text" style={{ color: '#EE4C7C' }} />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        ) : (
          /* Paste textarea */
          <div>
            <label
              className="data-label"
              style={{ display: 'block', marginBottom: 8 }}
            >
              Paste complaint text (one per line)
            </label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Sewage overflow near Ward 42 school\nBroken streetlight on Anna Salai\nWater supply disrupted in Mylapore for 3 days\n...`}
              rows={10}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--input-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                lineHeight: 1.7,
                resize: 'vertical',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
                transition: 'var(--transition)',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = 'var(--accent-border)')
              }
              onBlur={(e) =>
                (e.target.style.borderColor = 'var(--glass-border)')
              }
            />
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 6,
              }}
            >
              {complaintCount} complaints entered
            </p>
          </div>
        )}

        {/* Analyze button */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing || (!file && !pastedText.trim())}
          style={{
            width: '100%',
            marginTop: 24,
            padding: 14,
            background:
              analyzing || (!file && !pastedText.trim())
                ? 'rgba(154,23,80,0.40)'
                : 'linear-gradient(135deg, #9A1750, #EE4C7C)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'white',
            fontSize: 15,
            fontWeight: 500,
            cursor: analyzing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'var(--transition)',
            boxShadow: '0 4px 20px rgba(154,23,80,0.35)',
          }}
          onMouseEnter={(e) => {
            if (!analyzing && (file || pastedText.trim())) {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #7D1241, #D43D6B)';
              e.currentTarget.style.boxShadow =
                '0 6px 28px rgba(154,23,80,0.50)';
            }
          }}
          onMouseLeave={(e) => {
            if (!analyzing && (file || pastedText.trim())) {
              e.currentTarget.style.background =
                'linear-gradient(135deg, #9A1750, #EE4C7C)';
              e.currentTarget.style.boxShadow =
                '0 4px 20px rgba(154,23,80,0.35)';
            }
          }}
        >
          {analyzing ? (
            <>
              <i
                className="ti ti-loader-2"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              Analyzing {complaintCount} complaints with Claude AI...
            </>
          ) : (
            <>
              <i className="ti ti-brain" />
              Analyze &amp; Rank Top 5 Issues
            </>
          )}
        </button>
      </div>

      {/* Results section */}
      {results && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <div>
              <div className="data-label" style={{ marginBottom: 4 }}>
                AI Analysis Complete
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 500 }}>
                Top 5 Priority Issues
              </h2>
            </div>
            <button
              type="button"
              onClick={downloadPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 13,
                background: 'var(--glass)',
                border: '1px solid rgba(154,23,80,0.25)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--rose)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(154,23,80,0.08)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'var(--glass)')
              }
            >
              <i className="ti ti-download" />
              Download PDF
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item, idx) => (
              <RankedIssueCard key={idx} rank={idx + 1} item={item} />
            ))}
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            Analyzed by Claude Sonnet 4.6 · {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}
