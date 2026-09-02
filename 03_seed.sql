-- ============================================================================
-- 03_seed.sql
-- Inserção de dados iniciais para testes (Modalidades, Turmas)
-- ============================================================================

-- Limpar dados existentes para evitar duplicidade em testes (Opcional)
-- DELETE FROM matriculas_turma;
-- DELETE FROM turmas;
-- DELETE FROM modalidades;

-- 1. Inserir Modalidades
INSERT INTO modalidades (id, nome, ativo) VALUES
('mod_violao', 'Violão', true),
('mod_bateria', 'Bateria', true),
('mod_canto', 'Canto', true),
('mod_piano', 'Piano', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Inserir Professores Falsos (Apenas para conseguir criar a turma)
-- Usaremos UUIDs falsos gerados ou UUIDs de teste se precisar,
-- mas como a tabela de professores depende de auth.users, isso pode ser complicado num Seed simples.
-- Se a tabela 'turmas' exigir professor_id, certifique-se de que o campo aceita NULL 
-- ou você precisará criar um professor na tela de usuários primeiro.
-- Para este seed, vamos assumir que professor_id aceita nulo ou o RLS não bloqueia.

-- 3. Inserir Turmas
INSERT INTO turmas (id, modalidade_id, professor_id, nome, capacidade, status, horario_inicio, horario_fim, dias_semana) VALUES
('turma_violao_iniciante', 'mod_violao', null, 'Violão Iniciante', 10, 'ativo', '14:00', '15:00', '["segunda", "quarta"]'),
('turma_violao_avancado', 'mod_violao', null, 'Violão Avançado', 5, 'ativo', '15:00', '16:00', '["segunda", "quarta"]'),
('turma_bateria_sabado', 'mod_bateria', null, 'Bateria Sábado', 8, 'ativo', '10:00', '12:00', '["sabado"]'),
('turma_canto_coral', 'mod_canto', null, 'Canto Coral', 20, 'ativo', '19:00', '20:30', '["terca", "quinta"]'),
('turma_piano_kids', 'mod_piano', null, 'Piano Kids', 5, 'ativo', '09:00', '10:00', '["sexta"]')
ON CONFLICT (id) DO NOTHING;

-- FIM DO SCRIPT
