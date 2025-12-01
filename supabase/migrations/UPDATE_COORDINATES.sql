-- =============================================
-- EJECUTAR EN EL SQL EDITOR DE SUPABASE
-- Actualiza coordenadas de los eventos
-- =============================================

-- MORAT EN AREQUIPA - Arequipa
UPDATE events 
SET latitude = -16.409 + (random() - 0.5) * 0.005,
    longitude = -71.5375 + (random() - 0.5) * 0.005
WHERE title LIKE '%MORAT%AREQUIPA%';

-- VIBRA PERÚ 2025 - Estadio Nacional
UPDATE events 
SET latitude = -12.0668 + (random() - 0.5) * 0.005,
    longitude = -77.0343 + (random() - 0.5) * 0.005
WHERE title LIKE '%VIBRA PERÚ%';

-- LOS FABULOSOS CADILLACS - Arena Perú
UPDATE events 
SET latitude = -12.0256 + (random() - 0.5) * 0.005,
    longitude = -76.9186 + (random() - 0.5) * 0.005
WHERE title LIKE '%FABULOSOS CADILLACS%';

-- SEBASTIÁN YATRA - Arena Perú
UPDATE events 
SET latitude = -12.0256 + (random() - 0.5) * 0.008,
    longitude = -76.9186 + (random() - 0.5) * 0.008
WHERE title LIKE '%SEBASTIÁN YATRA%';

-- YAN BLOCK - Estadio Nacional
UPDATE events 
SET latitude = -12.0668 + (random() - 0.5) * 0.008,
    longitude = -77.0343 + (random() - 0.5) * 0.008
WHERE title LIKE '%YAN BLOCK%';

-- SIN BANDERA - Arena Perú
UPDATE events 
SET latitude = -12.0256 + (random() - 0.5) * 0.01,
    longitude = -76.9186 + (random() - 0.5) * 0.01
WHERE title LIKE '%SIN BANDERA%';

-- JASON MRAZ - Gran Teatro Nacional
UPDATE events 
SET latitude = -12.0886 + (random() - 0.5) * 0.005,
    longitude = -76.9978 + (random() - 0.5) * 0.005
WHERE title LIKE '%JASON MRAZ%';

-- LA GRANJA DE ZENÓN - Centro de Convenciones Maria Angola (Miraflores)
UPDATE events 
SET latitude = -12.1216 + (random() - 0.5) * 0.005,
    longitude = -77.0288 + (random() - 0.5) * 0.005
WHERE title LIKE '%GRANJA DE ZENÓN%';

-- AIR SUPPLY - Gran Teatro Nacional
UPDATE events 
SET latitude = -12.0886 + (random() - 0.5) * 0.008,
    longitude = -76.9978 + (random() - 0.5) * 0.008
WHERE title LIKE '%AIR SUPPLY%';

-- CASCANUECES - Gran Teatro Nacional
UPDATE events 
SET latitude = -12.0886 + (random() - 0.5) * 0.01,
    longitude = -76.9978 + (random() - 0.5) * 0.01
WHERE title LIKE '%CASCANUECES%';

-- ANUEL AA - Arena Perú (Ate)
UPDATE events 
SET latitude = -12.0256 + (random() - 0.5) * 0.012,
    longitude = -76.9186 + (random() - 0.5) * 0.012
WHERE title LIKE '%ANUEL%';

-- ROPOPONPOM - Surco
UPDATE events 
SET latitude = -12.1387 + (random() - 0.5) * 0.005,
    longitude = -76.9853 + (random() - 0.5) * 0.005
WHERE title LIKE '%ROPOPONPOM%';

-- CNCO - Arena Perú
UPDATE events 
SET latitude = -12.0256 + (random() - 0.5) * 0.015,
    longitude = -76.9186 + (random() - 0.5) * 0.015
WHERE title LIKE '%CNCO%';

-- Verificar los cambios
SELECT title, district, latitude, longitude 
FROM events 
ORDER BY title;
