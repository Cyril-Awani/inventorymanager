import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
	try {
		const form = await request.formData();
		const file = form.get('file') as any;
		if (!file)
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'catalog');
		await fs.mkdir(uploadsDir, { recursive: true });

		const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, '_')}`;
		const outPath = path.join(uploadsDir, safeName);
		await fs.writeFile(outPath, buffer);

		const url = `/uploads/catalog/${safeName}`;
		return NextResponse.json({ ok: true, url });
	} catch (error) {
		console.error('Upload error', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}
