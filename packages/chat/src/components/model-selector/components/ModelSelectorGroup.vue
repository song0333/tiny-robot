<script setup lang="ts">
import ModelSelectorItem from './ModelSelectorItem.vue'
import type { ModelOptionGroup } from '../types'

defineOptions({ name: 'TrModelSelectorGroup' })

defineProps<{
  group: ModelOptionGroup
  selectedValue: string | null
  highlightedId: string | null
}>()

defineEmits<{
  hover: [id: string]
  select: [id: string]
}>()
</script>

<template>
  <div class="tr-model-selector__group">
    <div class="tr-model-selector__group-title">{{ group.label }}</div>
    <div class="tr-model-selector__group-list" role="group" :aria-label="group.label">
      <ModelSelectorItem
        v-for="option in group.items"
        :key="option.id"
        :option="option"
        :selected="selectedValue === option.value"
        :highlighted="highlightedId === option.id"
        @hover="$emit('hover', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>
