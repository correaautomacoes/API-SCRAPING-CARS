const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { normalizeAd } = require('./adUtils');

/**
 * Scraper para a plataforma OLX
 * @param {string} query - Query de busca
 * @param {string} cidade - Cidade para filtrar
 * @param {number} limit - Limite de anúncios
 * @returns {Object} Anúncios encontrados
 */
async function scrapeOLX(query, cidade, limit = 10) {
  try {
    console.log(`🔍 OLX: Iniciando scraping para "${query}"`);
    
    // Construir URL de busca
    const searchQuery = encodeURIComponent(query);
    const locationQuery = cidade ? encodeURIComponent(cidade) : '';
    
    let searchUrl = `https://www.olx.com.br/estado-sp/regiao-de-sao-paulo/veiculos/carros?q=${searchQuery}`;
    
    if (locationQuery) {
      searchUrl += `&location=${locationQuery}`;
    }
    
    console.log(`🌐 OLX: URL de busca: ${searchUrl}`);
    
    // Headers para simular navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };
    
    // Fazer requisição HTTP; se falhar/403, usar Puppeteer
    let response;
    try {
      response = await axios.get(searchUrl, {
        headers,
        timeout: 30000,
        validateStatus: (status) => status < 500,
      });
    } catch (httpErr) {
      console.warn('⚠️ OLX: Falha HTTP, tentando Puppeteer...', httpErr.message);
    }

    let html = response && response.status === 200 ? response.data : null;
    if (!html || (response && response.status === 403)) {
      console.log('🕵️ OLX: Fallback com Puppeteer...');
      html = await fetchHtmlWithPuppeteer(searchUrl, 'https://www.olx.com.br/');
    }

    // Parsear HTML
    const $ = cheerio.load(html || '');
    const ads = [];
    
    // Seletores específicos da OLX (podem mudar com o tempo)
    const adSelectors = [
      '[data-cy="l-card"]', // Seletor principal
      '.sc-1wimjbb-1', // Seletor alternativo
      '.sc-1wimjbb-0', // Seletor alternativo 2
      '[data-testid="ad-card"]' // Seletor de teste
    ];
    
    let adElements = null;
    for (const selector of adSelectors) {
      adElements = $(selector);
      if (adElements.length > 0) {
        console.log(`✅ OLX: Encontrados ${adElements.length} anúncios com seletor: ${selector}`);
        break;
      }
    }
    
    if (!adElements || adElements.length === 0) {
      console.log('⚠️ OLX: Nenhum anúncio encontrado com seletores padrão, tentando seletores alternativos...');
      
      // Tentar seletores mais genéricos
      adElements = $('a[href*="/veiculos/carros/"]').filter((i, el) => {
        const href = $(el).attr('href');
        return href && href.includes('/veiculos/carros/') && !href.includes('javascript:');
      });
    }

    // Reforço: se ainda não encontrar nada, refaça com Puppeteer e reparseie
    if (!adElements || adElements.length === 0) {
      console.log('🔄 OLX: Reforçando fallback (carregamento dinâmico) com Puppeteer...');
      const htmlFallback = await fetchHtmlWithPuppeteer(searchUrl, 'https://www.olx.com.br/');
      const $fallback = cheerio.load(htmlFallback || '');
      for (const selector of adSelectors) {
        const candidates = $fallback(selector);
        if (candidates.length > 0) {
          adElements = candidates;
          console.log(`✅ OLX: Encontrados ${adElements.length} anúncios após fallback (seletor: ${selector})`);
          break;
        }
      }
    }
    
    if (!adElements || adElements.length === 0) {
      throw new Error('Não foi possível encontrar anúncios na página da OLX');
    }
    
    // Processar anúncios encontrados
    adElements.each((index, element) => {
      if (ads.length >= limit) return false; // Parar quando atingir o limite
      
      try {
        const $ad = $(element);
        
        // Extrair informações básicas
        const title = $ad.find('h2, .sc-1wimjbb-5, [data-testid="ad-title"]').first().text().trim();
        const price = $ad.find('.sc-1wimjbb-6, [data-testid="ad-price"], .price').first().text().trim();
        const location = $ad.find('.sc-1wimjbb-7, [data-testid="ad-location"], .location').first().text().trim();
        
        // Extrair URL
        let url = $ad.attr('href');
        if (url && !url.startsWith('http')) {
          url = `https://www.olx.com.br${url}`;
        }
        
        // Extrair imagem
        const image = $ad.find('img').first().attr('src') || $ad.find('img').first().attr('data-src');
        
        // Extrair informações adicionais
        const description = $ad.find('.sc-1wimjbb-8, .description').first().text().trim();
        
        // Criar objeto do anúncio
        const ad = {
          id: `olx_${Date.now()}_${index}`,
          title: title || 'Título não disponível',
          price: price || 'Preço não informado',
          location: location || 'Localização não informada',
          description: description || 'Descrição não disponível',
          image: image || null,
          url: url || null,
          platform: 'OLX',
          scrapedAt: new Date().toISOString()
        };
        
        // Só adicionar se tiver pelo menos título ou preço
        if (ad.title !== 'Título não disponível' || ad.price !== 'Preço não informado') {
          ads.push(normalizeAd(ad, 'OLX'));
        }
        
      } catch (adError) {
        console.warn(`⚠️ OLX: Erro ao processar anúncio ${index}:`, adError.message);
      }
    });
    
    console.log(`✅ OLX: Scraping concluído com ${ads.length} anúncios válidos`);
    
    return {
      ads,
      platform: 'OLX',
      totalFound: ads.length
    };
    
  } catch (error) {
    console.error(`❌ OLX: Erro no scraping:`, error.message);
    throw new Error(`Falha no scraping da OLX: ${error.message}`);
  }
}

/**
 * Obtém HTML com Puppeteer para contornar bloqueios 403 e conteúdo dinâmico
 * @param {string} url
 * @param {string} referer
 * @returns {Promise<string>}
 */
async function fetchHtmlWithPuppeteer(url, referer) {
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ];

  const browser = await puppeteer.launch({
    args: launchArgs,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: 'new',
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      ...(referer ? { Referer: referer } : {}),
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);
    return await page.content();
  } catch (err) {
    console.error('❌ OLX: Erro no fallback Puppeteer:', err.message);
    return '';
  } finally {
    await browser.close();
  }
}

/**
 * Função auxiliar para extrair preço limpo
 * @param {string} priceText - Texto do preço
 * @returns {string} Preço limpo
 */
function cleanPrice(priceText) {
  if (!priceText) return 'Preço não informado';
  
  // Remover texto extra e manter apenas números e vírgulas
  const cleanPrice = priceText
    .replace(/[^\d,]/g, '')
    .replace(/^,+|,+$/g, '') // Remover vírgulas no início e fim
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

module.exports = {
  scrapeOLX,
  cleanPrice,
  cleanLocation
};
