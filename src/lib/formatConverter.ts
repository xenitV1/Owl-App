// @ts-nocheck
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Singleton FFmpeg loader to avoid multiple loads
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadingPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
	if (ffmpegInstance) return ffmpegInstance;
	if (!ffmpegLoadingPromise) {
		ffmpegLoadingPromise = (async () => {
			const ffmpeg = new FFmpeg();
			ffmpeg.on('log', ({ message }) => {
				// Optional: handle logs if needed
			});
			await ffmpeg.load();
			ffmpegInstance = ffmpeg;
			return ffmpeg;
		})();
	}
	return ffmpegLoadingPromise;
}

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'image/svg+xml';
export type AllowedVideoType = 'video/mp4' | 'video/webm' | 'video/avi' | 'video/quicktime'; // quicktime for MOV
export type AllowedAudioType = 'audio/mpeg' | 'audio/wav' | 'audio/ogg' | 'audio/aac';

export interface ValidationLimits {
	maxImageBytes: number; // default 10MB
	maxVideoBytes: number; // default 100MB
	maxAudioBytes: number; // default 50MB
}

export const defaultValidationLimits: ValidationLimits = {
	maxImageBytes: 10 * 1024 * 1024,
	maxVideoBytes: 100 * 1024 * 1024,
	maxAudioBytes: 50 * 1024 * 1024,
};

export function validateFile(file: File, kind: 'image' | 'video' | 'audio', limits: ValidationLimits = defaultValidationLimits): string | null {
	if (kind === 'image') {
		const allowed: AllowedImageType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
		if (!allowed.includes(file.type as AllowedImageType)) return 'Unsupported image format';
		if (file.size > limits.maxImageBytes) return 'Image file exceeds 10MB limit';
	}
	if (kind === 'video') {
		const allowed: AllowedVideoType[] = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];
		if (!allowed.includes(file.type as AllowedVideoType)) return 'Unsupported video format';
		if (file.size > limits.maxVideoBytes) return 'Video file exceeds 100MB limit';
	}
	if (kind === 'audio') {
		const allowed: AllowedAudioType[] = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'];
		if (!allowed.includes(file.type as AllowedAudioType)) return 'Unsupported audio format';
		if (file.size > limits.maxAudioBytes) return 'Audio file exceeds 50MB limit';
	}
	return null;
}

export async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> {
	// SVG should not be rasterized here
	if (file.type === 'image/svg+xml') return file;
	const img = document.createElement('img');
	const src = URL.createObjectURL(file);
	try {
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = reject;
			img.src = src;
		});
		const canvas = document.createElement('canvas');
		const scale = Math.min(1, maxWidth / img.width);
		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas not supported');
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		const type = file.type === 'image/gif' ? 'image/webp' : file.type; // re-encode GIF to WebP by default
		return await new Promise((resolve) => canvas.toBlob(b => resolve(b || file), type, quality));
	} finally {
		URL.revokeObjectURL(src);
	}
}

export async function mp4ToMp3(file: File): Promise<Blob> {
	const ffmpeg = await getFFmpeg();
	const inputName = 'input.mp4';
	const outputName = 'output.mp3';
	await ffmpeg.writeFile(inputName, await fetchFile(file));
	await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', '-ab', '192k', outputName]);
	const data = await ffmpeg.readFile(outputName);
	await ffmpeg.deleteFile(inputName);
	await ffmpeg.deleteFile(outputName);
	return new Blob([data], { type: 'audio/mpeg' });
}

export async function generateVideoThumbnail(fileOrUrl: File | string, timeSeconds = 1): Promise<Blob> {
	const ffmpeg = await getFFmpeg();
	const inputName = typeof fileOrUrl === 'string' ? 'input.mp4' : fileOrUrl.name;
	const outputName = 'thumb.jpg';
	if (typeof fileOrUrl === 'string') {
		const res = await fetch(fileOrUrl);
		const buf = new Uint8Array(await res.arrayBuffer());
		await ffmpeg.writeFile(inputName, buf);
	} else {
		await ffmpeg.writeFile(inputName, await fetchFile(fileOrUrl));
	}
	await ffmpeg.exec(['-i', inputName, '-ss', String(timeSeconds), '-frames:v', '1', '-q:v', '2', outputName]);
	const data = await ffmpeg.readFile(outputName);
	await ffmpeg.deleteFile(inputName);
	await ffmpeg.deleteFile(outputName);
	return new Blob([data], { type: 'image/jpeg' });
}

export function blobToObjectUrl(blob: Blob): string {
	return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string) {
	URL.revokeObjectURL(url);
}

// Convert blob URL to base64 data URL for persistence
export async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
	try {
		const response = await fetch(blobUrl);
		const blob = await response.blob();
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error('Error converting blob URL to data URL:', error);
		return blobUrl; // Return original URL if conversion fails
	}
}

// Convert base64 data URL back to blob URL if needed
export function dataUrlToBlobUrl(dataUrl: string): string {
	if (dataUrl.startsWith('data:')) {
		// Already a data URL, can be used directly
		return dataUrl;
	}
	// If it's not a data URL, assume it's already a valid URL
	return dataUrl;
}
