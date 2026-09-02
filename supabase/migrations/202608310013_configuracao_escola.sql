-- Fonte unica dos dados oficiais usados em mensagens, recibos e pagamentos.
begin;
insert into public.configuracoes(chave,valor)
values('escola',jsonb_build_object(
  'nome','Academia de Musica Pop Music','cnpj','','endereco','','telefone','',
  'email','','pix_chave','','email_remetente',''
)) on conflict(chave) do nothing;
commit;
