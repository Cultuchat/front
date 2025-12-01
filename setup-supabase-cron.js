const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupCron() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Configurando pg_cron en Supabase...\n');

  try {
    // Habilitar extensiones
    console.log('1. Habilitando extensiones pg_cron y http...');
    const { error: ext1Error } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
    });

    if (ext1Error && !ext1Error.message.includes('does not exist')) {
      // Intentar directamente con la query
      const { error: directError1 } = await supabase
        .from('_sql')
        .select('*')
        .limit(0);

      console.log('   ⚠️  No se puede ejecutar SQL directamente desde aquí.');
      console.log('   📝 Necesitas ejecutar el SQL manualmente en Supabase SQL Editor.\n');
      console.log('   🔗 Ve a: https://supabase.com/dashboard/project/fohgxzyyzfqzbgckucxy/sql\n');
      console.log('   📋 SQL a ejecutar:\n');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`
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

-- Verificar que se creó correctamente
SELECT * FROM cron.job;
      `);
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('   ⚠️  IMPORTANTE: Reemplaza la URL con tu URL real de Vercel\n');
      console.log('   ✅ Después de ejecutar, verifica que aparece en la tabla cron.job\n');

      process.exit(1);
    }

    console.log('   ✅ Extensiones habilitadas');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Necesitas ejecutar el SQL manualmente en Supabase SQL Editor.');
    console.log('🔗 Ve a: https://supabase.com/dashboard/project/fohgxzyyzfqzbgckucxy/sql\n');
    process.exit(1);
  }
}

setupCron();
