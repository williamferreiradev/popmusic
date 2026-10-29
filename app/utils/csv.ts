export const escapeCsvCell = (value: unknown): string => {
  let text = String(value ?? '')
  if (typeof value === 'string' && /^\s*[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}
