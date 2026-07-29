<script setup lang="ts">
import { IconNoData, IconSearch } from '@opentiny/tiny-robot-svgs'
import ModelSelectorGroup from './ModelSelectorGroup.vue'
import type { ModelOptionGroup } from '../types'

defineOptions({ name: 'TrModelSelectorPanel' })

defineProps<{
  query: string
  groups: ModelOptionGroup[]
  isEmpty: boolean
  selectedValue: string | null
  highlightedId: string | null
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  hover: [id: string]
  select: [id: string]
}>()

function handleInput(event: Event) {
  emit('update:query', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="tr-model-selector__panel">
    <div class="tr-model-selector__search">
      <IconSearch class="tr-model-selector__search-icon" aria-hidden="true" />
      <input
        type="text"
        class="tr-model-selector__search-input"
        :value="query"
        placeholder="Search models"
        aria-label="Search models"
        autofocus
        @input="handleInput"
      />
    </div>

    <div v-if="isEmpty" class="tr-model-selector__empty">
      <IconNoData aria-hidden="true" />
      <span>No models found.</span>
    </div>

    <div v-else class="tr-model-selector__content" role="listbox" aria-label="Model options">
      <ModelSelectorGroup
        v-for="group in groups"
        :key="group.key"
        :group="group"
        :selected-value="selectedValue"
        :highlighted-id="highlightedId"
        @hover="$emit('hover', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>
