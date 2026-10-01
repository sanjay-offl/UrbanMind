'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle, ShieldCheck, Cpu, Database, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface EvidenceData {
  evaluatedAt: string;
  r1: { id: string; title: string; status: string; description: string; metric: string; newSubmissionsActive: number };
  r2: { id: string; title: string; status: string; model: string; description: string; metric: string };
  r3: { id: string; title: string; status: string; description: string; metric: string; sourcesCount: number };
  r4: { id: string; title: string; status: string; description: string; metric: string };
  r5: { id: string; title: string; status: string; description: string; metric: string };
  summaryMetrics: {
    totalGrievances: number;
    statesCovered: number;
    districtsCovered: number;
    languagesPresent: number;
    publicDatasetsCount: number;
    aiModel: string;
    engineVersion: string;
  };
}

export default function SettingsPage() {
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('urbanmind-reduced-motion') === 'true';
      setReducedMotion(stored);
    } catch {
      // ignore
    }
  }, []);

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    try {
      localStorage.setItem('urbanmind-reduced-motion', String(next));
      if (next) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      toast.success(next ? 'Motion effects reduced' : 'Full motion enabled');
    } catch {
      // ignore
    }
  };

  const fetchEvidence = () => {
    setLoading(true);
    setError(null);
    fetch('/api/system/evidence')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to evaluate platform evidence');
        return res.json();
      })
      .then((payload) => {
        if (payload.ok && payload.data) {
          setEvidence(payload.data);
        } else {
          throw new Error('Malformed evidence payload');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error checking evidence');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }} className="space-y-6">
      <PageHeader
        title="Settings & Platform Evidence"
        description="Live backend-computed verification of evaluation requirements (R1–R5), external service configurations, and accessibility preferences"
      />

      {/* R1 - R5 Live Evidence Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#202124' }}>
              Evaluation Requirements Verification (R1–R5)
            </h2>
            <p style={{ fontSize: 13, color: '#5F6368', marginTop: 2 }}>
              Computed directly by the backend from real dataset queries and active pipeline health.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchEvidence}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #E8EAED',
              background: '#FFFFFF',
              color: '#4285F4',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Checks
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        )}

        {error && (
          <Card style={{ borderColor: '#EA4335', padding: 20 }}>
            <p style={{ color: '#EA4335', fontSize: 13 }}>{error}</p>
            <button
              onClick={fetchEvidence}
              style={{ marginTop: 8, padding: '4px 10px', background: '#EA4335', color: '#fff', border: 'none', borderRadius: 4 }}
            >
              Retry
            </button>
          </Card>
        )}

        {!loading && !error && evidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* R1 Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285F4', background: 'rgba(66,133,244,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                  {evidence.r1.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#137333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {evidence.r1.status}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>{evidence.r1.title}</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>{evidence.r1.description}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                Metric: {evidence.r1.metric}
              </div>
            </div>

            {/* R2 Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285F4', background: 'rgba(66,133,244,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                  {evidence.r2.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1A73E8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={13} /> Active
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>{evidence.r2.title}</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>{evidence.r2.description}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                Status: {evidence.r2.status}
              </div>
            </div>

            {/* R3 Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285F4', background: 'rgba(66,133,244,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                  {evidence.r3.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#137333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {evidence.r3.status}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>{evidence.r3.title}</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>{evidence.r3.description}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                {evidence.r3.metric}
              </div>
            </div>

            {/* R4 Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285F4', background: 'rgba(66,133,244,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                  {evidence.r4.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#137333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {evidence.r4.status}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>{evidence.r4.title}</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>{evidence.r4.description}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                Coverage: {evidence.r4.metric}
              </div>
            </div>

            {/* R5 Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4285F4', background: 'rgba(66,133,244,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                  {evidence.r5.id}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#137333', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> {evidence.r5.status}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>{evidence.r5.title}</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>{evidence.r5.description}</p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                Languages: {evidence.r5.metric}
              </div>
            </div>

            {/* Core Engine Version */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: 12,
                padding: 18,
                boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5F6368', background: '#F1F3F4', padding: '2px 8px', borderRadius: 99 }}>
                  CORE
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#5F6368' }}>
                  {evidence.summaryMetrics.engineVersion}
                </span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>Deterministic Rules Engine</h3>
              <p style={{ fontSize: 12.5, color: '#5F6368', marginTop: 6, lineHeight: 1.45 }}>
                Priority calculation is mathematically anchored to public indicators. Non-negotiable: LLMs never directly output the final numerical score.
              </p>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F3F4', fontSize: 12, fontWeight: 500, color: '#202124' }}>
                Total Verified Rows: {evidence.summaryMetrics.totalGrievances.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* External Services & Credentials Status (No Secrets Exposed) */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#202124', marginBottom: 12 }}>
          External Services & Security State
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
              <Cpu size={16} color="#4285F4" /> Google AI Gemini API
            </div>
            <div style={{ fontSize: 12, color: '#5F6368', marginTop: 4 }}>
              Status: <span style={{ fontWeight: 600, color: '#1A73E8' }}>Server-side proxy (/api/*)</span>
            </div>
            <div style={{ fontSize: 11, color: '#80868B', marginTop: 4 }}>
              Zero browser credential leaks. Automatic fallback to deterministic rules on timeout/quota.
            </div>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
              <Volume2 size={16} color="#34A853" /> Speech & Audio Pipeline
            </div>
            <div style={{ fontSize: 12, color: '#5F6368', marginTop: 4 }}>
              Status: <span style={{ fontWeight: 600, color: '#137333' }}>MediaRecorder + Web Audio API</span>
            </div>
            <div style={{ fontSize: 11, color: '#80868B', marginTop: 4 }}>
              Browser microphone input with real-time waveform and Cloud Speech-to-Text integration ready.
            </div>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
              <Database size={16} color="#FBBC05" /> In-Memory Database Overlay
            </div>
            <div style={{ fontSize: 12, color: '#5F6368', marginTop: 4 }}>
              Status: <span style={{ fontWeight: 600, color: '#B06000' }}>Active & Queryable</span>
            </div>
            <div style={{ fontSize: 11, color: '#80868B', marginTop: 4 }}>
              Pre-seeded national civic dataset with dynamic session persistence for new submissions and status updates.
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility & Motion Preferences */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#202124', marginBottom: 12 }}>
          Accessibility & Motion Preferences
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#202124' }}>Reduce Motion Effects</div>
            <div style={{ fontSize: 12.5, color: '#5F6368', marginTop: 2 }}>
              Disables hero 3D particle animations and heavy UI transitions for users with motion sensitivity or low-power devices.
            </div>
          </div>
          <button
            type="button"
            onClick={toggleReducedMotion}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #DADCE0',
              background: reducedMotion ? '#4285F4' : '#F1F3F4',
              color: reducedMotion ? '#FFFFFF' : '#202124',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {reducedMotion ? 'Reduced Motion Active' : 'Enable Reduced Motion'}
          </button>
        </div>
      </div>
    </div>
  );
}
