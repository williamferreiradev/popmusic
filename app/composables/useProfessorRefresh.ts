// Atualiza consultas do portal sem recarregar a página ou interromper chamadas.
export function useProfessorRefresh(refresh: () => Promise<unknown>) {
  let timer: ReturnType<typeof setInterval> | undefined
  let refreshing = false
  const update = async () => {
    if (document.visibilityState === 'hidden' || refreshing) return
    refreshing = true
    try { await refresh() } finally { refreshing = false }
  }
  onMounted(() => {
    timer = setInterval(update, 30000)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    window.removeEventListener('focus', update)
    document.removeEventListener('visibilitychange', update)
  })
}
