import { NextResponse } from 'next/server';
import { clearSaveQueue } from '@/lib/notion-saver';

export async function GET() {
  try {
    const result = clearSaveQueue();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '저장 큐가 비워졌습니다.',
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
