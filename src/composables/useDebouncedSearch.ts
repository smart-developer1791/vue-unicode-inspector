import { customRef, watch, onScopeDispose, type Ref } from 'vue'
export function useDebouncedSearch(source: Ref<string>, delay = 180) {
  let committed = source.value,
    timer: ReturnType<typeof setTimeout> | undefined,
    closed = false,
    publish = () => {}
  const value = customRef<string>((track, trigger) => {
    publish = trigger
    return {
      get() {
        track()
        return committed
      },
      set(next) {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (closed) return
          committed = next
          trigger()
        }, delay)
      },
    }
  })
  const stop = watch(
    source,
    (next) => {
      value.value = next
    },
    { flush: 'sync' },
  )
  function flush() {
    clearTimeout(timer)
    if (!closed) {
      committed = source.value
      publish()
    }
  }
  onScopeDispose(() => {
    closed = true
    stop()
    clearTimeout(timer)
  })
  return { value, flush }
}
