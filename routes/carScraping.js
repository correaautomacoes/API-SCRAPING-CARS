const express = require('express');
const router = express.Router();
const { scrapeCarAds } = require('../services/scrapingService');

/**
 * @route POST /api/scrape
 * @desc Faz scraping de anúncios de carros nas plataformas OLX, Webmotors e iCarros
 * @access Public
 */
router.post('/scrape', async (req, res) => {
  try {
    const { query, ano, modelo, cidade, limit = 10 } = req.body;

    // Validação dos parâmetros obrigatórios
    if (!query && !modelo) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios',
        message: 'É necessário informar "query" ou "modelo" para realizar a busca',
        required: ['query ou modelo'],
        optional: ['ano', 'cidade', 'limit']
      });
    }

    // Validação do limite
    if (limit && (limit < 1 || limit > 50)) {
      return res.status(400).json({
        error: 'Limite inválido',
        message: 'O limite deve estar entre 1 e 50 anúncios'
      });
    }

    // Construir query de busca
    const searchQuery = query || `${modelo} ${ano || ''}`.trim();
    
    console.log(`🔍 Iniciando scraping para: "${searchQuery}" em "${cidade || 'Brasil'}"`);

    // Executar scraping
    const results = await scrapeCarAds(searchQuery, cidade, limit);

    // Resposta de sucesso
    res.json({
      success: true,
      query: searchQuery,
      cidade: cidade || 'Brasil',
      totalResults: results.totalResults,
      results: results.ads,
      metadata: {
        timestamp: new Date().toISOString(),
        platforms: results.platforms,
        executionTime: results.executionTime
      }
    });

  } catch (error) {
    console.error('Erro no scraping:', error);
    
    res.status(500).json({
      error: 'Erro durante o scraping',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/scrape/status
 * @desc Retorna o status dos serviços de scraping
 * @access Public
 */
router.get('/scrape/status', (req, res) => {
  res.json({
    status: 'operational',
    platforms: {
      olx: 'operational',
      webmotors: 'operational',
      icarros: 'operational'
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
