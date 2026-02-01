-- Limpar todos os blocos existentes
truncate table public.blocks;

-- Inserir os blocos padrão originais
insert into public.blocks (id, type, icon, name) values
('event_start', 'event_start', 'assets/block_icons/play.svg', 'Iniciar'),
('motor_on', 'motor_on', 'assets/block_icons/motor.svg', 'Motor Ligar'),
('motor_off', 'motor_off', 'assets/block_icons/motor.svg', 'Motor Parar'),
('motor_spin', 'motor_spin', 'assets/block_icons/motor.svg', 'Motor Girar'),
('control_wait', 'control_wait', 'assets/block_icons/wait.svg', 'Esperar'),
('control_repeat', 'control_repeat', 'assets/block_icons/loop.svg', 'Repetir'),
('led_set_color', 'led_set_color', 'assets/block_icons/led.svg', 'LED'),
('sound_play', 'sound_play', 'assets/block_icons/sound.svg', 'Som');
