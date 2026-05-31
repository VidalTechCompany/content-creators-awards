'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends ImageProps {
    fallbackSrc?: string;
}

export function ImageWithFallback({
    src,
    alt,
    fallbackSrc = '/placeholder-nominee.jpg',
    ...props
}: ImageWithFallbackProps) {
    const [imgSrc, setImgSrc] = useState(src);

    // Sync internal state if the src prop changes from the parent
    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => setImgSrc(fallbackSrc)}
        />
    );
}