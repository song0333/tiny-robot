import type { Component } from 'vue'
import type { ModelOption } from '@/types'

export interface NormalizedModelOption {
  id: string
  value: string
  label: string
  providerId?: string
  icon?: Component
  disabled: boolean
  group: string
  groupLabel: string
  keywords: string[]
  searchText: string
  raw: ModelOption
}

export interface ModelOptionGroup {
  key: string
  label: string
  items: NormalizedModelOption[]
}
