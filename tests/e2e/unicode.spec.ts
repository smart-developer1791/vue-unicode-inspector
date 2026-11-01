import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const fixture = JSON.parse(
  await readFile(new URL('../../public/sample-workspace.json', import.meta.url), 'utf8'),
)
async function importData(page: Page, value: unknown) {
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Workspace JSON', { exact: true }).fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.locator('dialog[open]')).toHaveCount(0)
}
async function deliver(page: Page, label: string) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).click()
  const file = await pending
  return { name: file.suggestedFilename(), buffer: await readFile((await file.path())!) }
}

test('actual metrics and rows distinguish combining, astral, joined and flag graphemes and normalize without changing source', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('[data-count]')).toHaveText(['20', '15', '11', '33'])
  await expect(page.locator('[data-cluster="4"]')).toContainText('U+0065 U+0301')
  await expect(page.locator('[data-cluster="8"]')).toContainText('U+1F469 U+200D U+1F4BB')
  await page.getByRole('combobox', { name: 'Normalization', exact: true }).selectOption('NFC')
  await page.getByRole('button', { name: 'Apply inspection settings', exact: true }).click()
  await expect(page.locator('[data-count]')).toHaveText(['19', '14', '11', '32'])
  await expect(page.getByRole('textbox', { name: 'Source text', exact: true })).toHaveValue(
    fixture.text,
  )
  await expect(page.getByRole('textbox', { name: 'Normalized output', exact: true })).toHaveValue(
    'Café 🙂 👩‍💻 🇬🇧\n',
  )
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Normalization', exact: true })).toHaveValue(
    'NFC',
  )
})
test('customRef searches all clusters before limiting rows and tab unmount cancels pending work with fresh DOM and a stable frame', async ({
  page,
}) => {
  await page.goto('/')
  await importData(page, { ...fixture, text: 'A'.repeat(998) + '🙂' })
  await expect(page.locator('[data-cluster]')).toHaveCount(160)
  const view = page.locator('[data-ui="grapheme-view"]'),
    frame = page.locator('[data-ui="inspection-frame"]'),
    height = await frame.evaluate((e) => e.getBoundingClientRect().height)
  await view.evaluate((e) => {
    ;(window as any).__old = e
  })
  await page.getByRole('searchbox', { name: 'Find code point', exact: true }).fill('1F642')
  await expect(page.locator('[data-cluster]')).toHaveCount(1)
  await expect(page.locator('[data-cluster="999"]')).toContainText('U+1F642')
  await page.getByRole('searchbox', { name: 'Find code point', exact: true }).fill('0042')
  await page.getByRole('button', { name: 'UTF-8 bytes', exact: true }).click()
  await expect(view).toHaveCount(0)
  await page.waitForTimeout(220)
  await expect(page.locator('[data-ui="byte-view"]')).toContainText('first 256')
  await page.getByRole('button', { name: 'Graphemes', exact: true }).click()
  expect(await view.evaluate((e) => e === (window as any).__old)).toBe(false)
  await expect(page.getByRole('searchbox', { name: 'Find code point', exact: true })).toHaveValue(
    '',
  )
  await expect(page.locator('[data-cluster]')).toHaveCount(160)
  expect(await frame.evaluate((e) => e.getBoundingClientRect().height)).toBe(height)
})
test('separate forms preserve pending source/settings, reject malformed Unicode and support empty text', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Source text', exact: true }).fill('e\u0301')
  await page.getByRole('combobox', { name: 'Normalization', exact: true }).selectOption('NFC')
  await page.getByRole('button', { name: 'Apply inspection settings', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Source text', exact: true })).toHaveValue(
    'e\u0301',
  )
  await page.getByRole('textbox', { name: 'Workspace name', exact: true }).fill('Pending title')
  await page.getByRole('button', { name: 'Apply source text', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Workspace name', exact: true })).toHaveValue(
    'Pending title',
  )
  await expect(page.locator('[data-ui="normalized-output"]')).toHaveValue('é')
  const before = await page.locator('[data-ui="marker"]').innerText()
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page
    .getByLabel('Workspace JSON', { exact: true })
    .fill(JSON.stringify({ ...fixture, text: '\ud800' }))
  await page.getByRole('button', { name: 'Import workspace', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('lone surrogates')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-ui="marker"]')).toHaveText(before)
  await page.getByRole('textbox', { name: 'Source text', exact: true }).fill('')
  await page.getByRole('button', { name: 'Apply source text', exact: true }).click()
  await expect(page.locator('[data-count]')).toHaveText(['0', '0', '0', '0'])
  expect((await deliver(page, 'Normalized TXT')).buffer.length).toBe(0)
})
test('actual full CSV, byte HEX and normalized TXT preserve controls safely and do not export filters or derived state', async ({
  page,
}) => {
  await page.goto('/')
  const text = '=x,\u0000\t\r\n"é🙂'
  await importData(page, { ...fixture, text })
  await page.getByRole('searchbox', { name: 'Find code point', exact: true }).fill('1F642')
  await page.getByRole('button', { name: 'Filter now', exact: true }).click()
  const csv = await deliver(page, 'Graphemes CSV'),
    hex = await deliver(page, 'HEX TXT'),
    txt = await deliver(page, 'Normalized TXT')
  expect(csv.name).toMatch(/^UN-[A-F0-9]{8}-graphemes\.csv$/)
  expect(csv.buffer.toString('utf8')).toContain('\\u0000')
  expect(csv.buffer.includes(0)).toBe(false)
  expect(txt.buffer.equals(Buffer.from(text))).toBe(true)
  const restored = hex.buffer
    .toString('utf8')
    .split('\n')
    .filter((v) => /^[0-9A-F]{6}  /.test(v))
    .flatMap((v) =>
      v
        .slice(8)
        .split(' ')
        .map((x) => parseInt(x, 16)),
    )
  expect(restored).toEqual([...Buffer.from(text)])
  const json = JSON.parse((await deliver(page, 'JSON')).buffer.toString('utf8'))
  expect(json.search).toBeUndefined()
  expect(json.clusters).toBeUndefined()
  expect(json.text).toBe(text)
})
