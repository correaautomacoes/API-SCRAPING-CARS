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

module.exports = { normalizeAd };


