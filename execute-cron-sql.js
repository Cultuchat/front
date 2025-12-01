require('dotenv').config();
const fs = require('fs');

async function executeSQLViaAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔧 Ejecutando SQL para configurar pg_cron en Supabase...\n');

  // Leer el archivo SQL
  const sql = fs.readFileSync('./supabase/setup-cron.sql', 'utf8');

  console.log('📋 SQL a ejecutar:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(sql);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Usar fetch para ejecutar query directa
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.log('⚠️  No se pudo ejecutar automáticamente.');
      console.log(`   Status: ${response.status} ${response.statusText}\n`);
      throw new Error('No se puede ejecutar SQL via API');
    }

    const data = await response.json();
    console.log('✅ SQL ejecutado correctamente!');
    console.log('📊 Resultado:', data);

  } catch (error) {
    console.log('⚠️  No se puede ejecutar SQL automáticamente via API\n');
    console.log('📝 SOLUCIÓN: Ejecutar manualmente en Supabase SQL Editor\n');
    console.log('🔗 URL directa: https://supabase.com/dashboard/project/fohgxzyyzfqzbgckucxy/sql/new\n');
    console.log('📋 Pasos:');
    console.log('   1. Abre el link de arriba');
    console.log('   2. Copia el SQL de arriba (está en setup-cron.sql)');
    console.log('   3. Pega en el SQL Editor');
    console.log('   4. Reemplaza la URL con tu URL real de Vercel');
    console.log('   5. Click en "Run"\n');
    console.log('✅ Verifica con: SELECT * FROM cron.job;\n');
  }
}

executeSQLViaAPI();
