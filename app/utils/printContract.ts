async function waitForImages(root: HTMLElement) {
  await Promise.all(Array.from(root.querySelectorAll('img')).map(async image => {
    if (!image.complete) await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { clean(); reject(new Error('A foto demorou a carregar. Tente novamente.')) }, 15000)
      const clean = () => { clearTimeout(timer); image.removeEventListener('load', loaded); image.removeEventListener('error', failed) }
      const loaded = () => { clean(); resolve() }
      const failed = () => { clean(); reject(new Error('Não foi possível carregar a foto. Tente novamente antes de imprimir.')) }
      image.addEventListener('load', loaded, { once: true })
      image.addEventListener('error', failed, { once: true })
    })
    if (!image.naturalWidth) throw new Error('A foto do contrato não está disponível. Tente carregá-la novamente.')
    await image.decode()
  }))
}

export async function printContract(root: HTMLElement) {
  const deadline = Date.now() + 15000
  while (root.querySelector('[data-contract-photo-state="loading"]') && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50))
  if (root.querySelector('[data-contract-photo-state="loading"], [data-contract-photo-state="error"]')) throw new Error('Aguarde a foto carregar ou tente carregá-la novamente antes de imprimir.')
  await waitForImages(root)
  const iframe = document.createElement('iframe')
  iframe.title = 'Impressão do contrato'
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  try {
    const target = iframe.contentDocument
    if (!target || !iframe.contentWindow) throw new Error('Não foi possível preparar a impressão.')
    target.open(); target.write('<!doctype html><html lang="pt-BR"><head><title>Contrato Oficial - Pop Music</title></head><body></body></html>'); target.close()
    const base = target.createElement('base'); base.href = document.baseURI; target.head.appendChild(base)
    const stylesReady: Promise<void>[] = []
    for (const style of document.querySelectorAll('style, link[rel="stylesheet"]')) {
      const copy = style.cloneNode(true) as HTMLElement
      if (copy instanceof HTMLLinkElement) stylesReady.push(new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Os estilos da impressão não carregaram. Tente novamente.')), 15000)
        copy.onload = () => { clearTimeout(timer); resolve() }
        copy.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar os estilos da impressão.')) }
      }))
      target.head.appendChild(copy)
    }
    const overrides = target.createElement('style')
    overrides.textContent = `@page{size:A4 portrait;margin:8mm 10mm}html,body{margin:0!important;padding:0!important;background:white!important;color:black!important}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}.contract-page{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;color:black!important;background:white!important}.contract-signature-evidence{break-inside:avoid;page-break-inside:avoid}.contract-photo-frame{width:72px!important;height:72px!important;flex-shrink:0!important}.contract-signer-photo{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;background:white!important}.print\\:hidden{display:none!important}`
    target.head.appendChild(overrides)
    target.body.appendChild(root.cloneNode(true))
    await Promise.all(stylesReady)
    await waitForImages(target.body)
    await target.fonts.ready
    iframe.contentWindow.addEventListener('afterprint', () => iframe.remove(), { once: true })
    iframe.contentWindow.focus(); iframe.contentWindow.print()
    setTimeout(() => iframe.remove(), 60000)
  } catch (error) { iframe.remove(); throw error }
}
