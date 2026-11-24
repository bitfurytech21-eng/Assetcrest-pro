import React from 'react';

interface NextImageShimProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority: _priority,
  unoptimized: _unoptimized,
  quality: _quality,
  style,
  className,
  ...rest
}: NextImageShimProps) {
  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    : {};

  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={{ ...fillStyle, ...style }}
      className={className}
      {...rest}
    />
  );
}
