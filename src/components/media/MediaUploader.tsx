import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateFile, defaultValidationLimits, compressImage, blobToObjectUrl } from '@/lib/formatConverter';

export type MediaKind = 'image' | 'video' | 'audio';

export interface SelectedMedia {
	kind: MediaKind;
	file?: File;
	url?: string;
	previewUrl?: string;
	alt?: string;
}

interface MediaUploaderProps {
	accept: MediaKind[];
	onSelect: (media: SelectedMedia) => void;
	limits?: Partial<typeof defaultValidationLimits>;
}

export function MediaUploader({ accept, onSelect, limits }: MediaUploaderProps) {
	const dropRef = useRef<HTMLDivElement>(null);
	const [dragOver, setDragOver] = useState(false);
	const [url, setUrl] = useState('');
	const [alt, setAlt] = useState('');
	const mergedLimits = { ...defaultValidationLimits, ...limits };

	const acceptAttr = useMemo(() => {
		const parts: string[] = [];
		if (accept.includes('image')) parts.push('image/*');
		if (accept.includes('video')) parts.push('video/*');
		if (accept.includes('audio')) parts.push('audio/*');
		return parts.join(',');
	}, [accept]);

	const handleFiles = useCallback(async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const file = files[0];
		const kind: MediaKind = file.type.startsWith('image/')
			? 'image'
			: file.type.startsWith('video/')
			? 'video'
			: 'audio';
		if (!accept.includes(kind)) return;
		const error = validateFile(file, kind, mergedLimits);
		if (error) {
			alert(error);
			return;
		}
		let finalFile = file;
		let previewUrl: string | undefined;
		if (kind === 'image') {
			const compressed = await compressImage(file);
			finalFile = new File([compressed], file.name, { type: compressed.type || file.type });
			previewUrl = blobToObjectUrl(compressed);
		}
		if (kind === 'video' || kind === 'audio') {
			previewUrl = URL.createObjectURL(file);
		}
		onSelect({ kind, file: finalFile, previewUrl, alt });
	}, [accept, alt, mergedLimits, onSelect]);

	const onDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		handleFiles(e.dataTransfer.files);
	}, [handleFiles]);

	const onBrowse = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		handleFiles(e.target.files);
	}, [handleFiles]);

	const selectFromUrl = useCallback(() => {
		if (!url) return;
		let kind: MediaKind = 'image';
		if (/youtube|vimeo|tiktok|twitch|dailymotion/.test(url)) kind = 'video';
		onSelect({ kind, url, alt });
	}, [url, alt, onSelect]);

	return (
		<div>
			<div
				ref={dropRef}
				onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
				onDragLeave={() => setDragOver(false)}
				onDrop={onDrop}
				className={`border-2 border-dashed rounded p-4 ${dragOver ? 'border-primary' : 'border-muted-foreground/25'}`}
			>
				<div className="flex flex-col gap-2 items-center text-sm">
					<Label>Drag & drop or choose a file</Label>
					<Input type="file" accept={acceptAttr} onChange={onBrowse} />
				</div>
			</div>
			<div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
				<div className="space-y-2">
					<Label>URL</Label>
					<Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
					<Button onClick={selectFromUrl} size="sm">Use URL</Button>
				</div>
				{accept.includes('image') && (
					<div className="space-y-2">
						<Label>Alt text</Label>
						<Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
					</div>
				)}
			</div>
		</div>
	);
}

export default MediaUploader;
