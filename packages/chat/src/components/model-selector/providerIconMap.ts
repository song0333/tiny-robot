import type { Component } from 'vue'
import type { ModelOption } from '@/types'
import {
  IconBailian,
  IconClaude,
  IconDeepseek,
  IconGemini,
  IconModelscope,
  IconOllama,
  IconOpenai,
  IconOpenrouter,
} from './icons'

export const PROVIDER_ICON_MAP: Record<string, Component> = {
  openai: IconOpenai,
  claude: IconClaude,
  deepseek: IconDeepseek,
  gemini: IconGemini,
  bailian: IconBailian,
  modelscope: IconModelscope,
  openrouter: IconOpenrouter,
  ollama: IconOllama,
}

const KNOWN_PROVIDERS = Object.keys(PROVIDER_ICON_MAP)

function resolveProviderKey(value: string) {
  const normalizedValue = value.trim().toLowerCase()

  if (!normalizedValue) {
    return null
  }

  if (PROVIDER_ICON_MAP[normalizedValue]) {
    return normalizedValue
  }

  return KNOWN_PROVIDERS.find((key) => normalizedValue.startsWith(key) || normalizedValue.includes(key)) ?? null
}

export function getProviderIcon(model: ModelOption | string | null | undefined): Component | undefined {
  if (!model) {
    return undefined
  }

  if (typeof model === 'object') {
    if (model.icon) {
      return model.icon
    }

    const providerKey = model.providerId ? resolveProviderKey(model.providerId) : null
    return providerKey ? PROVIDER_ICON_MAP[providerKey] : undefined
  }

  const providerKey = resolveProviderKey(model)
  return providerKey ? PROVIDER_ICON_MAP[providerKey] : undefined
}
