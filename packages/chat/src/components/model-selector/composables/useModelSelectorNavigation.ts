import { computed, nextTick, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { NormalizedModelOption } from '../types'

export interface UseModelSelectorNavigationOptions {
  enabled: Ref<boolean>
  options: MaybeRefOrGetter<readonly NormalizedModelOption[]>
  selectedValue: MaybeRefOrGetter<string | null>
  containerEl?: MaybeRefOrGetter<HTMLElement | null>
  onSelect?: (option: NormalizedModelOption) => void
  onClose?: () => void
}

export function useModelSelectorNavigation(options: UseModelSelectorNavigationOptions) {
  const highlightedId = ref<string | null>(null)
  const resolvedOptions = computed(() => toValue(options.options))

  const highlightedOption = computed(() => {
    return resolvedOptions.value.find((option) => option.id === highlightedId.value)
  })

  function setHighlightedId(id: string | null) {
    if (!id) {
      highlightedId.value = null
      return
    }

    const option = resolvedOptions.value.find((item) => item.id === id)

    if (!option || option.disabled) {
      return
    }

    highlightedId.value = option.id
  }

  function resetHighlight() {
    highlightedId.value = null
  }

  function highlightSelectedOrFirst() {
    const selectedValue = toValue(options.selectedValue)

    if (selectedValue) {
      const selectedOption = resolvedOptions.value.find((option) => option.value === selectedValue && !option.disabled)

      if (selectedOption) {
        highlightedId.value = selectedOption.id
        return
      }
    }

    const firstOption = resolvedOptions.value.find((option) => !option.disabled)
    highlightedId.value = firstOption?.id ?? null
  }

  function highlightByHover(id: string) {
    setHighlightedId(id)
  }

  function moveHighlight(step: 1 | -1) {
    const selectableOptions = resolvedOptions.value.filter((option) => !option.disabled)

    if (selectableOptions.length === 0) {
      highlightedId.value = null
      return
    }

    const currentIndex = selectableOptions.findIndex((option) => option.id === highlightedId.value)

    if (currentIndex < 0) {
      highlightedId.value = selectableOptions[0]?.id ?? null
      return
    }

    const nextIndex = (currentIndex + step + selectableOptions.length) % selectableOptions.length
    highlightedId.value = selectableOptions[nextIndex]?.id ?? null
  }

  function selectHighlighted() {
    if (highlightedOption.value && !highlightedOption.value.disabled) {
      options.onSelect?.(highlightedOption.value)
    }
  }

  if (typeof document !== 'undefined') {
    useEventListener(document, 'keydown', (event: KeyboardEvent) => {
      if (!options.enabled.value) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveHighlight(1)
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveHighlight(-1)
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        selectHighlighted()
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        options.onClose?.()
      }
    })
  }

  watch(
    [resolvedOptions, options.enabled],
    ([nextOptions, enabled]) => {
      if (!enabled) {
        resetHighlight()
        return
      }

      if (nextOptions.length === 0) {
        highlightedId.value = null
        return
      }

      const stillVisible = highlightedId.value
        ? nextOptions.some((option) => option.id === highlightedId.value && !option.disabled)
        : false

      if (!stillVisible) {
        highlightSelectedOrFirst()
      }
    },
    { immediate: true },
  )

  watch(highlightedId, async (id) => {
    if (!id) {
      return
    }

    await nextTick()

    const root = toValue(options.containerEl)

    if (!root) {
      return
    }

    const target = Array.from(root.querySelectorAll<HTMLElement>('[data-model-option-id]')).find(
      (element) => element.dataset.modelOptionId === id,
    )

    target?.scrollIntoView({
      block: 'nearest',
    })
  })

  return {
    highlightedId,
    highlightedOption,
    setHighlightedId,
    resetHighlight,
    highlightSelectedOrFirst,
    highlightByHover,
  }
}
