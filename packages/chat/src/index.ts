export { default as TrChat } from './Chat.vue'
export { ModelSelector } from './components'

export { useKitChatRuntime } from './composables/useKitChatRuntime'
export { useLocalChatRuntime } from './composables/useLocalChatRuntime'

export type {
  ChatBubbleEventPayload,
  ChatBubbleListUi,
  ChatBubbleStateChangePayload,
  ChatConversation,
  ChatConversationInfo,
  ChatFooterSlotProps,
  ChatHeaderSlotProps,
  ChatHistoryUi,
  ChatHistorySlotProps,
  ChatLayoutUi,
  ChatMainSlotProps,
  ChatMessageContent,
  ChatMessageItem,
  ChatMessagePart,
  ChatPromptsUi,
  ChatProcessingState,
  ChatRequestState,
  ChatRuntime,
  ChatRuntimeModels,
  ChatRuntimeActions,
  ChatRuntimeSender,
  ChatSenderDefaultActions,
  ChatSenderUi,
  ChatStructuredData,
  ChatStructuredDataItem,
  ChatSubmitPayload,
  ChatToolCall,
  ChatUi,
  ModelOption,
} from './types'
