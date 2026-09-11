import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = '/tmp/studyboard-files'

if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  } catch (err) {
    console.warn('Could not create storage dir:', err)
  }
}

const fileCache = new Map<string, { buffer: Buffer; mimeType: string; fileName: string; updatedAt: number }>()
const MAX_CACHE_ITEMS = 60

export function detectMimeType(fileName: string, buffer?: Buffer): string {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.pdf') return 'application/pdf'

  if (buffer && buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'application/pdf'
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif'
  }

  return 'application/octet-stream'
}

export function saveFileToStorage(id: string, fileName: string, buffer: Buffer, customMime?: string): string {
  const mimeType = customMime || detectMimeType(fileName, buffer)
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_')
  const ext = path.extname(fileName).toLowerCase() || (mimeType === 'application/pdf' ? '.pdf' : '.jpg')
  const diskFileName = `${safeId}${ext}`
  const filePath = path.join(UPLOAD_DIR, diskFileName)

  try {
    fs.writeFileSync(filePath, buffer)
  } catch (e) {
    console.warn('Failed to write file to disk:', e)
  }

  if (fileCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = fileCache.keys().next().value
    if (oldestKey) fileCache.delete(oldestKey)
  }

  fileCache.set(safeId, { buffer, mimeType, fileName, updatedAt: Date.now() })
  fileCache.set(diskFileName, { buffer, mimeType, fileName, updatedAt: Date.now() })

  return diskFileName
}

export function getFileFromStorage(idOrName: string): { buffer: Buffer; mimeType: string; fileName: string } | null {
  const safeKey = idOrName.trim().replace(/[^a-zA-Z0-9._-]/g, '_')

  const cached = fileCache.get(safeKey)
  if (cached) return cached

  const filePath = path.join(UPLOAD_DIR, safeKey)
  if (fs.existsSync(filePath)) {
    try {
      const buffer = fs.readFileSync(filePath)
      const mimeType = detectMimeType(safeKey, buffer)
      const result = { buffer, mimeType, fileName: safeKey, updatedAt: Date.now() }
      fileCache.set(safeKey, result)
      return result
    } catch (err) {
      console.warn('Error reading file from disk:', err)
    }
  }

  try {
    const files = fs.readdirSync(UPLOAD_DIR)
    const matched = files.find(f => f.startsWith(safeKey))
    if (matched) {
      const buffer = fs.readFileSync(path.join(UPLOAD_DIR, matched))
      const mimeType = detectMimeType(matched, buffer)
      const result = { buffer, mimeType, fileName: matched, updatedAt: Date.now() }
      fileCache.set(safeKey, result)
      return result
    }
  } catch {
  }

  return null
}
