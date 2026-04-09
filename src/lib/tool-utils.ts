export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }

type Token =
  | { type: 'identifier'; value: string }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'comma' }
  | { type: 'lparen' }
  | { type: 'rparen' }

type AstNode =
  | { type: 'call'; name: string; args: AstNode[] }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }

type PdfLine = {
  font: 'F1' | 'F2' | 'F3'
  size: number
  text: string
  topGap: number
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const digits = value >= 10 || unitIndex === 0 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function readFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

export async function loadImageElement(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to load image'))
    image.src = src
  })
}

export async function dataUrlToBlob(input: string, mimeHint?: string) {
  const value = input.trim()

  if (!value) {
    throw new Error('Paste a Base64 string or a data URL first.')
  }

  if (value.startsWith('data:')) {
    const match = value.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([\s\S]+)$/)
    if (!match) {
      throw new Error('The data URL could not be parsed.')
    }

    const mime = match[1] || mimeHint || 'application/octet-stream'
    const isBase64 = Boolean(match[2])
    const payload = match[3]

    if (isBase64) {
      return base64ToBlob(payload, mime)
    }

    const decoded = decodeURIComponent(payload)
    return new Blob([decoded], { type: mime })
  }

  return base64ToBlob(value, mimeHint || 'image/png')
}

function base64ToBlob(base64: string, mime: string) {
  const normalized = base64.replace(/\s+/g, '')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mime })
}

export async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read blob'))
    reader.readAsDataURL(blob)
  })
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export failed.'))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })
}

export function drawContainedImage(
  image: CanvasImageSource,
  width: number,
  height: number,
  fill = '#ffffff',
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('2D canvas context is unavailable.')
  }

  context.clearRect(0, 0, width, height)
  context.fillStyle = fill
  context.fillRect(0, 0, width, height)

  const sourceWidth = 'naturalWidth' in image ? image.naturalWidth : width
  const sourceHeight = 'naturalHeight' in image ? image.naturalHeight : height
  const scale = Math.min(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const offsetX = (width - drawWidth) / 2
  const offsetY = (height - drawHeight) / 2

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
  return canvas
}

export async function createIcoBlobFromDataUrl(dataUrl: string) {
  const image = await loadImageElement(dataUrl)
  const canvas = drawContainedImage(image, 256, 256, 'rgba(255,255,255,0)')
  const pngBlob = await canvasToBlob(canvas, 'image/png')
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())

  const header = new ArrayBuffer(22)
  const view = new DataView(header)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)
  view.setUint8(6, 0)
  view.setUint8(7, 0)
  view.setUint8(8, 0)
  view.setUint8(9, 0)
  view.setUint16(10, 1, true)
  view.setUint16(12, 32, true)
  view.setUint32(14, pngBytes.length, true)
  view.setUint32(18, 22, true)

  return new Blob([header, pngBytes], { type: 'image/x-icon' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function fileNameWithoutExtension(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

export function markdownToBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let index = 0

  while (index < lines.length) {
    const current = lines[index]
    const trimmed = current.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      blocks.push({ type: 'code', text: codeLines.join('\n') })
      continue
    }

    const heading = current.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2].trim(),
      })
      index += 1
      continue
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ''))
        index += 1
      }

      blocks.push({ type: 'quote', text: quoteLines.join(' ') })
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = []

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''))
        index += 1
      }

      blocks.push({ type: 'list', items })
      continue
    }

    const paragraphLines: string[] = []

    while (index < lines.length) {
      const line = lines[index]
      const value = line.trim()

      if (
        !value ||
        value.startsWith('```') ||
        value.startsWith('>') ||
        /^[-*]\s+/.test(value) ||
        /^(#{1,6})\s+/.test(line)
      ) {
        break
      }

      paragraphLines.push(value)
      index += 1
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

export function markdownToHtml(markdown: string) {
  const blocks = markdownToBlocks(markdown)

  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        const level = Math.min(block.level, 4)
        return `<h${level}>${renderInlineMarkdown(block.text)}</h${level}>`
      }

      if (block.type === 'paragraph') {
        return `<p>${renderInlineMarkdown(block.text)}</p>`
      }

      if (block.type === 'quote') {
        return `<blockquote>${renderInlineMarkdown(block.text)}</blockquote>`
      }

      if (block.type === 'code') {
        return `<pre><code>${escapeHtml(block.text)}</code></pre>`
      }

      return `<ul>${block.items
        .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
        .join('')}</ul>`
    })
    .join('')
}

function renderInlineMarkdown(value: string) {
  let output = escapeHtml(value)

  output = output.replace(
    /`([^`]+)`/g,
    (_, content: string) => `<code>${escapeHtml(content)}</code>`,
  )
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  )

  return output
}

export function buildPdfFromMarkdown(markdown: string) {
  const blocks = markdownToBlocks(markdown)
  const lines = blocksToPdfLines(blocks)
  const pageWidth = 612
  const pageHeight = 792
  const marginX = 56
  const marginTop = 56
  const marginBottom = 56
  const usableHeight = pageHeight - marginTop - marginBottom
  const pageStreams: string[] = []
  let currentStream = ''
  let currentHeight = 0

  for (const line of lines) {
    const lineHeight = line.size * 1.45 + line.topGap
    if (currentHeight + lineHeight > usableHeight && currentStream) {
      pageStreams.push(currentStream)
      currentStream = ''
      currentHeight = 0
    }

    currentHeight += line.topGap
    const y = pageHeight - marginTop - currentHeight - line.size
    currentStream += `BT /${line.font} ${line.size} Tf ${marginX} ${y.toFixed(2)} Td (${toPdfText(
      line.text,
    )}) Tj ET\n`
    currentHeight += line.size * 1.45
  }

  if (!currentStream) {
    currentStream = `BT /F1 12 Tf ${marginX} ${pageHeight - marginTop - 12} Td (${toPdfText(
      'Empty document',
    )}) Tj ET\n`
  }

  pageStreams.push(currentStream)
  return buildPdfDocument(pageStreams)
}

function blocksToPdfLines(blocks: MarkdownBlock[]) {
  const lines: PdfLine[] = []
  const maxWidth = 78

  for (const block of blocks) {
    if (block.type === 'heading') {
      const size = [28, 22, 18, 16, 14, 13][block.level - 1] || 13
      const wrapped = wrapText(block.text, Math.max(20, Math.floor(92 - size)))

      for (const text of wrapped) {
        lines.push({
          font: 'F2',
          size,
          text,
          topGap: lines.length === 0 ? 0 : 10,
        })
      }

      continue
    }

    if (block.type === 'code') {
      const codeLines = block.text.split('\n')
      for (const entry of codeLines) {
        const wrapped = wrapText(entry || ' ', 78)
        for (const text of wrapped) {
          lines.push({
            font: 'F3',
            size: 10.5,
            text,
            topGap: 4,
          })
        }
      }
      continue
    }

    if (block.type === 'list') {
      for (const item of block.items) {
        const wrapped = wrapText(`• ${item}`, maxWidth)
        wrapped.forEach((text, index) => {
          lines.push({
            font: 'F1',
            size: 12,
            text,
            topGap: index === 0 ? 6 : 2,
          })
        })
      }
      continue
    }

    if (block.type === 'quote') {
      const wrapped = wrapText(`"${block.text}"`, maxWidth)
      wrapped.forEach((text, index) => {
        lines.push({
          font: 'F1',
          size: 12,
          text,
          topGap: index === 0 ? 8 : 2,
        })
      })
      continue
    }

    const wrapped = wrapText(block.text, maxWidth)
    wrapped.forEach((text, index) => {
      lines.push({
        font: 'F1',
        size: 12,
        text,
        topGap: index === 0 ? 8 : 2,
      })
    })
  }

  return lines
}

function wrapText(text: string, maxChars: number) {
  if (!text.trim()) {
    return ['']
  }

  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
      continue
    }

    current = next
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

function toPdfText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

function buildPdfDocument(pageStreams: string[]) {
  const fonts = [
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  ]
  const objects: string[] = []
  const pageRefs: number[] = []

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[1] = ''

  fonts.forEach((font) => {
    objects.push(font)
  })

  for (const stream of pageStreams) {
    const pageNumber = objects.length + 1
    const contentNumber = objects.length + 2
    pageRefs.push(pageNumber)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentNumber} 0 R >>`,
    )
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`)
  }

  objects[1] = `<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs
    .map((ref) => `${ref} 0 R`)
    .join(' ')}] >>`

  const encoder = new TextEncoder()
  let document = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(document).length)
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = encoder.encode(document).length
  document += `xref\n0 ${objects.length + 1}\n`
  document += '0000000000 65535 f \n'

  for (let index = 1; index < offsets.length; index += 1) {
    document += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([document], { type: 'application/pdf' })
}

export function compileRegexDsl(source: string) {
  const tokens = tokenizeDsl(source)
  const parser = createParser(tokens)
  const ast = parser.parseExpression()

  if (!parser.isAtEnd()) {
    throw new Error('Unexpected token after the end of the expression.')
  }

  return compileAst(ast)
}

function tokenizeDsl(source: string) {
  const tokens: Token[] = []
  let index = 0

  while (index < source.length) {
    const current = source[index]

    if (/\s/.test(current)) {
      index += 1
      continue
    }

    if (current === '(') {
      tokens.push({ type: 'lparen' })
      index += 1
      continue
    }

    if (current === ')') {
      tokens.push({ type: 'rparen' })
      index += 1
      continue
    }

    if (current === ',') {
      tokens.push({ type: 'comma' })
      index += 1
      continue
    }

    if (current === '"' || current === "'") {
      const quote = current
      index += 1
      let value = ''

      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\' && index + 1 < source.length) {
          value += source[index + 1]
          index += 2
          continue
        }

        value += source[index]
        index += 1
      }

      if (source[index] !== quote) {
        throw new Error('Unterminated string literal.')
      }

      tokens.push({ type: 'string', value })
      index += 1
      continue
    }

    if (/[0-9]/.test(current)) {
      let value = current
      index += 1
      while (index < source.length && /[0-9]/.test(source[index])) {
        value += source[index]
        index += 1
      }

      tokens.push({ type: 'number', value: Number(value) })
      continue
    }

    if (/[a-zA-Z_]/.test(current)) {
      let value = current
      index += 1
      while (index < source.length && /[a-zA-Z0-9_]/.test(source[index])) {
        value += source[index]
        index += 1
      }

      tokens.push({ type: 'identifier', value })
      continue
    }

    throw new Error(`Unsupported character "${current}".`)
  }

  return tokens
}

function createParser(tokens: Token[]) {
  let current = 0

  const peek = () => tokens[current]
  const advance = () => tokens[current++]

  const consume = (type: Token['type'], message: string) => {
    if (peek()?.type === type) {
      return advance()
    }

    throw new Error(message)
  }

  const parseExpression = (): AstNode => {
    const token = peek()

    if (!token) {
      throw new Error('Expected an expression.')
    }

    if (token.type === 'string') {
      advance()
      return { type: 'string', value: token.value }
    }

    if (token.type === 'number') {
      advance()
      return { type: 'number', value: token.value }
    }

    if (token.type === 'identifier') {
      advance()

      if (peek()?.type === 'lparen') {
        advance()
        const args: AstNode[] = []

        while (peek() && peek()?.type !== 'rparen') {
          args.push(parseExpression())
          if (peek()?.type === 'comma') {
            advance()
          } else {
            break
          }
        }

        consume('rparen', 'Expected ")" to close the function call.')
        return { type: 'call', name: token.value, args }
      }

      return { type: 'call', name: token.value, args: [] }
    }

    throw new Error('Unexpected token in expression.')
  }

  return {
    isAtEnd: () => current >= tokens.length,
    parseExpression,
  }
}

function compileAst(node: AstNode): string {
  if (node.type === 'string') {
    return escapeRegex(node.value)
  }

  if (node.type === 'number') {
    return String(node.value)
  }

  const args = node.args.map((argument) => compileAst(argument))

  switch (node.name) {
    case 'and':
      ensureMinArgs(node.name, args, 1)
      return args.join('')
    case 'or':
      ensureMinArgs(node.name, args, 1)
      return `(?:${args.join('|')})`
    case 'not':
      ensureArgCount(node.name, args, 1)
      return `(?!${args[0]})`
    case 'group':
      ensureArgCount(node.name, args, 1)
      return `(${args[0]})`
    case 'optional':
      ensureArgCount(node.name, args, 1)
      return `(?:${args[0]})?`
    case 'zeroOrMore':
      ensureArgCount(node.name, args, 1)
      return `(?:${args[0]})*`
    case 'oneOrMore':
      ensureArgCount(node.name, args, 1)
      return `(?:${args[0]})+`
    case 'repeat': {
      if (node.args.length < 2 || node.args.length > 3) {
        throw new Error('repeat() expects a pattern, a min, and an optional max.')
      }

      const pattern = compileAst(node.args[0])
      const min = expectNumberArg(node.args[1], 'repeat')
      const max = node.args[2] ? expectNumberArg(node.args[2], 'repeat') : undefined
      return `(?:${pattern}){${min}${typeof max === 'number' ? `,${max}` : ''}}`
    }
    case 'literal':
      ensureStringArgCount(node, 1)
      return escapeRegex((node.args[0] as Extract<AstNode, { type: 'string' }>).value)
    case 'startsWith':
      ensureArgCount(node.name, args, 1)
      return `^${args[0]}`
    case 'endsWith':
      ensureArgCount(node.name, args, 1)
      return `${args[0]}$`
    case 'digit':
      ensureArgCount(node.name, args, 0)
      return '\\d'
    case 'digits':
      ensureArgCount(node.name, args, 0)
      return '\\d+'
    case 'word':
      ensureArgCount(node.name, args, 0)
      return '\\w+'
    case 'whitespace':
      ensureArgCount(node.name, args, 0)
      return '\\s'
    case 'any':
      ensureArgCount(node.name, args, 0)
      return '.'
    case 'charIn':
      ensureStringArgCount(node, 1)
      return `[${escapeCharClass((node.args[0] as Extract<AstNode, { type: 'string' }>).value)}]`
    case 'charRange':
      ensureStringArgCount(node, 2)
      return `[${escapeCharClass((node.args[0] as Extract<AstNode, { type: 'string' }>).value)}-${escapeCharClass(
        (node.args[1] as Extract<AstNode, { type: 'string' }>).value,
      )}]`
    default:
      throw new Error(`Unknown DSL function "${node.name}".`)
  }
}

function ensureArgCount(name: string, args: string[], count: number) {
  if (args.length !== count) {
    throw new Error(`${name}() expects ${count} argument${count === 1 ? '' : 's'}.`)
  }
}

function ensureMinArgs(name: string, args: string[], count: number) {
  if (args.length < count) {
    throw new Error(`${name}() expects at least ${count} argument${count === 1 ? '' : 's'}.`)
  }
}

function ensureStringArgCount(node: Extract<AstNode, { type: 'call' }>, count: number) {
  if (node.args.length !== count || node.args.some((arg) => arg.type !== 'string')) {
    throw new Error(`${node.name}() expects ${count} string argument${count === 1 ? '' : 's'}.`)
  }
}

function expectNumberArg(node: AstNode, name: string) {
  if (node.type !== 'number') {
    throw new Error(`${name}() expects numeric bounds.`)
  }

  return node.value
}

function escapeCharClass(value: string) {
  return value.replace(/[-\\\]]/g, '\\$&')
}
