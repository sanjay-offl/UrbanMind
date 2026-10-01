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
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 34, height: 34 },
    lg: { width: 44, height: 44 },
  }[size];

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        <Image
          src="/urbanmind_light_logo.png"
          alt="UrbanMind Logo"
          width={iconDimensions.width}
          height={iconDimensions.height}
          priority
          className="object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-[17px] font-bold leading-tight tracking-tight text-[#202124]">
            UrbanMind
          </span>
          {showTagline && (
            <span className="text-[11px] font-medium tracking-wide text-[#5F6368]">
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
