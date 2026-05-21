-- Arke Keep Creditos - Seed de dados iniciais
-- Rodar APÓS executar schema.sql

-- ============================================================================
-- Planos base
-- ============================================================================
INSERT INTO planos (nome, creditos_mensais, valor_mensal) VALUES
  ('Keep Essential', 250, 3000.00),
  ('Keep Scale', 550, 6000.00),
  ('Keep Boost', 1000, 10000.00);

-- ============================================================================
-- Serviços (catálogo completo)
-- ============================================================================
INSERT INTO servicos (nome, creditos, categoria, descricao) VALUES
  ('Criativo simples', 8, 'estático', 'Design criativo padrão'),
  ('Variação de criativo', 1, 'estático', 'Alteração em criativo existente'),
  ('Carrossel até 10 pg', 12, 'estático', 'Carrossel para redes sociais até 10 páginas'),
  ('Carrossel +10 pg', 18, 'estático', 'Carrossel para redes sociais acima de 10 páginas'),
  ('Slide de apresentação (por pg)', 4, 'apresentação', 'Slide para apresentação, cobrado por página'),
  ('Ebook (por pg)', 4, 'apresentação', 'Página de ebook, cobrado por página'),
  ('Impresso (por peça)', 16, 'impresso', 'Design para impressão, cobrado por peça'),
  ('Vídeo até 30s', 18, 'vídeo', 'Vídeo de até 30 segundos'),
  ('Vídeo até 1min', 25, 'vídeo', 'Vídeo de até 1 minuto'),
  ('Vídeo até 2min', 35, 'vídeo', 'Vídeo de até 2 minutos'),
  ('Vídeo até 5min', 50, 'vídeo', 'Vídeo de até 5 minutos'),
  ('Vídeo até 10min', 75, 'vídeo', 'Vídeo de até 10 minutos'),
  ('Motion até 30s', 50, 'motion', 'Animação de até 30 segundos'),
  ('Motion até 1min', 85, 'motion', 'Animação de até 1 minuto'),
  ('Motion branding até 30s', 110, 'motion', 'Animação de marca até 30 segundos'),
  ('Motion branding até 1min', 140, 'motion', 'Animação de marca até 1 minuto');
