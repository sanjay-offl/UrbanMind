'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectValue } from '@/components/ui/select';

const WARDS = [
  { id: 1, name: 'Ward 1' },
  { id: 2, name: 'Ward 2' },
  { id: 3, name: 'Ward 3' },
];

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-card px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search grievances…" className="pl-9" />
      </div>
      <div className="flex items-center gap-4">
        <Select value="all" onValueChange={() => undefined}>
          <SelectValue>All Wards</SelectValue>
          <SelectItem value="all">All Wards</SelectItem>
          {WARDS.map((ward) => (
            <SelectItem key={ward.id} value={String(ward.id)}>
              {ward.name}
            </SelectItem>
          ))}
        </Select>
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          SU
        </div>
      </div>
    </header>
  );
}
