<script setup lang="ts">
import { IconCheck } from '@opentiny/tiny-robot-svgs'
import type { NormalizedModelOption } from '../types'

defineOptions({ name: 'TrModelSelectorItem' })

const props = defineProps<{
  option: NormalizedModelOption
  selected: boolean
  highlighted: boolean
}>()

const emit = defineEmits<{
  hover: [id: string]
  select: [id: string]
}>()

function handleMouseEnter() {
  if (props.option.disabled) {
    return
  }

  emit('hover', props.option.id)
}

function handleSelect() {
  if (props.option.disabled) {
    return
  }

  emit('select', props.option.id)
}
</script>

<template>
  <button
    type="button"
    class="tr-model-selector__option"
    :class="{
      'is-selected': selected,
      'is-highlighted': highlighted,
      'is-disabled': option.disabled,
    }"
    :data-model-option-id="option.id"
    role="option"
    :aria-selected="selected"
    :aria-disabled="option.disabled || undefined"
    :disabled="option.disabled"
    @mouseenter="handleMouseEnter"
    @click="handleSelect"
  >
    <span class="tr-model-selector__option-main">
      <component v-if="option.icon" :is="option.icon" class="tr-model-selector__option-icon" aria-hidden="true" />
      <span class="tr-model-selector__option-label" :title="option.label">{{ option.label }}</span>
    </span>
    <IconCheck v-if="selected" class="tr-model-selector__option-check" aria-hidden="true" />
  </button>
</template>
