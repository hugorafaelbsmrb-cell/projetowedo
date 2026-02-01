-- Habilitar a extensão de storage se ainda não estiver (geralmente vem habilitada por padrão)
-- create extension if not exists "storage";

-- Criar o bucket 'block_icons'
insert into storage.buckets (id, name, public)
values ('block_icons', 'block_icons', true)
on conflict (id) do nothing;

-- Políticas de Segurança (Storage Policies) para o bucket 'block_icons'

-- 1. Permitir acesso público de leitura (SELECT) a todos os arquivos no bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'block_icons' );

-- 2. Permitir upload (INSERT) para qualquer pessoa (já que o login foi removido/simplificado)
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'block_icons' );

-- 3. Permitir atualização (UPDATE) para qualquer pessoa
create policy "Public Update"
on storage.objects for update
using ( bucket_id = 'block_icons' );

-- 4. Permitir deleção (DELETE) para qualquer pessoa
create policy "Public Delete"
on storage.objects for delete
using ( bucket_id = 'block_icons' );
