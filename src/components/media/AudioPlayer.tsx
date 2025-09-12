import React, { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps {
	src: string; // blob/object URL or remote URL
	showWaveform?: boolean;
}

export function AudioPlayer({ src, showWaveform = true }: AudioPlayerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [duration, setDuration] = useState<number | null>(null);

	useEffect(() => {
		if (!showWaveform || !containerRef.current) return;
		console.debug('[AudioPlayer] create wavesurfer');
		const ws = WaveSurfer.create({
			container: containerRef.current,
			waveColor: '#a3a3a3',
			progressColor: '#3b82f6',
			height: 60,
		});
		wavesurferRef.current = ws;
		ws.load(src);
		ws.on('ready', () => { setDuration(ws.getDuration()); console.debug('[AudioPlayer] waveform ready', { duration: ws.getDuration() }); });
		ws.on('error', (e) => console.error('[AudioPlayer] waveform error', e));
		return () => { ws.destroy(); wavesurferRef.current = null; console.debug('[AudioPlayer] wavesurfer destroyed'); };
	}, [src, showWaveform]);

	useEffect(() => {
		const a = audioRef.current;
		if (!a) return;
		const onLoaded = () => console.debug('[AudioPlayer] loadedmetadata', { src, duration: a.duration });
		const onPlay = () => console.debug('[AudioPlayer] play', { src });
		const onPause = () => console.debug('[AudioPlayer] pause', { src });
		const onError = () => console.error('[AudioPlayer] error', a.error);
		a.addEventListener('loadedmetadata', onLoaded);
		a.addEventListener('play', onPlay);
		a.addEventListener('pause', onPause);
		a.addEventListener('error', onError);
		return () => {
			a.removeEventListener('loadedmetadata', onLoaded);
			a.removeEventListener('play', onPlay);
			a.removeEventListener('pause', onPause);
			a.removeEventListener('error', onError);
		};
	}, [src]);

	return (
		<div className="space-y-2">
			<audio ref={audioRef} src={src} controls className="w-full" />
			{showWaveform && <div ref={containerRef} />}
			{duration != null && (
				<div className="text-xs text-muted-foreground">Duration: {duration.toFixed(1)}s</div>
			)}
		</div>
	);
}

export default AudioPlayer;
