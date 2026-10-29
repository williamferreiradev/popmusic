import assert from 'node:assert/strict'
import { it } from 'node:test'
import { addressLine, emptyStudentAddress, normalizeStudentAddress } from '../app/utils/studentAddress.ts'

const address = { logradouro: ' Quadra 3 ', numero: ' 9 ', complemento: ' Casa 2 ', bairro: ' Centro ', cidade: ' Novo Gama ', uf: 'go', cep: '72860-000' }
it('normaliza o endereço e compõe a linha usada no contrato', () => {
  const result = normalizeStudentAddress(address)
  assert.equal(result.uf, 'GO')
  assert.equal(result.cep, '72860000')
  assert.equal(addressLine(result), 'Quadra 3, 9, Casa 2')
  assert.equal(address.uf, 'go')
})
it('aceita endereço sem número com S/N e complemento vazio', () => {
  const result = normalizeStudentAddress({ ...address, numero: 'S/N', complemento: '' })
  assert.equal(addressLine(result), 'Quadra 3, S/N')
})
it('rejeita endereço incompleto, UF inexistente e CEP inválido', () => {
  assert.throws(() => normalizeStudentAddress(emptyStudentAddress()), /logradouro/)
  assert.throws(() => normalizeStudentAddress({ ...address, numero: '' }), /número/)
  assert.throws(() => normalizeStudentAddress({ ...address, uf: 'XX' }), /UF/)
  for (const cep of ['123', '7286A-000']) assert.throws(() => normalizeStudentAddress({ ...address, cep }), /CEP/)
})
