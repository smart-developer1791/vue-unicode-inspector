import { record, choice } from './validation.ts'
import { single, provenance } from './shared.ts'
export interface Workspace {
  version: 1
  name: string
  text: string
  normalization: 'none' | 'NFC' | 'NFD' | 'NFKC' | 'NFKD'
}
export interface Cluster {
  number: number
  segment: string
  offset: number
  byteOffset: number
  units: number
  codes: string[]
  hex: string
}
export function normalized(w: Workspace) {
  return w.normalization === 'none' ? w.text : w.text.normalize(w.normalization)
}
export function parse(value: unknown): Workspace {
  const w = record(value, 'Workspace')
  if (w.version !== 1) throw new Error('Workspace version must be 1.')
  if (typeof w.text !== 'string' || w.text.length > 1000)
    throw new Error('Source text must contain at most 1,000 UTF-16 units.')
  for (const char of w.text)
    if (char.length === 1 && /[\uD800-\uDFFF]/.test(char))
      throw new Error('Source text must contain well-formed Unicode without lone surrogates.')
  const result: Workspace = {
    version: 1,
    name: single(w.name, 'Workspace name', 80),
    text: w.text,
    normalization: choice(w.normalization, 'Normalization', ['none', 'NFC', 'NFD', 'NFKC', 'NFKD']),
  }
  if (normalized(result).length > 4096)
    throw new Error('Normalized text exceeds 4,096 UTF-16 units.')
  return result
}
export function serialize(value: unknown) {
  const w = parse(value)
  return { ...w, provenance: provenance('UN', 'vue-unicode-inspector', w) }
}
export function inspect(value: Workspace) {
  const w = parse(value),
    text = normalized(w),
    encoder = new TextEncoder(),
    bytes = encoder.encode(text),
    segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' }),
    clusters: Cluster[] = []
  let byteOffset = 0
  for (const { segment, index } of segmenter.segment(text)) {
    const data = encoder.encode(segment)
    clusters.push({
      number: clusters.length + 1,
      segment,
      offset: index,
      byteOffset,
      units: segment.length,
      codes: Array.from(
        segment,
        (c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0'),
      ),
      hex: Array.from(data, (n) => n.toString(16).toUpperCase().padStart(2, '0')).join(' '),
    })
    byteOffset += data.length
  }
  return { text, bytes, clusters, codePoints: Array.from(text).length, changed: text !== w.text }
}
export function csvExport(value: Workspace) {
  const w = parse(value),
    marker = serialize(w).provenance.marker,
    quote = (v: string) => '"' + v.replaceAll('"', '""') + '"'
  return (
    'grapheme,utf16_offset,utf8_offset,utf16_units,codepoints,utf8_hex,grapheme_json,marker\r\n' +
    inspect(w)
      .clusters.map((c) =>
        [
          c.number,
          c.offset,
          c.byteOffset,
          c.units,
          quote(c.codes.join(' ')),
          quote(c.hex),
          quote(JSON.stringify(c.segment)),
          marker,
        ].join(','),
      )
      .join('\r\n') +
    '\r\n'
  )
}
export function textExport(value: Workspace) {
  return normalized(parse(value))
}
export function hexExport(value: Workspace) {
  const w = parse(value),
    r = inspect(w)
  return (
    w.name +
    '\n' +
    serialize(w).provenance.marker +
    ' · CodeSculptor\nNormalization: ' +
    w.normalization +
    '\nUTF-16 units: ' +
    r.text.length +
    '; code points: ' +
    r.codePoints +
    '; graphemes: ' +
    r.clusters.length +
    '; UTF-8 bytes: ' +
    r.bytes.length +
    '\nUTF-8 without BOM; offsets are zero-based.\n\n' +
    Array.from(
      { length: Math.ceil(r.bytes.length / 16) },
      (_, i) =>
        (i * 16).toString(16).toUpperCase().padStart(6, '0') +
        '  ' +
        Array.from(r.bytes.slice(i * 16, i * 16 + 16), (n) =>
          n.toString(16).toUpperCase().padStart(2, '0'),
        ).join(' '),
    ).join('\n') +
    '\n'
  )
}
