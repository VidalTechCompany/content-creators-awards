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
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    useEffect(() => {
        setCurrentSrc(src);
        setError(false);
    }, [src]);

    const handleError = () => {
        if (!error) {
            setError(true);
            setCurrentSrc(fallbackSrc);
        }
    };

    return (
        <Image
            {...props}
            src={currentSrc}
            alt={alt}
            onError={handleError}
            unoptimized={props.unoptimized || currentSrc === fallbackSrc}
        />
    );
}