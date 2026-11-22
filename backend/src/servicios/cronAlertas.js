const cron = require('node-cron');
const { generarAlertasLogisticas } = require('./alertasServicio');

const revisarAlertasLogisticas = async () => {
  try {
    console.log('[Alertas] Revisando alertas logísticas...');
    const eventos = await generarAlertasLogisticas();
    console.log(`[Alertas] Eventos procesados: ${eventos.length}`);
  } catch (error) {
    console.error('[Alertas] Error al generar alertas:', error);
  }
};

// Ejecutar todos los días a las 09:00, hora de Chile
cron.schedule('0 9 * * *', revisarAlertasLogisticas, {
  timezone: 'America/Santiago',
  noOverlap: true
});

console.log('[Cron] Motor de alertas programado para las 09:00 de Chile.');

module.exports = { revisarAlertasLogisticas };
