import { useState } from 'react';

const DEFAULT_PLACEHOLDER = 'https://placehold.co/600x400/orange/white?text=Recipe+Image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  fallbackSrc?: string;
}

/**
 * Image with lazy loading, explicit dimensions to avoid layout shift,
 * loading placeholder, and error fallback.
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallbackSrc = DEFAULT_PLACEHOLDER,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const effectiveSrc = error ? fallbackSrc : src;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-200">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-[0]" aria-hidden />
      )}
      <img
        src={effectiveSrc}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-200 ${loaded && !error ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </div>
  );
}
