import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  color?: string;
  className?: string;
}

export function UserAvatar({
  src,
  name,
  size = 32,
  color = '#4f46e5',
  className,
}: UserAvatarProps) {
  const initials =
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  if (src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 overflow-hidden rounded-full ${className || ''}`}
      >
        <Image
          src={src}
          alt={name || ''}
          fill
          className="object-cover"
          sizes={`${size}px`}
          unoptimized={src.includes('googleusercontent')}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, backgroundColor: color }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none ${className || ''}`}
    >
      <span style={{ fontSize: `${Math.max(size * 0.35, 10)}px` }}>{initials}</span>
    </div>
  );
}
