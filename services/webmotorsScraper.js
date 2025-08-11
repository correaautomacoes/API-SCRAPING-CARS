const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeAd } = require('./scrapingService');

/**
 * Scraper para a plataforma Webmotors
 * @param {string} query - Query de busca
 * @param {string} cidade - Cidade para filtrar
 * @param {number} limit - Limite de anúncios
 * @returns {Object} Anúncios encontrados
 */
async function scrapeWebmotors(query, cidade, limit = 10) {
  try {
    console.log(`🔍 Webmotors: Iniciando scraping para "${query}"`);
    
    // Construir URL de busca
    const searchQuery = encodeURIComponent(query);
    const locationQuery = cidade ? encodeURIComponent(cidade) : '';
    
    let searchUrl = `https://www.webmotors.com.br/carros?q=${searchQuery}`;
    
    if (locationQuery) {
      searchUrl += `&localizacao=${locationQuery}`;
    }
    
    console.log(`🌐 Webmotors: URL de busca: ${searchUrl}`);
    
    // Headers para simular navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      'Referer': 'https://www.webmotors.com.br/'
    };
    
    // Fazer requisição
    const response = await axios.get(searchUrl, { 
      headers,
      timeout: 30000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parsear HTML
    const $ = cheerio.load(response.data);
    const ads = [];
    
    // Seletores específicos da Webmotors
    const adSelectors = [
      '[data-testid="card-vehicle"]', // Seletor principal
      '.card-vehicle', // Seletor alternativo
      '.vehicle-card', // Seletor alternativo 2
      '[data-testid="vehicle-card"]', // Seletor de teste
      '.card' // Seletor genérico
    ];
    
    let adElements = null;
    for (const selector of adSelectors) {
      adElements = $(selector);
      if (adElements.length > 0) {
        console.log(`✅ Webmotors: Encontrados ${adElements.length} anúncios com seletor: ${selector}`);
        break;
      }
    }
    
    if (!adElements || adElements.length === 0) {
      console.log('⚠️ Webmotors: Nenhum anúncio encontrado com seletores padrão, tentando seletores alternativos...');
      
      // Tentar seletores mais genéricos
      adElements = $('a[href*="/carros/"]').filter((i, el) => {
        const href = $(el).attr('href');
        return href && href.includes('/carros/') && !href.includes('javascript:');
      });
    }
    
    if (!adElements || adElements.length === 0) {
      throw new Error('Não foi possível encontrar anúncios na página da Webmotors');
    }
    
    // Processar anúncios encontrados
    adElements.each((index, element) => {
      if (ads.length >= limit) return false; // Parar quando atingir o limite
      
      try {
        const $ad = $(element);
        
        // Extrair informações básicas
        const title = $ad.find('[data-testid="vehicle-title"], .vehicle-title, h2, h3').first().text().trim();
        const price = $ad.find('[data-testid="vehicle-price"], .vehicle-price, .price').first().text().trim();
        const location = $ad.find('[data-testid="vehicle-location"], .vehicle-location, .location').first().text().trim();
        
        // Extrair URL
        let url = $ad.attr('href');
        if (url && !url.startsWith('http')) {
          url = `https://www.webmotors.com.br${url}`;
        }
        
        // Extrair imagem
        const image = $ad.find('img').first().attr('src') || 
                     $ad.find('img').first().attr('data-src') ||
                     $ad.find('img').first().attr('data-lazy-src');
        
        // Extrair informações adicionais
        const description = $ad.find('[data-testid="vehicle-description"], .vehicle-description, .description').first().text().trim();
        
        // Extrair ano e quilometragem
        const year = $ad.find('[data-testid="vehicle-year"], .vehicle-year, .year').first().text().trim();
        const mileage = $ad.find('[data-testid="vehicle-mileage"], .vehicle-mileage, .mileage').first().text().trim();
        
        // Extrair combustível e câmbio
        const fuel = $ad.find('[data-testid="vehicle-fuel"], .vehicle-fuel, .fuel').first().text().trim();
        const transmission = $ad.find('[data-testid="vehicle-transmission"], .vehicle-transmission, .transmission').first().text().trim();
        
        // Criar objeto do anúncio
        const ad = {
          id: `webmotors_${Date.now()}_${index}`,
          title: title || 'Título não disponível',
          price: cleanPrice(price),
          location: cleanLocation(location),
          description: description || 'Descrição não disponível',
          image: image || null,
          url: url || null,
          year: year || null,
          mileage: mileage || null,
          fuel: fuel || null,
          transmission: transmission || null,
          platform: 'Webmotors',
          scrapedAt: new Date().toISOString()
        };
        
        // Só adicionar se tiver pelo menos título ou preço
        if (ad.title !== 'Título não disponível' || ad.price !== 'Preço não informado') {
          ads.push(normalizeAd(ad, 'Webmotors'));
        }
        
      } catch (adError) {
        console.warn(`⚠️ Webmotors: Erro ao processar anúncio ${index}:`, adError.message);
      }
    });
    
    console.log(`✅ Webmotors: Scraping concluído com ${ads.length} anúncios válidos`);
    
    return {
      ads,
      platform: 'Webmotors',
      totalFound: ads.length
    };
    
  } catch (error) {
    console.error(`❌ Webmotors: Erro no scraping:`, error.message);
    throw new Error(`Falha no scraping da Webmotors: ${error.message}`);
  }
}

/**
 * Função auxiliar para extrair preço limpo
 * @param {string} priceText - Texto do preço
 * @returns {string} Preço limpo
 */
function cleanPrice(priceText) {
  if (!priceText) return 'Preço não informado';
  
  // Remover texto extra e manter apenas números, vírgulas e pontos
  const cleanPrice = priceText
    .replace(/[^\d,.]/g, '')
    .replace(/^[,.]|[,.]$/g, '') // Remover vírgulas e pontos no início e fim
    .trim();
    
  return cleanPrice || 'Preço não informado';
}

/**
 * Função auxiliar para extrair localização limpa
 * @param {string} locationText - Texto da localização
 * @returns {string} Localização limpa
 */
function cleanLocation(locationText) {
  if (!locationText) return 'Localização não informada';
  
  return locationText
    .replace(/\s+/g, ' ') // Remover espaços múltiplos
    .replace(/^\s+|\s+$/g, '') // Remover espaços no início e fim
    .trim();
}

/**
 * Função auxiliar para extrair ano limpo
 * @param {string} yearText - Texto do ano
 * @returns {string} Ano limpo
 */
function cleanYear(yearText) {
  if (!yearText) return null;
  
  // Extrair apenas números (ano)
  const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? yearMatch[0] : null;
}

/**
 * Função auxiliar para extrair quilometragem limpa
 * @param {string} mileageText - Texto da quilometragem
 * @returns {string} Quilometragem limpa
 */
function cleanMileage(mileageText) {
  if (!mileageText) return null;
  
  // Extrair apenas números e "km"
  const mileageMatch = mileageText.match(/(\d+(?:\.\d+)?)\s*km/i);
  return mileageMatch ? `${mileageMatch[1]} km` : mileageText.trim();
}

module.exports = {
  scrapeWebmotors,
  cleanPrice,
  cleanLocation,
  cleanYear,
  cleanMileage
};
