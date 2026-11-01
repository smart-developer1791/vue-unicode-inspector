<script setup lang="ts">
import { computed } from 'vue'
import { inspect, type Workspace } from '../domain/unicode.ts'
const props = defineProps<{ workspace: Workspace }>(),
  result = computed(() => inspect(props.workspace)),
  lines = computed(() =>
    Array.from({ length: Math.ceil(Math.min(256, result.value.bytes.length) / 16) }, (_, i) => ({
      offset: (i * 16).toString(16).toUpperCase().padStart(6, '0'),
      hex: Array.from(result.value.bytes.slice(i * 16, i * 16 + 16), (n) =>
        n.toString(16).toUpperCase().padStart(2, '0'),
      ).join(' '),
    })),
  )
</script>
<template>
  <div class="space-y-4" data-ui="byte-view">
    <h3 class="font-semibold">UTF-8 without a byte-order mark</h3>
    <p class="text-xs text-muted">
      Showing the first {{ Math.min(256, result.bytes.length) }} of {{ result.bytes.length }} bytes
    </p>
    <div class="h-[410px] overflow-auto rounded-xl border border-line bg-background p-4">
      <pre
        class="min-w-[440px] font-mono text-xs leading-7"
      ><span v-for="line in lines" :key="line.offset" class="block"><span class="mr-5 text-accent">{{line.offset}}</span>{{line.hex}}</span><span v-if="!lines.length" class="text-muted">An empty string has no UTF-8 bytes.</span></pre>
    </div>
    <p class="text-xs leading-relaxed text-muted">
      Each line holds up to sixteen bytes, starting at its hexadecimal byte offset. HEX TXT keeps
      the complete byte report.
    </p>
  </div>
</template>
