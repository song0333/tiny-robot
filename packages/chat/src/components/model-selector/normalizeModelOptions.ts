import type { ModelOption } from '@/types'
import type { NormalizedModelOption } from './types'
import { getProviderIcon } from './providerIconMap'

function createSearchText(parts: Array<string | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .toLowerCase()
}

export function normalizeModelOptions(models: readonly ModelOption[]): NormalizedModelOption[] {
  return models.map((model) => {
    const label = model.label || model.value
    const group = model.group || model.providerId || 'default'
    const keywords = model.keywords ?? []

    return {
      id: model.value,
      value: model.value,
      label,
      providerId: model.providerId,
      icon: getProviderIcon(model),
      disabled: Boolean(model.disabled),
      group,
      groupLabel: group,
      keywords: [...keywords],
      searchText: createSearchText([label, model.value, model.providerId, group, ...keywords]),
      raw: model,
    }
  })
}
