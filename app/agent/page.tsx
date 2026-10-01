'use client';

import PageHeader from '@/components/layout/page-header';
import AgentChat from '@/components/agent/agent-chat';

export default function AgentPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <PageHeader
        title="AI Agent"
        description="Ask the grievance intelligence assistant anything"
      />
      <div className="flex-1 overflow-hidden">
        <AgentChat />
      </div>
    </div>
  );
}
