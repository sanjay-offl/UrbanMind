'use client';

import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { getReports, downloadReportUrl } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Report } from '@/types/report';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Report</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Download</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No reports yet
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Report #{report.id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {report.type}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{report.status}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(report.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <a href={downloadReportUrl(report.id)}>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
