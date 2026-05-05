-- Datos de ejemplo para invitados
-- Ejecuta este script en la consola SQL de Supabase para agregar invitados de prueba

INSERT INTO invitados (nombre_completo, codigo_unico, pases_maximos) VALUES
  ('Juan Pérez García', 'JP2024', 2),
  ('María López Rodríguez', 'ML2024', 4),
  ('Carlos Sánchez Martínez', 'CS2024', 1),
  ('Ana Torres Fernández', 'AT2024', 3),
  ('Roberto Díaz Silva', 'RD2024', 2),
  ('Laura Martínez Cruz', 'LM2024', 5),
  ('Pedro Ramírez Vega', 'PR2024', 2),
  ('Sofía González Ortiz', 'SG2024', 3),
  ('Miguel Ángel Hernández', 'MH2024', 4),
  ('Carmen Ruiz Jiménez', 'CR2024', 2);

-- Puedes verificar los datos con:
-- SELECT * FROM invitados;

-- Para eliminar todos los datos de prueba (¡cuidado!):
-- DELETE FROM invitados;
