export type ImageMetadata = { format: 'jpeg' | 'png'; width: number; height: number }

export function readImageMetadata(buffer: Buffer): ImageMetadata | null {
  const isPng = buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
  if (isPng) {
    if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') return null
    return { format: 'png', width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }

  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let offset = 2
  const sofMarkers = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf])
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) { offset++; continue }
    while (offset < buffer.length && buffer[offset] === 0xff) offset++
    const marker = buffer[offset++]
    if (marker === undefined) return null
    if (marker === 0xd8 || marker === 0x01) continue
    if (marker === 0xd9 || marker === 0xda) break
    if (offset + 2 > buffer.length) return null
    const length = buffer.readUInt16BE(offset)
    if (length < 2 || offset + length > buffer.length) return null
    if (sofMarkers.has(marker) && length >= 7) {
      return { format: 'jpeg', height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) }
    }
    offset += length
  }
  return null
}

export function validateEvidenceImage(buffer: Buffer) {
  const metadata = readImageMetadata(buffer)
  if (!metadata) return { valid: false as const, message: 'A estrutura da imagem JPEG ou PNG é inválida.' }
  const shortSide = Math.min(metadata.width, metadata.height)
  const longSide = Math.max(metadata.width, metadata.height)
  if (shortSide < 240 || longSide < 320) return { valid: false as const, message: 'A foto deve ter resolução mínima de 320 x 240 pixels.' }
  if (metadata.width > 4096 || metadata.height > 4096 || metadata.width * metadata.height > 12_000_000) {
    return { valid: false as const, message: 'A resolução da foto ultrapassa o limite permitido.' }
  }
  return { valid: true as const, metadata }
}
