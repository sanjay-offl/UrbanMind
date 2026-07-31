'use client';

import Link from 'next/link';
import type { Grievance } from '@/types/grievance';
import { formatDate, formatScore } from '@/lib/format';
import PriorityBadge from '@/components/grievances/priority-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function GrievanceTable({
  grievances,
  loading,
}: {
  grievances: Grievance[];
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Ward</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && grievances.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No grievances found
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            grievances.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.id}</TableCell>
                <TableCell className="max-w-[280px]">
                  <Link
                    href={`/grievances/${g.id}`}
                    className="line-clamp-1 text-primary hover:underline"
                  >
                    {g.title}
                  </Link>
                </TableCell>
                <TableCell>{g.category}</TableCell>
                <TableCell>{g.ward_name}</TableCell>
                <TableCell>
                  <PriorityBadge priority={g.priority} />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatScore(g.score)}
                </TableCell>
                <TableCell className="capitalize">{g.status.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(g.created_at)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
