-- ============================================================================
-- TRIGGER: CRIAÇÃO AUTOMÁTICA DE USUÁRIO
-- Executar no SQL Editor do Supabase
-- ============================================================================

-- Função que é chamada logo após um usuário ser inserido em auth.users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.usuarios (id, nome, papel)
  values (
    new.id, 
    -- Tenta pegar o nome dos metadados (se enviado no signup), 
    -- se não tiver, usa a primeira parte do email como nome provisório.
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), 
    -- Define o papel padrão como 'aluno' para novos cadastros
    'aluno'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que escuta a tabela auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users 
  for each row execute procedure public.handle_new_user();
