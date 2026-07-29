import { unrefElement, type MaybeElementRef } from '@vueuse/core'
import { computed } from 'vue'

export function useTeleportTarget(reference?: MaybeElementRef, target?: string | HTMLElement) {
  return computed(() => {
    if (target instanceof HTMLElement) {
      return target
    }

    const selector = target
    const referenceEl = unrefElement(reference)
    const rootNode = referenceEl?.getRootNode?.()
    const inShadowDom = rootNode instanceof ShadowRoot
    const searchRoot = inShadowDom ? rootNode : document.body

    if (selector) {
      if (!inShadowDom && selector === 'body') {
        return document.body
      }

      const found = searchRoot.querySelector(selector)

      if (found instanceof Node) {
        return found
      }
    }

    return searchRoot
  })
}
