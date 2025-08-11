const { scrapeOLX } = require('./olxScraper');
const { scrapeWebmotors } = require('./webmotorsScraper');
const { scrapeICarros } = require('./icarrosScraper');

/**
 * Serviço principal de scraping que coordena as três plataformas
 * @param {string} query - Query de busca
 * @param {string} cidade - Cidade para filtrar resultados
 * @param {number} limit - Limite de anúncios por plataforma
 * @returns {Object} Resultados consolidados
 */
async function scrapeCarAds(query, cidade, limit = 10) {
  const startTime = Date.now();
  const results = {
    ads: [],
    totalResults: 0,
    platforms: {},
    executionTime: 0
  };

  try {
    console.log(`🚀 Iniciando scraping para: "${query}"`);
    
    // Executar scraping em paralelo para melhor performance
    const scrapingPromises = [
      scrapeOLX(query, cidade, limit).catch(err => {
        console.error('❌ Erro no scraping da OLX:', err.message);
        return { ads: [], platform: 'OLX', error: err.message };
      }),
      scrapeWebmotors(query, cidade, limit).catch(err => {
        console.error('❌ Erro no scraping da Webmotors:', err.message);
        return { ads: [], platform: 'Webmotors', error: err.message };
      }),
      scrapeICarros(query, cidade, limit).catch(err => {
        console.error('❌ Erro no scraping da iCarros:', err.message);
        return { ads: [], platform: 'iCarros', error: err.message };
      })
    ];

    // Aguardar todos os resultados
    const platformResults = await Promise.allSettled(scrapingPromises);
    
    // Processar resultados
    platformResults.forEach((result, index) => {
      const platformNames = ['OLX', 'Webmotors', 'iCarros'];
      const platformName = platformNames[index];
      
      if (result.status === 'fulfilled') {
        const platformData = result.value;
        
        if (platformData.error) {
          results.platforms[platformName] = {
            status: 'error',
            error: platformData.error,
            adsCount: 0
          };
        } else {
          results.platforms[platformName] = {
            status: 'success',
            adsCount: platformData.ads.length
          };
          
          // Adicionar anúncios ao resultado consolidado
          results.ads.push(...platformData.ads);
        }
      } else {
        results.platforms[platformName] = {
          status: 'error',
          error: result.reason.message,
          adsCount: 0
        };
      }
    });

    // Ordenar anúncios por relevância (preço, data, etc.)
    results.ads = sortAdsByRelevance(results.ads);
    
    // Limitar o total de resultados se necessário
    if (results.ads.length > limit * 3) {
      results.ads = results.ads.slice(0, limit * 3);
    }
    
    results.totalResults = results.ads.length;
    results.executionTime = Date.now() - startTime;
    
    console.log(`✅ Scraping concluído: ${results.totalResults} anúncios encontrados em ${results.executionTime}ms`);
    
    return results;

  } catch (error) {
    console.error('💥 Erro geral no scraping:', error);
    throw new Error(`Falha no scraping: ${error.message}`);
  }
}

/**
 * Ordena os anúncios por relevância
 * @param {Array} ads - Array de anúncios
 * @returns {Array} Array ordenado
 */
function sortAdsByRelevance(ads) {
  return ads.sort((a, b) => {
    // Priorizar anúncios com preço
    if (a.price && !b.price) return -1;
    if (!a.price && b.price) return 1;
    
    // Se ambos têm preço, ordenar por preço (menor primeiro)
    if (a.price && b.price) {
      const priceA = parseFloat(a.price.replace(/[^\d,]/g, '').replace(',', '.'));
      const priceB = parseFloat(b.price.replace(/[^\d,]/g, '').replace(',', '.'));
      if (!isNaN(priceA) && !isNaN(priceB)) {
        return priceA - priceB;
      }
    }
    
    // Priorizar anúncios com mais informações
    const infoA = Object.keys(a).filter(key => a[key] && a[key] !== '').length;
    const infoB = Object.keys(b).filter(key => b[key] && b[key] !== '').length;
    return infoB - infoA;
  });
}

/**
 * Normaliza dados de anúncios para formato padrão
 * @param {Object} ad - Anúncio original
 * @param {string} platform - Nome da plataforma
 * @returns {Object} Anúncio normalizado
 */
function normalizeAd(ad, platform) {
  return {
    id: ad.id || `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: ad.title || 'Título não disponível',
    price: ad.price || 'Preço não informado',
    location: ad.location || 'Localização não informada',
    description: ad.description || 'Descrição não disponível',
    image: ad.image || null,
    url: ad.url || null,
    year: ad.year || null,
    mileage: ad.mileage || null,
    fuel: ad.fuel || null,
    transmission: ad.transmission || null,
    color: ad.color || null,
    platform: platform,
    scrapedAt: new Date().toISOString()
  };
}

module.exports = {
  scrapeCarAds,
  normalizeAd,
  sortAdsByRelevance
};
