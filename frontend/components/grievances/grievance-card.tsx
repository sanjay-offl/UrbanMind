import Link from 'next/link';
import type { Grievance } from '@/types/grievance';
import { formatScore } from '@/lib/format';
import PriorityBadge from '@/components/grievances/priority-badge';
import { Card, CardContent } from '@/components/ui/card';

export default function GrievanceCard({ grievance }: { grievance: Grievance }) {
  return (
    <Link href={`/grievances/${grievance.id}`} className="block">
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 space-y-1">
            <div className="truncate font-medium">{grievance.title}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{grievance.category}</span>
              <span>•</span>
              <span>{grievance.ward_name}</span>
            </div>
            <div>
              <PriorityBadge priority={grievance.priority} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatScore(grievance.score)}
            </div>
            <div className="text-xs text-muted-foreground">score</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
