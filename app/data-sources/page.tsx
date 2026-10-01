'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type DataSourceItem } from '@/lib/services/dataSourceService';
import { ExternalLink, Database, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = () => {
    setLoading(true);
    setError(null);
    fetch('/api/data-sources')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data sources');
        return res.json();
      })
      .then((payload) => {
        if (payload.ok && payload.data?.sources) {
          setSources(payload.data.sources);
        } else {
          throw new Error('Malformed data source response');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error loading sources');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'Public data':
        return {
          bg: 'rgba(52, 168, 83, 0.12)',
          color: '#137333',
          border: 'rgba(52, 168, 83, 0.3)',
        };
      case 'Synthetic demo data':
        return {
          bg: 'rgba(251, 188, 5, 0.14)',
          color: '#B06000',
          border: 'rgba(251, 188, 5, 0.4)',
        };
      case 'Derived UrbanMind analytics':
        return {
          bg: 'rgba(66, 133, 244, 0.12)',
          color: '#1A73E8',
          border: 'rgba(66, 133, 244, 0.3)',
        };
      case 'AI generated interpretation':
        return {
          bg: 'rgba(128, 90, 213, 0.12)',
          color: '#6B46C1',
          border: 'rgba(128, 90, 213, 0.3)',
        };
      default:
        return {
          bg: '#F1F3F4',
          color: '#5F6368',
          border: '#DADCE0',
        };
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }} className="space-y-6">
      <PageHeader
        title="Data Sources & Provenance"
        description="Transparent catalogue of public datasets, synthetic demo data, derived algorithms, and AI interpretation layers"
      />

      {/* Mandatory Evaluation Notice & 4 Tag Taxonomy */}
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid #E8EAED',
          borderRadius: 12,
          padding: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(52, 168, 83, 0.12)',
              color: '#137333',
              border: '1px solid rgba(52, 168, 83, 0.3)',
            }}
          >
            Public data
          </span>
          <p style={{ fontSize: 12, color: '#5F6368', marginTop: 6, lineHeight: 1.5 }}>
            Census of India 2011, Jal Jeevan Mission, PMGSY roads, Swachh Bharat, NITI Aayog, and State Budgets.
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(251, 188, 5, 0.14)',
              color: '#B06000',
              border: '1px solid rgba(251, 188, 5, 0.4)',
            }}
          >
            Synthetic demo data
          </span>
          <p style={{ fontSize: 12, color: '#5F6368', marginTop: 6, lineHeight: 1.5 }}>
            Realistic citizen complaints generated across 36 States/UTs with fixed reproducible random seed (20240918).
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(66, 133, 244, 0.12)',
              color: '#1A73E8',
              border: '1px solid rgba(66, 133, 244, 0.3)',
            }}
          >
            Derived UrbanMind analytics
          </span>
          <p style={{ fontSize: 12, color: '#5F6368', marginTop: 6, lineHeight: 1.5 }}>
            Deterministic 0–100 urgency score, geographic hotspot clusters, and infrastructure gap indexes.
          </p>
        </div>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(128, 90, 213, 0.12)',
              color: '#6B46C1',
              border: '1px solid rgba(128, 90, 213, 0.3)',
            }}
          >
            AI generated interpretation
          </span>
          <p style={{ fontSize: 12, color: '#5F6368', marginTop: 6, lineHeight: 1.5 }}>
            Gemini structured entity extraction, language translation, and grounded assistant answers.
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {error && (
        <Card style={{ borderColor: '#EA4335', padding: 24, textAlign: 'center' }}>
          <AlertCircle style={{ color: '#EA4335', margin: '0 auto 8px', width: 32, height: 32 }} />
          <CardTitle style={{ fontSize: 16 }}>Unable to load civic intelligence</CardTitle>
          <p style={{ fontSize: 13, color: '#5F6368', marginTop: 4 }}>{error}</p>
          <button
            type="button"
            onClick={fetchSources}
            style={{
              marginTop: 14,
              padding: '8px 16px',
              background: '#4285F4',
              color: '#FFF',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </Card>
      )}

      {!loading && !error && sources.length === 0 && (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#5F6368' }}>No grievance data available for this scope.</p>
        </Card>
      )}

      {!loading && !error && sources.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {sources.map((source) => {
            const tagStyle = getTagBadge(source.tag);
            return (
              <div
                key={source.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E8EAED',
                  borderRadius: 12,
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(60,64,67,0.06)',
                  transition: 'box-shadow 150ms ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: tagStyle.bg,
                          color: tagStyle.color,
                          border: `1px solid ${tagStyle.border}`,
                        }}
                      >
                        {source.tag}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: source.status === 'Loaded' || source.status === 'Active' ? 'rgba(52,168,83,0.1)' : '#F1F3F4',
                          color: source.status === 'Loaded' || source.status === 'Active' ? '#137333' : '#5F6368',
                        }}
                      >
                        ● {source.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#202124' }}>{source.name}</h3>
                    <p style={{ fontSize: 13, color: '#5F6368', marginTop: 2 }}>{source.agency}</p>
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#4285F4',
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: 'rgba(66,133,244,0.06)',
                    }}
                  >
                    Source Documentation <ExternalLink size={12} />
                  </a>
                </div>

                <p style={{ fontSize: 13, color: '#3C4043', marginTop: 12, lineHeight: 1.5 }}>
                  {source.description}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid #F1F3F4',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: '#80868B', fontWeight: 500 }}>Licence:</span>{' '}
                    <span style={{ color: '#202124', fontWeight: 500 }}>{source.licence}</span>
                  </div>
                  <div>
                    <span style={{ color: '#80868B', fontWeight: 500 }}>Records:</span>{' '}
                    <span style={{ color: '#202124', fontWeight: 500 }}>{source.recordCount}</span>
                  </div>
                  <div>
                    <span style={{ color: '#80868B', fontWeight: 500 }}>Ingestion / Check:</span>{' '}
                    <span style={{ color: '#202124', fontWeight: 500 }}>{source.retrievalDate}</span>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#80868B', fontWeight: 500 }}>Fields utilized:</span>
                  {source.fieldsUsed.map((field) => (
                    <span
                      key={field}
                      style={{
                        fontSize: 11,
                        background: '#F8FAFC',
                        border: '1px solid #E8EAED',
                        padding: '1px 6px',
                        borderRadius: 4,
                        color: '#3C4043',
                      }}
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
