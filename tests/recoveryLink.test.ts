import assert from 'node:assert/strict'
import { it } from 'node:test'
import { recoveryLink } from '../server/utils/recoveryLink.ts'

it('abre a confirmação no próprio aplicativo e mantém o token fora da requisição HTTP', () => {
  const token = 'a'.repeat(56)
  for (const origin of ['http://localhost:3000', 'https://popmusic-beige.vercel.app']) {
    const url = new URL(recoveryLink(`${origin}/confirm?mode=recovery`, token))
    assert.equal(url.origin, origin)
    assert.equal(url.pathname, '/confirm')
    assert.equal(url.search, '?mode=recovery')
    assert.equal(new URLSearchParams(url.hash.slice(1)).get('token_hash'), token)
    assert.equal(new URLSearchParams(url.hash.slice(1)).get('type'), 'recovery')
    assert.equal((url.origin + url.pathname + url.search).includes(token), false)
  }
})
it('recusa token ausente ou malformado e protocolo executável', () => {
  assert.throws(() => recoveryLink('https://example.com/confirm', ''))
  assert.throws(() => recoveryLink('https://example.com/confirm', '<script>'.repeat(8)))
  assert.throws(() => recoveryLink('javascript:alert(1)', 'a'.repeat(56)))
})
