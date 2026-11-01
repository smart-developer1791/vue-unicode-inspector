<script setup lang="ts">
import { ref, computed } from 'vue'
import { inspect, type Workspace } from '../domain/unicode.ts'
import { useDebouncedSearch } from '../composables/useDebouncedSearch.ts'
const props = defineProps<{ workspace: Workspace }>(),
  query = ref(''),
  { value: search, flush } = useDebouncedSearch(query),
  result = computed(() => inspect(props.workspace)),
  matches = computed(() => {
    const q = search.value.trim().toUpperCase().replace(/^U\+/, '')
    return result.value.clusters.filter((c) => !q || c.codes.some((code) => code.includes(q)))
  }),
  visible = computed(() => matches.value.slice(0, 160))
</script>
<template>
  <div class="space-y-4" data-ui="grapheme-view">
    <form @submit.prevent="flush" class="flex items-end gap-2">
      <label class="min-w-0 flex-1"
        >Find code point<input
          v-model="query"
          type="search"
          placeholder="U+1F642"
          spellcheck="false"
          class="font-mono!" /></label
      ><button class="shrink-0 bg-background text-xs hover:bg-soft">Filter now</button>
    </form>
    <p class="text-xs text-muted" data-ui="filter-count">
      Showing {{ visible.length }} of {{ matches.length }} matching graphemes
    </p>
    <div class="h-[370px] overflow-auto rounded-xl border border-line">
      <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
        <caption class="sr-only">
          Normalized text split into native grapheme clusters; offsets are zero-based
        </caption>
        <thead>
          <tr>
            <th
              v-for="(title, i) in [
                '#',
                'JSON text',
                'Code points',
                'UTF-16 offset',
                'UTF-8 offset',
                'UTF-8 bytes',
              ]"
              :key="title"
              scope="col"
              class="border-b border-line bg-background p-3 text-left"
              :class="i === 0 ? 'w-12' : i === 1 ? 'w-32' : ''"
            >
              {{ title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cluster in visible" :key="cluster.offset" :data-cluster="cluster.number">
            <th scope="row" class="border-b border-line p-3 text-left font-mono">
              {{ cluster.number }}
            </th>
            <td
              class="break-all border-b border-line p-3 font-mono [unicode-bidi:isolate]"
              dir="ltr"
            >
              {{ JSON.stringify(cluster.segment) }}
            </td>
            <td class="break-words border-b border-line p-3 font-mono">
              {{ cluster.codes.join(' ') }}
            </td>
            <td class="border-b border-line p-3 font-mono">{{ cluster.offset }}</td>
            <td class="border-b border-line p-3 font-mono">{{ cluster.byteOffset }}</td>
            <td class="break-words border-b border-line p-3 font-mono">{{ cluster.hex }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!matches.length" class="p-4 text-xs text-muted">
        No grapheme matches the current search.
      </p>
    </div>
    <p class="text-xs leading-relaxed text-muted">
      Type a hexadecimal code point. Search covers the complete normalized text; the table shows up
      to 160 matching clusters. Offsets refer to normalized output. JSON text makes line breaks and
      controls visible.
    </p>
  </div>
</template>
