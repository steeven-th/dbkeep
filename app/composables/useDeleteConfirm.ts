/**
 * Composable pour gérer les confirmations de suppression
 * Utilisé par le canvas et les éditeurs
 */
export type DeleteTargetType = 'table' | 'group' | 'note' | 'relation' | 'mixed'

export interface DeleteRequest {
  type: DeleteTargetType
  ids: string[]
  onConfirm: () => void
}

export const useDeleteConfirm = () => {
  // État global de la modal
  const isOpen = useState<boolean>('deleteConfirmOpen', () => false)
  const targetType = useState<DeleteTargetType>('deleteConfirmType', () => 'table')
  const targetCount = useState<number>('deleteConfirmCount', () => 0)
  const onConfirmCallback = useState<(() => void) | null>('deleteConfirmCallback', () => null)

  /**
   * Demande une confirmation de suppression
   */
  const requestDelete = (request: DeleteRequest) => {
    targetType.value = request.type
    targetCount.value = request.ids.length
    onConfirmCallback.value = request.onConfirm
    isOpen.value = true
  }

  /**
   * Confirme et exécute la suppression
   */
  const confirm = () => {
    if (onConfirmCallback.value) {
      onConfirmCallback.value()
    }
    close()
  }

  /**
   * Annule la suppression
   */
  const cancel = () => {
    close()
  }

  /**
   * Ferme la modal et réinitialise l'état
   */
  const close = () => {
    isOpen.value = false
    onConfirmCallback.value = null
  }

  return {
    // État
    isOpen,
    targetType,
    targetCount,

    // Actions
    requestDelete,
    confirm,
    cancel
  }
}
