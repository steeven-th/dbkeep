/**
 * Composable for managing delete confirmations
 * Used by canvas and editors
 */
export type DeleteTargetType = 'table' | 'group' | 'note' | 'relation' | 'mixed'

export interface DeleteRequest {
  type: DeleteTargetType
  ids: string[]
  onConfirm: () => void
}

export const useDeleteConfirm = () => {
  // Global modal state
  const isOpen = useState<boolean>('deleteConfirmOpen', () => false)
  const targetType = useState<DeleteTargetType>('deleteConfirmType', () => 'table')
  const targetCount = useState<number>('deleteConfirmCount', () => 0)
  const onConfirmCallback = useState<(() => void) | null>('deleteConfirmCallback', () => null)

  /**
   * Requests a delete confirmation
   */
  const requestDelete = (request: DeleteRequest) => {
    targetType.value = request.type
    targetCount.value = request.ids.length
    onConfirmCallback.value = request.onConfirm
    isOpen.value = true
  }

  /**
   * Confirms and executes the deletion
   */
  const confirm = () => {
    if (onConfirmCallback.value) {
      onConfirmCallback.value()
    }
    close()
  }

  /**
   * Cancels the deletion
   */
  const cancel = () => {
    close()
  }

  /**
   * Closes the modal and resets state
   */
  const close = () => {
    isOpen.value = false
    onConfirmCallback.value = null
  }

  return {
    // State
    isOpen,
    targetType,
    targetCount,

    // Actions
    requestDelete,
    confirm,
    cancel
  }
}
