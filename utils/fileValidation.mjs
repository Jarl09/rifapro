export function esImagenValida(file) {
  if (!file || !file.buffer) return false

  const buffer = file.buffer

  // JPEG: FF D8 FF
  const isJpg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff

  // PNG: 89 50 4E 47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47

  return isJpg || isPng
}