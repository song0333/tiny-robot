<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ModelOption } from '@/types'
import ModelSelectorPanel from './components/ModelSelectorPanel.vue'
import ModelSelectorTrigger from './components/ModelSelectorTrigger.vue'
import { useFloatingDropdown } from './composables/useFloatingDropdown'
import { useModelSelectorFilter } from './composables/useModelSelectorFilter'
import { useModelSelectorNavigation } from './composables/useModelSelectorNavigation'
import { useModelSelectorState } from './composables/useModelSelectorState'
import { useTeleportTarget } from './composables/useTeleportTarget'
import type { NormalizedModelOption } from './types'

defineOptions({ name: 'TrModelSelector' })

const props = withDefaults(
  defineProps<{
    models?: readonly ModelOption[]
    modelValue?: string | null
    disabled?: boolean
  }>(),
  {
    models: () => [],
    modelValue: null,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: ModelOption]
}>()

const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const teleportTarget = useTeleportTarget(referenceEl)

const currentValue = computed<string | null>({
  get: () => props.modelValue ?? null,
  set: (value) => {
    emit('update:modelValue', value ?? '')
  },
})

const { isOpen, isPositioned, open, close } = useFloatingDropdown(referenceEl, floatingEl)
const { normalizedOptions, currentProvider, currentLabel, selectOption } = useModelSelectorState({
  modelValue: currentValue,
  models: computed(() => props.models),
  onChange: (model) => {
    emit('change', model)
  },
})
const { query, groups, visibleOptions, isEmpty, setQuery, clearQuery } = useModelSelectorFilter({
  options: normalizedOptions,
})
const { highlightedId, resetHighlight, highlightSelectedOrFirst, highlightByHover } = useModelSelectorNavigation({
  enabled: isOpen,
  options: visibleOptions,
  selectedValue: currentValue,
  containerEl: floatingEl,
  onSelect: (option) => {
    handleSelectOption(option)
  },
  onClose: () => {
    handleClose({ restoreFocus: true })
  },
})

const triggerLabel = computed(() => currentLabel.value || currentValue.value || 'Select model')
const isDisabled = computed(() => props.disabled || normalizedOptions.value.length === 0)

function handleOpen() {
  if (isDisabled.value) {
    return
  }

  clearQuery()
  open()
  highlightSelectedOrFirst()
}

function handleClose(options: { restoreFocus?: boolean } = {}) {
  close(options)
  clearQuery()
  resetHighlight()
}

function handleToggle() {
  if (isOpen.value) {
    handleClose()
    return
  }

  handleOpen()
}

function handleSelectOption(option: NormalizedModelOption) {
  if (!selectOption(option)) {
    return
  }

  handleClose({ restoreFocus: true })
}

function handleSelectById(id: string) {
  const option = visibleOptions.value.find((item) => item.id === id)

  if (option) {
    handleSelectOption(option)
  }
}

watch(isDisabled, (disabled) => {
  if (disabled && isOpen.value) {
    handleClose()
  }
})
</script>

<template>
  <div class="tr-model-selector">
    <span ref="referenceEl" class="tr-model-selector__anchor">
      <ModelSelectorTrigger
        :open="isOpen"
        :disabled="isDisabled"
        :label="triggerLabel"
        :title="triggerLabel"
        :provider-icon="currentProvider"
        @click="handleToggle"
      />
    </span>

    <Teleport :to="teleportTarget">
      <div
        v-if="isOpen"
        ref="floatingEl"
        class="tr-model-selector__dropdown-wrapper"
        :class="{ 'is-positioned': isPositioned }"
      >
        <div class="tr-model-selector__dropdown-surface">
          <ModelSelectorPanel
            :query="query"
            :groups="groups"
            :is-empty="isEmpty"
            :selected-value="currentValue"
            :highlighted-id="highlightedId"
            @update:query="setQuery"
            @hover="highlightByHover"
            @select="handleSelectById"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
