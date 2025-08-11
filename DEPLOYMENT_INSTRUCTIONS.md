# 🚗 Instruções de Deploy - API de Scraping de Veículos

## 📋 Pré-requisitos

1. **Portainer** configurado e funcionando
2. **Rede Docker** `jnunesfiorimnet` criada
3. **Porta 3000** disponível no servidor

## 🔧 Configuração

### 1. Criar arquivo `.env` na raiz do projeto:

```bash
# Configurações da API
NODE_ENV=production
PORT=3000
TZ=America/Sao_Paulo

# Configurações de Segurança
CORS_ORIGIN=*
RATE_LIMIT_POINTS=10
RATE_LIMIT_DURATION=60

# Configurações de Scraping
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_ARGS=--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage

# Configurações de Performance
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000

# Configurações do Redis (opcional)
REDIS_HOST=redis_cache
REDIS_PORT=6379
REDIS_DB=0
```

### 2. Configurar porta (opcional):

Se quiser usar uma porta diferente da 3000, altere no `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Porta externa 8080, interna 3000
```

## 🚀 Deploy no Portainer

### Opção 1: Via Stack (Recomendado)

1. Acesse o Portainer
2. Vá em **Stacks** → **Add stack**
3. Nome: `car-scraping-api`
4. Cole o conteúdo do `docker-compose.yml`
5. Clique em **Deploy the stack**

### Opção 2: Via Container Individual

1. Acesse o Portainer
2. Vá em **Containers** → **Add container**
3. Configure conforme o docker-compose.yml

## 📊 Monitoramento

### Health Check
A API possui endpoint de health check:
- **URL**: `http://SEU_IP:3000/health`
- **Método**: GET
- **Resposta**: Status da API

### Logs
```bash
# Ver logs da API
docker logs car_scraping_api

# Ver logs do Redis
docker logs redis_cache_cars
```

## 🔍 Testes

### 1. Testar Health Check:
```bash
curl http://SEU_IP:3000/health
```

### 2. Testar Endpoint Principal:
```bash
curl http://SEU_IP:3000/
```

### 3. Testar Scraping:
```bash
curl -X POST http://SEU_IP:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"platform": "olx", "search": "honda civic"}'
```

## ⚠️ Considerações Importantes

### Recursos
- **CPU**: Mínimo 0.5, Recomendado 1.0
- **RAM**: Mínimo 1GB, Recomendado 2GB (para Puppeteer)
- **Disco**: Mínimo 1GB para logs e cache

### Segurança
- A API está configurada com rate limiting
- CORS configurado para produção
- Helmet para headers de segurança
- Usuário não-root no container

### Performance
- Redis opcional para cache
- Puppeteer otimizado para containers
- Health checks automáticos

## 🐛 Troubleshooting

### Container não inicia
1. Verificar logs: `docker logs car_scraping_api`
2. Verificar recursos disponíveis
3. Verificar rede `jnunesfiorimnet`

### Erro de Puppeteer
1. Verificar se o container tem memória suficiente
2. Verificar se as flags do Chromium estão corretas
3. Verificar logs do container

### Erro de Porta
1. Verificar se a porta 3000 está disponível
2. Verificar se não há firewall bloqueando
3. Verificar se a porta não está sendo usada por outro serviço

## 📝 Endpoints Disponíveis

- `GET /` - Informações da API
- `GET /health` - Status da API
- `POST /api/scrape` - Scraping de anúncios
  - Plataformas: OLX, Webmotors, iCarros

## 🔄 Atualizações

Para atualizar a API:
1. Fazer pull das mudanças
2. Rebuild da imagem: `docker-compose build`
3. Redeploy da stack no Portainer

## 📞 Suporte

Em caso de problemas:
1. Verificar logs dos containers
2. Verificar recursos do sistema
3. Verificar configuração do Traefik
4. Verificar conectividade de rede
