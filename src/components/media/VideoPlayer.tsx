import React, { useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// ReactPlayer has no default SSR types in Next; use dynamic and cast props
const ReactPlayer = dynamic(() => import('react-player').then(mod => mod.default as unknown as React.ComponentType<any>), { ssr: false });

interface VideoPlayerProps {
	src: string; // either remote URL (YouTube, Vimeo, etc.) or blob/object URL
	thumbnailUrl?: string;
}

export function VideoPlayer({ src, thumbnailUrl }: VideoPlayerProps) {
	const isPlatformUrl = useMemo(() => /youtube|vimeo|twitch|tiktok|dailymotion/.test(src), [src]);
	const htmlRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		if (!htmlRef.current) return;
		const v = htmlRef.current;
		const onLoaded = () => console.debug('[VideoPlayer] loadedmetadata', { src, duration: v.duration });
		const onPlay = () => console.debug('[VideoPlayer] play', { src });
		const onPause = () => console.debug('[VideoPlayer] pause', { src });
		const onError = () => console.error('[VideoPlayer] error', v.error);
		v.addEventListener('loadedmetadata', onLoaded);
		v.addEventListener('play', onPlay);
		v.addEventListener('pause', onPause);
		v.addEventListener('error', onError);
		return () => {
			v.removeEventListener('loadedmetadata', onLoaded);
			v.removeEventListener('play', onPlay);
			v.removeEventListener('pause', onPause);
			v.removeEventListener('error', onError);
		};
	}, [src]);

	if (isPlatformUrl) {
		return (
			<div className="relative" style={{ paddingTop: '56.25%' }}>
				<div className="absolute inset-0">
					<ReactPlayer
						url={src}
						width="100%"
						height="100%"
						controls
						light={thumbnailUrl || false}
						onReady={() => console.debug('[VideoPlayer] platform ready', { src })}
						onStart={() => console.debug('[VideoPlayer] platform start', { src })}
						onError={(e: any) => console.error('[VideoPlayer] platform error', e)}
					/>
				</div>
			</div>
		);
	}

	return (
		<video ref={htmlRef} src={src} controls className="w-full h-auto" poster={thumbnailUrl} />
	);
}

export default VideoPlayer;
