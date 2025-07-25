import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const POINT_META_FILE = path.join(process.cwd(), 'point_meta.json');

export async function GET() {
  try {
    if (fs.existsSync(POINT_META_FILE)) {
      const data = fs.readFileSync(POINT_META_FILE, 'utf8');
      const pointMeta = JSON.parse(data);
      return NextResponse.json(pointMeta);
    } else {
      return NextResponse.json({ start: null, end: null });
    }
  } catch (error) {
    console.error('Error reading point meta:', error);
    return NextResponse.json({ error: 'Failed to read point meta' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { startPoint, endPoint } = await req.json();
    
    let pointMeta: Record<string, any> = { start: null, end: null };
    
    if (fs.existsSync(POINT_META_FILE)) {
      const data = fs.readFileSync(POINT_META_FILE, 'utf8');
      pointMeta = JSON.parse(data);
    }
    
    if (startPoint) {
      pointMeta['start'] = startPoint;
    }
    if (endPoint) {
      pointMeta['end'] = endPoint;
    }
    if (startPoint === null && endPoint === null) {
      pointMeta = { start: null, end: null };
    }
    
    fs.writeFileSync(POINT_META_FILE, JSON.stringify(pointMeta, null, 2));
    
    return NextResponse.json({ success: true, data: pointMeta });
  } catch (error) {
    console.error('Error saving point meta:', error);
    return NextResponse.json({ error: 'Failed to save point meta' }, { status: 500 });
  }
}