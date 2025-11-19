import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '@/lib/resumeParser';
import { formatResume } from '@/lib/resumeFormatter';

export const runtime = 'nodejs'; // Required for pdf-parse and mammoth
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Received file:', file.name, file.type, file.size);

    const parsed = await parseResume(file);
    console.log('Parsed resume successfully');
    
    const formatted = formatResume(parsed);
    console.log('Formatted resume successfully');

    return NextResponse.json({ formatted, parsed });
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to parse resume',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

