'use client';

import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { uploadCsv } from '@/lib/api';
import { toast } from '@/components/ui/toast';

export default function CsvUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const result = await uploadCsv(file);
      toast.success(
        `Uploaded ${result.imported ?? 0} grievances`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {fileName ? (
          <FileSpreadsheet className="h-7 w-7 text-primary" />
        ) : (
          <UploadCloud className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="font-medium">
          {uploading ? 'Uploading…' : fileName ? fileName : 'Drag & drop a CSV file here'}
        </p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Choose File'}
      </button>
    </div>
  );
}
