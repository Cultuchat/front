// Script para probar el endpoint de cron manualmente
require('dotenv').config();

const VERCEL_URL = 'https://front-1-tmedaliths-projects.vercel.app';
const CRON_SECRET = 'cron_nyqxmjvqfcbol15eljvutp';

async function testCronEndpoint() {
  console.log('🧪 Probando endpoint de cron...\n');
  console.log(`📍 URL: ${VERCEL_URL}/api/cron/scrape`);
  console.log(`🔐 Token: Bearer ${CRON_SECRET}\n`);

  try {
    const response = await fetch(`${VERCEL_URL}/api/cron/scrape`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Error:', text);

      if (response.status === 404) {
        console.log('\n⚠️  La URL podría ser incorrecta.');
        console.log('   Verifica tu URL real de Vercel con: vercel ls');
        console.log('   Y actualiza el cron job usando UPDATE_CRON_URL.md');
      }

      return;
    }

    const data = await response.json();
    console.log('✅ Respuesta exitosa:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n✅ El endpoint funciona correctamente!');
    console.log('🎯 El cron job ejecutará este endpoint todos los días a medianoche.');

  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    console.log('\n⚠️  Posibles causas:');
    console.log('   1. La URL de Vercel es incorrecta');
    console.log('   2. El deployment aún no está listo');
    console.log('   3. El endpoint /api/cron/scrape no existe');
    console.log('\n💡 Solución:');
    console.log('   - Ejecuta: vercel ls');
    console.log('   - Verifica tu URL real de Vercel');
    console.log('   - Actualiza el cron job si es necesario (ver UPDATE_CRON_URL.md)');
  }
}

testCronEndpoint();
