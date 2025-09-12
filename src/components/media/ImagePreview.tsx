import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
	src: string;
	alt?: string;
	onAltChange?: (alt: string) => void;
}

export function ImagePreview({ src, alt = '', onAltChange }: ImagePreviewProps) {
	const [widthPercent, setWidthPercent] = useState(100);
	const style = useMemo(() => ({ width: `${widthPercent}%`, maxWidth: '100%' }), [widthPercent]);
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>Size</Label>
				<div className="w-2/3">
					<Slider defaultValue={[100]} min={25} max={100} step={5} onValueChange={(v) => setWidthPercent(v[0] ?? 100)} />
				</div>
			</div>
			<div className="flex gap-2">
				<Button variant="outline" size="sm" onClick={() => setWidthPercent(100)}>100%</Button>
				<Button variant="outline" size="sm" onClick={() => setWidthPercent(75)}>75%</Button>
				<Button variant="outline" size="sm" onClick={() => setWidthPercent(50)}>50%</Button>
			</div>
			<div className="rounded overflow-hidden border">
				<img src={src} alt={alt} style={style as React.CSSProperties} className="object-contain" />
			</div>
			{onAltChange && (
				<div>
					<Label className="block mb-1">Alt text</Label>
					<input className="w-full border rounded px-2 py-1 text-sm" value={alt} onChange={(e) => onAltChange(e.target.value)} />
				</div>
			)}
		</div>
	);
}

export default ImagePreview;
