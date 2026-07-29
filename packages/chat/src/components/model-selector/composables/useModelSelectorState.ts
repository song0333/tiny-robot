import { computed, toValue, watchEffect, type MaybeRefOrGetter, type Ref } from 'vue'
import type { ModelOption } from '@/types'
import { normalizeModelOptions } from '../normalizeModelOptions'

export interface UseModelSelectorStateOptions {
  modelValue: Ref<string | null>
  models: MaybeRefOrGetter<readonly ModelOption[]>
  onChange?: (model: ModelOption) => void
}

interface SelectOptionOptions {
  notifyChange?: boolean
}

export function useModelSelectorState(options: UseModelSelectorStateOptions) {
  const normalizedOptions = computed(() => normalizeModelOptions(toValue(options.models)))

  const currentOption = computed(() => {
    return normalizedOptions.value.find((option) => option.value === options.modelValue.value)
  })

  const currentProvider = computed(() => currentOption.value?.icon ?? null)
  const currentLabel = computed(() => currentOption.value?.label ?? '')

  function canSelectOption(value: { disabled: boolean }) {
    return !value.disabled
  }

  function selectOption(option: (typeof normalizedOptions.value)[number], selectOptions: SelectOptionOptions = {}) {
    const { notifyChange = true } = selectOptions

    if (!canSelectOption(option)) {
      return false
    }

    options.modelValue.value = option.value

    if (notifyChange) {
      options.onChange?.(option.raw)
    }

    return true
  }

  function ensureValidSelection() {
    if (normalizedOptions.value.length === 0) {
      return
    }

    if (currentOption.value && canSelectOption(currentOption.value)) {
      return
    }

    const fallbackOption = normalizedOptions.value.find((option) => canSelectOption(option))

    if (fallbackOption) {
      selectOption(fallbackOption)
    }
  }

  watchEffect(() => {
    ensureValidSelection()
  })

  return {
    normalizedOptions,
    currentOption,
    currentProvider,
    currentLabel,
    selectOption,
    ensureValidSelection,
  }
}
