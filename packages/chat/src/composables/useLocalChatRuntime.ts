import { useConversation, type UseConversationOptions } from '@opentiny/tiny-robot-kit'
import { useKitChatRuntime } from './useKitChatRuntime'
import type { ChatRuntimeModels } from '../types'

export interface UseLocalChatRuntimeOptions {
  conversation: UseConversationOptions
  models?: ChatRuntimeModels
  titleFallback?: (text: string) => string
}

const defaultTitleFallback = (text: string) => text.trim().slice(0, 20) || '新对话'

export function useLocalChatRuntime(options: UseLocalChatRuntimeOptions) {
  const resolveTitle = options.titleFallback ?? defaultTitleFallback

  const conversation = useConversation({
    autoSaveMessages: true,
    ...options.conversation,
  })

  return useKitChatRuntime({
    conversation,
    models: options.models,
    titleFallback: resolveTitle,
  })
}
