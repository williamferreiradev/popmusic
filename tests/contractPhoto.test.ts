import assert from 'node:assert/strict'
import { it } from 'node:test'
import { resolveContractPhoto } from '../app/utils/contractPhoto.ts'

it('troca o caminho privado por URL assinada, sem tornar o bucket público', async () => {
  let requested = ''
  const photo = await resolveContractPhoto('aluno/contrato.jpg', async path => {
    requested = path
    return { data: { signedUrl: 'https://storage.example/signed/photo?token=test' }, error: null }
  })
  assert.equal(requested, 'aluno/contrato.jpg')
  assert.equal(photo, 'https://storage.example/signed/photo?token=test')
})
it('mantém a foto retornada pela API pública de contrato e a captura local', async () => {
  const sign = async () => { throw new Error('Não deve assinar novamente') }
  for (const photo of ['https://storage.example/signed/photo', 'data:image/jpeg;base64,aGVsbG8=']) assert.equal(await resolveContractPhoto(photo, sign), photo)
})
it('informa falha em vez de tratar caminho privado como imagem pronta', async () => {
  await assert.rejects(resolveContractPhoto('aluno/photo.jpg', async () => ({ data: null, error: new Error('Storage indisponível') })), /foto privada/)
  for (const source of ['../arquivo.jpg', 'javascript:alert(1)', '/arquivo.jpg']) await assert.rejects(resolveContractPhoto(source, async () => ({ data: null, error: null })), /inválida/)
})
