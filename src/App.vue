<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import sample from '../public/sample-workspace.json'
import StudioHeader from './components/StudioHeader.vue'
import DataTools from './components/DataTools.vue'
import AppDialog from './components/AppDialog.vue'
import GraphemeTable from './components/GraphemeTable.vue'
import ByteView from './components/ByteView.vue'
import { parse, serialize, inspect, csvExport, hexExport, textExport } from './domain/unicode.ts'
import { useDraft } from './services/draft.ts'
import { download } from './services/files.ts'
const { draft, storageStatus } = useDraft('vue-unicode-inspector:v1', parse(sample), parse),
  identity = computed(() => serialize(draft.value).provenance.marker),
  result = computed(() => inspect(draft.value)),
  title = ref(draft.value.name),
  normalization = ref(draft.value.normalization),
  text = ref(draft.value.text),
  error = ref(''),
  textError = ref(''),
  about = ref(false),
  view = ref<'graphemes' | 'bytes'>('graphemes')
function syncSettings() {
  title.value = draft.value.name
  normalization.value = draft.value.normalization
  error.value = ''
}
function syncText() {
  text.value = draft.value.text
  textError.value = ''
}
watch(() => JSON.stringify([draft.value.name, draft.value.normalization]), syncSettings)
watch(() => draft.value.text, syncText)
function replace(value: unknown) {
  draft.value = parse(value)
  syncSettings()
  syncText()
}
function save() {
  try {
    draft.value = parse({ ...draft.value, name: title.value, normalization: normalization.value })
    syncSettings()
  } catch (e) {
    error.value = (e as Error).message
  }
}
function saveText() {
  try {
    draft.value = parse({ ...draft.value, text: text.value })
    syncText()
  } catch (e) {
    textError.value = (e as Error).message
  }
}
function exportCsv() {
  download(identity.value + '-graphemes.csv', csvExport(draft.value), 'text/csv;charset=utf-8')
}
function exportHex() {
  download(identity.value + '-utf8-hex.txt', hexExport(draft.value), 'text/plain;charset=utf-8')
}
function exportText() {
  download(identity.value + '-normalized.txt', textExport(draft.value), 'text/plain;charset=utf-8')
}
</script>
<template>
  <div data-project="vue-unicode-inspector" class="min-h-screen">
    <StudioHeader title="Unicode Inspector" subtitle="Look closely at the text you see" code="UN"
      ><DataTools
        :workspace="draft"
        :sample="sample"
        :parse="parse"
        :serialize="serialize"
        @replace="replace"
      /><button class="bg-surface hover:bg-soft" @click="about = true">About</button></StudioHeader
    >
    <main class="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8">
      <section class="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            ONE STRING, DIFFERENT STRUCTURES
          </p>
          <h1 class="break-words font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {{ draft.name }}
          </h1>
          <p class="mt-3 max-w-xl leading-relaxed text-muted">
            Take a familiar piece of text apart. Compare its visible clusters, Unicode code points,
            code units, and bytes without changing your original source.
          </p>
        </div>
        <div class="rounded-xl border border-line bg-surface px-4 py-3 text-right">
          <span class="block font-mono text-xs text-accent" data-ui="marker">{{ identity }}</span
          ><span class="mt-1 block text-xs text-muted" role="status">{{ storageStatus }}</span>
        </div>
      </section>
      <div
        data-ui="workspace"
        class="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]"
      >
        <section
          class="flex h-[1130px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="editor-panel"
        >
          <div class="border-b border-line p-5">
            <h2 class="text-lg font-semibold">One string, several ways to count</h2>
            <p class="mt-1 text-xs text-muted">Native graphemes · code points · UTF-16 · UTF-8</p>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <form @submit.prevent="save" novalidate data-ui="settings-form">
              <label>Workspace name<input v-model="title" maxlength="80" /></label
              ><label class="mt-4"
                >Normalization<select v-model="normalization">
                  <option value="none">Keep source unchanged</option>
                  <option value="NFC">NFC · canonical composition</option>
                  <option value="NFD">NFD · canonical decomposition</option>
                  <option value="NFKC">NFKC · compatibility composition</option>
                  <option value="NFKD">NFKD · compatibility decomposition</option>
                </select></label
              >
              <p role="alert" class="mt-3 min-h-14 text-xs leading-relaxed text-danger">
                {{ error }}
              </p>
              <button
                class="mt-2 w-full border-accent! bg-accent text-on-accent hover:brightness-110"
              >
                Apply inspection settings
              </button>
            </form>
            <form
              @submit.prevent="saveText"
              novalidate
              class="border-t border-line pt-5"
              data-ui="text-form"
            >
              <label
                >Source text<textarea
                  v-model="text"
                  maxlength="1000"
                  rows="8"
                  spellcheck="false"
                  dir="auto"
                  class="resize-none font-mono!"
                ></textarea>
              </label>
              <p class="mt-3 text-xs text-muted">
                {{ text.length }} / 1000 UTF-16 units · empty text is valid
              </p>
              <p role="alert" class="mt-3 min-h-10 text-xs text-danger">{{ textError }}</p>
              <button class="w-full bg-background text-accent hover:bg-soft">
                Apply source text
              </button>
            </form>
            <div class="rounded-xl border border-line bg-soft p-4">
              <h3 class="font-semibold">A character is not always one number</h3>
              <p class="mt-2 text-xs leading-relaxed text-muted">
                A visible grapheme may contain several code points. A code point may use two UTF-16
                units, and UTF-8 encodes it as one to four bytes. Combining marks and joined emoji
                make those differences visible.
              </p>
              <p class="mt-3 text-xs leading-relaxed text-muted">
                Normalization can compose or decompose text. Compatibility forms can also change
                presentation characters. Source JSON stays untouched; normalized output is a
                separate result.
              </p>
            </div>
            <p class="text-xs leading-relaxed text-muted">
              The inspector accepts well-formed Unicode, including controls. Expanded normalized
              text is bounded at 4,096 UTF-16 units. Native grapheme boundaries can depend on the
              browser’s Unicode implementation.
            </p>
          </div>
        </section>
        <section
          class="flex h-[1130px] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface"
          data-ui="preview-panel"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div>
              <h2 class="text-lg font-semibold">The structure inside the text</h2>
              <p class="mt-1 text-xs text-muted">
                {{ draft.normalization }} ·
                {{ result.changed ? 'normalized output differs' : 'output matches source' }}
              </p>
            </div>
            <div class="flex gap-1 rounded-lg bg-background p-1">
              <button
                @click="view = 'graphemes'"
                :aria-pressed="view === 'graphemes'"
                class="border-0! text-xs"
                :class="
                  view === 'graphemes'
                    ? 'bg-white text-accent shadow-sm'
                    : 'bg-transparent text-muted'
                "
              >
                Graphemes</button
              ><button
                @click="view = 'bytes'"
                :aria-pressed="view === 'bytes'"
                class="border-0! text-xs"
                :class="
                  view === 'bytes' ? 'bg-white text-accent shadow-sm' : 'bg-transparent text-muted'
                "
              >
                UTF-8 bytes
              </button>
            </div>
          </div>
          <div class="min-h-0 flex-1 space-y-5 overflow-auto p-5">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div
                v-for="(metric, i) in [
                  { name: 'UTF-16 units', value: result.text.length },
                  { name: 'Code points', value: result.codePoints },
                  { name: 'Graphemes', value: result.clusters.length },
                  { name: 'UTF-8 bytes', value: result.bytes.length },
                ]"
                :key="metric.name"
                class="h-24 rounded-xl border border-line p-3"
              >
                <p class="text-[10px] uppercase text-muted">{{ metric.name }}</p>
                <p class="mt-2 font-mono text-xl" :data-count="i">{{ metric.value }}</p>
              </div>
            </div>
            <label
              >Normalized output<textarea
                :value="result.text"
                readonly
                rows="3"
                dir="auto"
                spellcheck="false"
                class="resize-none bg-soft! font-mono!"
                data-ui="normalized-output"
              ></textarea>
            </label>
            <div class="h-[560px] overflow-auto" data-ui="inspection-frame">
              <GraphemeTable v-if="view === 'graphemes'" :workspace="draft" /><ByteView
                v-else
                :workspace="draft"
              />
            </div>
            <p class="text-xs leading-relaxed text-muted">
              The grapheme table shows up to 160 filtered rows; the byte view shows the first 256
              bytes. Downloads include all output. Returning to Graphemes starts a fresh search.
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 border-t border-line p-4">
            <button @click="exportCsv" class="bg-background text-xs hover:bg-soft">
              Graphemes CSV</button
            ><button @click="exportHex" class="bg-background text-xs hover:bg-soft">HEX TXT</button
            ><button @click="exportText" class="bg-background text-xs hover:bg-soft">
              Normalized TXT
            </button>
          </div>
        </section>
      </div>
      <footer
        class="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-xs text-muted"
      >
        <span>Made with Vue · Stored on this device</span><span>CodeSculptor · MIT · 2026</span>
      </footer>
    </main>
    <AppDialog v-model="about" title="About Unicode Inspector"
      ><div class="space-y-4 leading-relaxed text-muted">
        <p>
          A native Unicode normalization and grapheme inspection desk. A Vue customRef publishes
          delayed search values, while scope cleanup stops its watcher and pending timer when the
          grapheme view unmounts.
        </p>
        <p>
          JSON keeps the editable workspace. Local storage stays on this browser; exports let you
          keep a copy elsewhere.
        </p>
        <a href="/sample-workspace.json" class="font-semibold text-accent underline" download
          >Download the complete sample</a
        >
      </div></AppDialog
    >
  </div>
</template>
