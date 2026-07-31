'use client';

import PageHeader from '@/components/layout/page-header';
import CsvUploader from '@/components/upload/csv-uploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLUMNS = [
  'title',
  'description',
  'category',
  'ward_id',
  'lat',
  'lng',
  'created_at',
];

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Upload Data"
        description="Bulk upload grievances from a CSV file"
      />
      <CsvUploader />
      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Upload a CSV file with the following columns:
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {COLUMNS.map((col) => (
              <li
                key={col}
                className="rounded-md border bg-muted px-3 py-1.5 font-mono text-xs"
              >
                {col}
              </li>
            ))}
          </ul>
          <p className="pt-2 text-muted-foreground">
            <span className="font-medium text-foreground">title</span> and{' '}
            <span className="font-medium text-foreground">description</span> are required.
            Category should match one of the known categories (e.g. Roads &amp; Infrastructure,
            Water Supply, Sanitation &amp; Waste). Coordinates are WGS84 decimal degrees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
