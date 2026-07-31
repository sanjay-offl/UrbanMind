import { Badge } from '@/components/ui/badge';
import type { Priority } from '@/types/grievance';

const PRIORITY_VARIANT: Record<Priority, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  critical: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]} className="capitalize">
      {priority}
    </Badge>
  );
}
