import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'
import { nextTick, onScopeDispose, ref, watch, type Ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

interface CloseOptions {
  restoreFocus?: boolean
}

function focusReferenceElement(referenceEl: HTMLElement | null) {
  const focusTarget =
    referenceEl?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) ?? referenceEl

  focusTarget?.focus()
}

export function useFloatingDropdown(referenceEl: Ref<HTMLElement | null>, floatingEl: Ref<HTMLElement | null>) {
  const isOpen = ref(false)
  const isPositioned = ref(false)
  let cleanupAutoUpdate: (() => void) | null = null

  async function updatePosition() {
    if (!referenceEl.value || !floatingEl.value) {
      return
    }

    const { x, y } = await computePosition(referenceEl.value, floatingEl.value, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [
        offset(8),
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        size({
          apply({ rects, elements }) {
            elements.floating.style.minWidth = `${Math.round(rects.reference.width)}px`
          },
        }),
      ],
    })

    const dpr = window.devicePixelRatio || 1
    const roundedX = Math.round(x * dpr) / dpr
    const roundedY = Math.round(y * dpr) / dpr

    Object.assign(floatingEl.value.style, {
      left: `${roundedX}px`,
      top: `${roundedY}px`,
    })

    isPositioned.value = true
  }

  function startAutoUpdate() {
    if (!referenceEl.value || !floatingEl.value) {
      return
    }

    cleanupAutoUpdate = autoUpdate(referenceEl.value, floatingEl.value, updatePosition)
  }

  function stopAutoUpdate() {
    cleanupAutoUpdate?.()
    cleanupAutoUpdate = null
  }

  function open() {
    isPositioned.value = false
    isOpen.value = true
  }

  function close(options: CloseOptions = {}) {
    const { restoreFocus = false } = options

    isPositioned.value = false
    isOpen.value = false

    if (restoreFocus) {
      void nextTick().then(() => {
        focusReferenceElement(referenceEl.value)
      })
    }
  }

  function toggle() {
    if (isOpen.value) {
      close()
      return
    }

    open()
  }

  onClickOutside(
    floatingEl,
    () => {
      if (!isOpen.value) {
        return
      }

      close()
    },
    {
      ignore: [referenceEl],
    },
  )

  watch(isOpen, async (opened) => {
    if (opened) {
      await nextTick()
      startAutoUpdate()
      await updatePosition()
      return
    }

    stopAutoUpdate()
  })

  onScopeDispose(() => {
    stopAutoUpdate()
  })

  return {
    isOpen,
    isPositioned,
    open,
    close,
    toggle,
    updatePosition,
  }
}
