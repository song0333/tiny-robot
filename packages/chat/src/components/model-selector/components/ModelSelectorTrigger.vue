<script setup lang="ts">
import type { Component } from 'vue'
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'

defineOptions({ name: 'TrModelSelectorTrigger' })

defineProps<{
  open: boolean
  disabled?: boolean
  label: string
  title?: string
  providerIcon?: Component | null
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="tr-model-selector__trigger"
    :class="{ 'is-open': open }"
    :title="title || label"
    :disabled="disabled"
    :aria-expanded="open"
    aria-haspopup="listbox"
    @click="$emit('click')"
  >
    <span class="tr-model-selector__trigger-content">
      <component v-if="providerIcon" :is="providerIcon" class="tr-model-selector__trigger-icon" aria-hidden="true" />
      <span class="tr-model-selector__trigger-label">{{ label }}</span>
    </span>
    <IconArrowDown class="tr-model-selector__trigger-chevron" aria-hidden="true" />
  </button>
</template>
