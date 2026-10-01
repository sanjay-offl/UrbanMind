'use client';

import PageHeader from '@/components/layout/page-header';
import AgentChat from '@/components/agent/agent-chat';
import { useI18n } from '@/lib/i18n-context';

export default function AgentPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('assistant')}
        description="Ask the grievance intelligence assistant grounded queries across verified databases"
      />
      <div>
        <AgentChat />
      </div>
    </div>
  );
}
