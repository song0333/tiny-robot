import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { ModelOptionGroup, NormalizedModelOption } from '../types'

export interface UseModelSelectorFilterOptions {
  options: MaybeRefOrGetter<readonly NormalizedModelOption[]>
}

export function useModelSelectorFilter(options: UseModelSelectorFilterOptions) {
  const query = ref('')
  const normalizedQuery = computed(() => query.value.trim().toLowerCase())

  const visibleOptions = computed(() => {
    const resolvedOptions = toValue(options.options)
    const keyword = normalizedQuery.value

    if (!keyword) {
      return resolvedOptions
    }

    return resolvedOptions.filter((option) => option.searchText.includes(keyword))
  })

  const groups = computed<ModelOptionGroup[]>(() => {
    const groupMap = new Map<string, ModelOptionGroup>()

    visibleOptions.value.forEach((option) => {
      const currentGroup = groupMap.get(option.group)

      if (currentGroup) {
        currentGroup.items.push(option)
        return
      }

      groupMap.set(option.group, {
        key: option.group,
        label: option.groupLabel,
        items: [option],
      })
    })

    return [...groupMap.values()]
  })

  const isEmpty = computed(() => visibleOptions.value.length === 0)

  function setQuery(value: string) {
    query.value = value
  }

  function clearQuery() {
    query.value = ''
  }

  return {
    query,
    groups,
    visibleOptions,
    isEmpty,
    setQuery,
    clearQuery,
  }
}
