const cron = require('node-cron');
const { generarAlertasLogisticas } = require('./alertasServicio');

// Ejecutar todos los días a las 09:00, hora de Chile
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('[Cron] Revisando alertas logísticas...');

    const total = await generarAlertasLogisticas();

    console.log(`[Cron] Eventos procesados: ${total}`);
  } catch (error) {
    console.error('[Cron] Error al generar alertas:', error);
  }
}, {
  timezone: 'America/Santiago',
  noOverlap: true
});

console.log('[Cron] Motor de alertas programado para las 09:00 de Chile.');