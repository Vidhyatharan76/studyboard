import { NextRequest, NextResponse } from 'next/server'
import { getFileFromStorage } from '@/lib/file-storage'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
    }

    const file = getFileFromStorage(id)
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error retrieving file' }, { status: 500 })
  }
}
