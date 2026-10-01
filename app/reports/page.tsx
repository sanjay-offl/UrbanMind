'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import ReportList from '@/components/reports/report-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { generateReport } from '@/lib/api';

export default function ReportsPage() {
  const [type, setType] = useState<string>('summary');
  const [wardId, setWardId] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateReport(type, wardId ? Number(wardId) : undefined);
      toast.success('Report generation started');
      setOpen(false);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generated analytical reports for your jurisdiction"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Report type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectValue>{type}</SelectValue>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="ward">Ward</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </Select>
              </div>
              {type === 'ward' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Ward ID (optional)</label>
                  <input
                    type="number"
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    placeholder="All wards"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating…' : 'Generate'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <ReportList />
    </div>
  );
}
