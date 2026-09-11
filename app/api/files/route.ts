import { NextRequest, NextResponse } from 'next/server'
import { saveFileToStorage, getFileFromStorage, detectMimeType } from '@/lib/file-storage'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let buffer: Buffer | null = null
    let fileName = `file_${Date.now()}`
    let mimeType = 'application/octet-stream'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 })
      }
      fileName = file.name || fileName
      mimeType = file.type || detectMimeType(fileName)
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else if (contentType.includes('application/json')) {
      const body = await req.json()
      const { dataUrl, fileData, name, type } = body
      const rawData = dataUrl || fileData

      if (!rawData || typeof rawData !== 'string') {
        return NextResponse.json({ error: 'No file data provided' }, { status: 400 })
      }

      fileName = name || fileName
      mimeType = type || detectMimeType(fileName)

      if (rawData.includes('base64,')) {
        const parts = rawData.split('base64,')
        const headerMime = parts[0].replace('data:', '').replace(';', '')
        if (headerMime) mimeType = headerMime
        buffer = Buffer.from(parts[1], 'base64')
      } else {
        buffer = Buffer.from(rawData)
      }
    } else {
      const arrayBuffer = await req.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      const headerFileName = req.headers.get('x-file-name')
      if (headerFileName) fileName = decodeURIComponent(headerFileName)
      mimeType = req.headers.get('content-type') || detectMimeType(fileName, buffer)
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ error: 'Empty file received' }, { status: 400 })
    }

    const uniqueId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const savedKey = saveFileToStorage(uniqueId, fileName, buffer, mimeType)
    const publicUrl = `/api/files/${savedKey}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      id: savedKey,
      fileName,
      mimeType,
      size: buffer.length
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing file id parameter' }, { status: 400 })
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
}
