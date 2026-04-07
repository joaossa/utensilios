import { computed } from 'vue'
import { useQuasar } from 'quasar'

export function useResponsiveCrudList() {
  const $q = useQuasar()

  const tableDense = computed(() => $q.screen.lt.md)
  const tableGrid = computed(() => $q.screen.lt.md)

  return {
    tableDense,
    tableGrid,
  }
}
