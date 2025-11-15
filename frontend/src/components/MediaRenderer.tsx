import React from 'react';

interface MediaRendererProps {
    url: string;
    alt: string;
    className?: string;
}

const MediaRenderer: React.FC<MediaRendererProps> = ({ url, alt, className = '' }) => {
    if (url.includes('/video/')) {
        return (
            <video controls className={`w-full ${className}`} src={url} title={alt}>
                Your browser does not support the video tag.
            </video>
        );
    }
    if (url.includes('/raw/')) { // We assume 'raw' is for audio
        return (
            <audio controls className={`w-full ${className}`} src={url} title={alt}>
                Your browser does not support the audio element.
            </audio>
        );
    }
    return (
        <img src={url} alt={alt} className={`w-full object-contain ${className}`} />
    );
};

export default MediaRenderer;