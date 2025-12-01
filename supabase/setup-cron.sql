-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Programar scraping automático cada día a medianoche (00:00)
SELECT cron.schedule(
  'scrape-events-daily',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://front-1-tmedaliths-projects.vercel.app/api/cron/scrape',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer cron_nyqxmjvqfcbol15eljvutp'
      ),
      body := '{}'::jsonb
    );
  $$
);
