-- Tabela de Blocos
create table public.blocks (
  id text primary key,
  type text not null,
  icon text not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Inserir dados iniciais de blocos (Opcional, se quiser começar com os padrões)
insert into public.blocks (id, type, icon, name) values
('event_start', 'event_start', 'assets/block_icons/play.svg', 'Iniciar'),
('motor_on', 'motor_on', 'assets/block_icons/motor.svg', 'Motor Ligar'),
('motor_off', 'motor_off', 'assets/block_icons/motor.svg', 'Motor Parar'),
('motor_spin', 'motor_spin', 'assets/block_icons/motor.svg', 'Motor Girar'),
('control_wait', 'control_wait', 'assets/block_icons/wait.svg', 'Esperar'),
('control_repeat', 'control_repeat', 'assets/block_icons/loop.svg', 'Repetir'),
('led_set_color', 'led_set_color', 'assets/block_icons/led.svg', 'LED'),
('sound_play', 'sound_play', 'assets/block_icons/sound.svg', 'Som');

-- Tabela de Usuários
create table public.users (
  username text primary key,
  password text not null, -- Em produção, use hash!
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Usuário Admin padrão
insert into public.users (username, password) values
('admin', '123');

-- Habilitar RLS (Row Level Security) - Opcional, mas recomendado
alter table public.blocks enable row level security;
alter table public.users enable row level security;

-- Políticas de acesso (Simplificado: Leitura pública para blocos, escrita apenas autenticado/admin seria o ideal)
-- Para este projeto, vamos permitir acesso total via API Key (service_role) ou anon dependendo da config.
-- Se usar a chave pública (anon) no front, precisaria de policies.
-- Mas como estamos usando via Node.js (server-side), a service_role key ignora RLS.
-- Se usar a chave anon no server, precisa liberar:

create policy "Enable read access for all users" on public.blocks for select using (true);
create policy "Enable insert for all users" on public.blocks for insert with check (true);
create policy "Enable update for all users" on public.blocks for update using (true);
create policy "Enable delete for all users" on public.blocks for delete using (true);

create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable insert for all users" on public.users for insert with check (true);
create policy "Enable update for all users" on public.users for update using (true);
