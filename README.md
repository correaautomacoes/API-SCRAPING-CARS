# 🚗 API de Scraping de Anúncios de Carros

API completa para fazer scraping de anúncios de carros nas plataformas **OLX**, **Webmotors** e **iCarros**.

## 📋 Funcionalidades

- ✅ Scraping simultâneo em 3 plataformas
- ✅ Filtros por cidade e região
- ✅ Limite configurável de resultados
- ✅ Rate limiting para proteção
- ✅ Tratamento de erros robusto
- ✅ Logs detalhados
- ✅ Headers de navegador para evitar bloqueios
- ✅ Normalização de dados
- ✅ Ordenação por relevância

## 🚀 Instalação

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Passos
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (opcional)
cp .env.example .env

# 3. Iniciar servidor
npm start

# 4. Para desenvolvimento
npm run dev
```

## 📡 Endpoints

### POST `/api/scrape`
Endpoint principal para fazer scraping de anúncios.

#### Parâmetros de entrada (JSON):
```json
{
  "query": "ford ka 2018",
  "ano": "2018",
  "modelo": "ford ka",
  "cidade": "São Paulo",
  "limit": 10
}
```

#### Parâmetros:
- **`query`** (string, opcional): Query completa de busca
- **`ano`** (string, opcional): Ano do veículo
- **`modelo`** (string, opcional): Modelo do veículo
- **`cidade`** (string, opcional): Cidade para filtrar resultados
- **`limit`** (number, opcional): Limite de anúncios por plataforma (1-50, padrão: 10)

**Nota**: É obrigatório informar `query` OU `modelo`.

#### Exemplo de uso:
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "modelo": "ford ka",
    "ano": "2018",
    "cidade": "São Paulo",
    "limit": 15
  }'
```

### GET `/api/scrape/status`
Verifica o status dos serviços de scraping.

### GET `/health`
Health check da API.

### GET `/`
Informações sobre a API.

## 📊 Resposta da API

### Sucesso (200):
```json
{
  "success": true,
  "query": "ford ka 2018",
  "cidade": "São Paulo",
  "totalResults": 25,
  "results": [
    {
      "id": "olx_1234567890_0",
      "title": "Ford Ka 2018/2019 1.0 SE",
      "price": "45.000",
      "location": "São Paulo, SP",
      "description": "Carro em excelente estado...",
      "image": "https://...",
      "url": "https://www.olx.com.br/...",
      "year": "2018",
      "mileage": "45.000 km",
      "fuel": "Flex",
      "transmission": "Manual",
      "color": "Branco",
      "platform": "OLX",
      "scrapedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "platforms": {
      "OLX": {
        "status": "success",
        "adsCount": 10
      },
      "Webmotors": {
        "status": "success",
        "adsCount": 8
      },
      "iCarros": {
        "status": "success",
        "adsCount": 7
      }
    },
    "executionTime": 2500
  }
}
```

### Erro (400/500):
```json
{
  "error": "Parâmetros obrigatórios",
  "message": "É necessário informar 'query' ou 'modelo' para realizar a busca",
  "required": ["query ou modelo"],
  "optional": ["ano", "cidade", "limit"]
}
```

## 🔧 Configuração para n8n

### Node HTTP Request
Configure o nó HTTP Request no n8n com:

- **Method**: POST
- **URL**: `http://localhost:3000/api/scrape`
- **Headers**: 
  - `Content-Type: application/json`
- **Body**: JSON
```json
{
  "modelo": "{{ $json.modelo }}",
  "ano": "{{ $json.ano }}",
  "cidade": "{{ $json.cidade }}",
  "limit": 10
}
```

### Exemplo de integração:
```javascript
// No n8n, você pode usar:
{
  "modelo": "ford ka",
  "ano": "2018",
  "cidade": "São Paulo",
  "limit": 15
}
```

## 🛡️ Segurança

- **Rate Limiting**: 10 requisições por minuto por IP
- **Headers de Segurança**: Helmet.js configurado
- **CORS**: Configurado para permitir requisições
- **Validação**: Validação de parâmetros de entrada
- **Timeout**: 30 segundos por requisição

## 📝 Logs

A API gera logs detalhados para:
- Requisições recebidas
- Início e conclusão de scraping
- Erros e avisos
- Performance (tempo de execução)

## 🔍 Plataformas Suportadas

### OLX
- URL: `https://www.olx.com.br/veiculos/carros`
- Seletores CSS adaptativos
- Filtros por região

### Webmotors
- URL: `https://www.webmotors.com.br/carros`
- Seletores específicos da plataforma
- Informações detalhadas dos veículos

### iCarros
- URL: `https://www.icarros.com.br/comprar/carros`
- Seletores robustos
- Dados completos dos anúncios

## ⚠️ Limitações e Considerações

1. **Seletores CSS**: Podem mudar com atualizações das plataformas
2. **Rate Limiting**: Respeite os limites das plataformas
3. **Robots.txt**: Considere as políticas de cada site
4. **Performance**: Scraping simultâneo pode ser lento em conexões lentas
5. **Dados**: Nem todos os anúncios podem ter todas as informações

## 🚨 Troubleshooting

### Erro "Não foi possível encontrar anúncios"
- Verifique se a query está correta
- Teste com termos mais genéricos
- Verifique se a plataforma não está bloqueando

### Erro de timeout
- Aumente o `REQUEST_TIMEOUT` no código
- Verifique sua conexão com a internet

### Poucos resultados
- Reduza o filtro de cidade
- Use termos mais genéricos
- Aumente o limite de resultados

## 📈 Monitoramento

A API inclui:
- Health checks automáticos
- Métricas de performance
- Status das plataformas
- Logs estruturados

## 🤝 Contribuição

Para contribuir:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Abra uma issue no repositório
- Consulte a documentação da API
- Verifique os logs de erro

---

**Desenvolvido por Grupo InnovTecno** 🚀
