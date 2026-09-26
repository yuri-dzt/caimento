/** Log de erro com contexto (função + parâmetros + mensagem), conforme CLAUDE.md §6 */
export function logError(context: string, params: Record<string, unknown>, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${context}] ${message}`, { ...params, stack: error instanceof Error ? error.stack : undefined })
}
