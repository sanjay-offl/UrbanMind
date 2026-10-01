'use client';

import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  href = '/dashboard',
  className = '',
}: BrandLogoProps) {
  // Height 40px for standard layout
  const dimension = size === 'sm' ? 32 : size === 'lg' ? 56 : 40;

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official UrbanMind Logo - object-fit: contain, dark mode on rounded var(--surface) chip */}
      <div
        style={{ width: `${dimension}px`, height: `${dimension}px` }}
        className="relative shrink-0 flex items-center justify-center rounded-lg bg-[var(--surface)] border border-[var(--border)] p-1 shadow-sm"
      >
        <Image
          src="/image.png"
          alt="UrbanMind Logo"
          width={dimension}
          height={dimension}
          priority
          unoptimized
          referrerPolicy="no-referrer"
          className="object-contain"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-heading text-[18px] font-bold leading-tight tracking-tight text-[var(--text)]">
            UrbanMind
          </span>
          {showTagline && (
            <span className="text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
              From Citizen Voice to National Priorities
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center no-underline hover:opacity-95">
      {content}
    </Link>
  );
}
