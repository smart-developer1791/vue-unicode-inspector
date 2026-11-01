import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const fixture = JSON.parse(
  readFileSync(new URL('../public/sample-workspace.json', import.meta.url), 'utf8'),
)

import { ref, effectScope, watch } from 'vue'
import {
  parse,
  serialize,
  inspect,
  normalized,
  csvExport,
  textExport,
  hexExport,
} from '../src/domain/unicode.ts'
import { useDebouncedSearch } from '../src/composables/useDebouncedSearch.ts'
test('original greeting has independently checked code-point, UTF-16, grapheme and UTF-8 boundaries', () => {
  const w = parse(fixture),
    r = inspect(w)
  assert.deepEqual(serialize(w), fixture)
  assert.deepEqual(
    [r.text.length, r.codePoints, r.clusters.length, r.bytes.length],
    [20, 15, 11, 33],
  )
  assert.deepEqual(r.clusters[3], {
    number: 4,
    segment: 'e\u0301',
    offset: 3,
    byteOffset: 3,
    units: 2,
    codes: ['U+0065', 'U+0301'],
    hex: '65 CC 81',
  })
  assert.deepEqual(r.clusters[7]!.codes, ['U+1F469', 'U+200D', 'U+1F4BB'])
  assert.equal(r.clusters[7]!.byteOffset, 12)
  assert.equal(r.clusters[9]!.byteOffset, 24)
  assert.equal(r.clusters[10]!.byteOffset, 32)
})
test('normalization forms preserve raw source and distinguish canonical from compatibility expansion', () => {
  const w = parse({ ...fixture, normalization: 'NFC' }),
    r = inspect(w)
  assert.equal(r.text, 'Café 🙂 👩‍💻 🇬🇧\n')
  assert.deepEqual([r.text.length, r.codePoints, r.bytes.length, r.changed], [19, 14, 32, true])
  assert.equal(w.text, fixture.text)
  assert.equal(normalized(parse({ ...fixture, text: 'ﬃ①', normalization: 'NFKC' })), 'ffi1')
  assert.equal(normalized(parse({ ...fixture, text: 'ﬃ①', normalization: 'NFC' })), 'ﬃ①')
  assert.equal(normalized(parse({ ...fixture, text: 'é', normalization: 'NFD' })), 'e\u0301')
  assert.equal(inspect(parse({ ...fixture, text: '\r\n' })).clusters.length, 1)
})
test('customRef coalesces updates, flushes immediately and releases timers/watchers with its actual Vue scope', async () => {
  const source = ref(''),
    scope = effectScope()
  let search!: ReturnType<typeof useDebouncedSearch>,
    changes = 0
  scope.run(() => {
    search = useDebouncedSearch(source, 8)
    watch(search.value, () => changes++, { flush: 'sync' })
  })
  try {
    source.value = '0041'
    source.value = '1F600'
    assert.equal(search.value.value, '')
    await new Promise((r) => setTimeout(r, 35))
    assert.equal(search.value.value, '1F600')
    assert.equal(changes, 1)
    source.value = '0042'
    search.flush()
    assert.equal(search.value.value, '0042')
    assert.equal(changes, 2)
    source.value = 'pending'
    scope.stop()
    source.value = 'after stop'
    await new Promise((r) => setTimeout(r, 35))
    assert.equal(search.value.value, '0042')
    assert.equal(changes, 2)
  } finally {
    scope.stop()
  }
})
test('all escaped controls stay inside CSV JSON cells while raw TXT and HEX preserve exact original bytes', () => {
  const w = parse({ ...fixture, text: '=x,\u0000\t\r\n"é🙂' }),
    csv = csvExport(w),
    bytes = new TextEncoder().encode(w.text)
  assert.equal(csv.includes('\u0000'), false)
  assert.equal(csv.split('\r\n').length, inspect(w).clusters.length + 2)
  assert.ok(csv.includes('\\u0000'))
  assert.ok(csv.includes('\\r\\n'))
  assert.equal(textExport(w), w.text)
  const restored = hexExport(w)
    .split('\n')
    .filter((v) => /^[0-9A-F]{6}  /.test(v))
    .flatMap((v) =>
      v
        .slice(8)
        .split(' ')
        .map((x) => parseInt(x, 16)),
    )
  assert.deepEqual(restored, [...bytes])
  assert.equal(textExport(parse({ ...w, text: '' })), '')
  assert.equal(inspect(parse({ ...w, text: '' })).clusters.length, 0)
})
test('strict source and expanded bounds reject malformed Unicode, forms, primitive coercion and unsupported schemas', () => {
  for (const change of [
    (w: any) => (w.text = '\ud800'),
    (w: any) => (w.text = '\udc00'),
    (w: any) => (w.text = 'A'.repeat(1001)),
    (w: any) => (w.text = 42),
    (w: any) => (w.normalization = ['NFC']),
    (w: any) => (w.normalization = 'BAD'),
    (w: any) => {
      w.text = '\uFDFA'.repeat(300)
      w.normalization = 'NFKD'
    },
    (w: any) => (w.version = 2),
  ]) {
    const w = structuredClone(fixture)
    change(w)
    assert.throws(() => parse(w))
  }
  const expanded = inspect(parse({ ...fixture, text: '\uFDFA'.repeat(200), normalization: 'NFKD' }))
  assert.equal(expanded.text.length, 3600)
})
test('maximum reports contain every grapheme and byte and stamps hash the actual UTF-8 canonical workspace', () => {
  const w = parse({ ...fixture, text: 'A'.repeat(998) + '🙂', name: '"'.repeat(80) }),
    r = inspect(w)
  assert.equal(r.clusters.length, 999)
  assert.equal(csvExport(w).trim().split('\r\n').length, 1000)
  assert.equal(r.bytes.length, 1002)
  assert.ok(hexExport(w).includes('0003E0'))
  assert.deepEqual(parse(serialize(w)), w)
  assert.notEqual(
    serialize({ ...w, name: '🙂' }).provenance.marker,
    serialize({ ...w, name: '🙃' }).provenance.marker,
  )
})
