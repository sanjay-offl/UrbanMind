import { Bot, User, Wrench } from 'lucide-react';
import type { ChatMessage } from '@/types/agent';
import { Badge } from '@/components/ui/badge';

export default function ChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-lg border p-3 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <div className="flex items-center gap-2">
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wide">
            {isUser ? 'You' : 'Assistant'}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.toolCalls.map((tool, i) => (
              <Badge key={i} variant="outline" className="gap-1">
                <Wrench className="h-3 w-3" />
                {tool.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
