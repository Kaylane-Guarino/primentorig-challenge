#!/bin/bash

# Script auxiliar para gerenciar o projeto com Docker

case "$1" in
  "up")
    echo "🚀 Iniciando serviços em produção..."
    docker-compose up -d
    echo "⏳ Aguardando banco de dados ficar pronto..."
    sleep 5
    echo "🌱 Executando seed..."
    docker-compose exec api pnpm seed
    echo "✅ Serviços iniciados! API disponível em http://localhost:3000"
    ;;
  "up:dev")
    echo "🚀 Iniciando serviços em desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up -d
    echo "⏳ Aguardando banco de dados ficar pronto..."
    sleep 5
    echo "🌱 Executando seed..."
    docker-compose -f docker-compose.dev.yml exec api pnpm seed
    echo "✅ Serviços iniciados! API disponível em http://localhost:3000"
    ;;
  "down")
    echo "🛑 Parando serviços..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    echo "✅ Serviços parados!"
    ;;
  "logs")
    if [ "$2" == "dev" ]; then
      docker-compose -f docker-compose.dev.yml logs -f api
    else
      docker-compose logs -f api
    fi
    ;;
  "seed")
    if [ "$2" == "dev" ]; then
      docker-compose -f docker-compose.dev.yml exec api pnpm seed
    else
      docker-compose exec api pnpm seed
    fi
    ;;
  "rebuild")
    echo "🔨 Reconstruindo imagens..."
    docker-compose build --no-cache
    echo "✅ Imagens reconstruídas!"
    ;;
  *)
    echo "Uso: ./docker-scripts.sh {up|up:dev|down|logs|seed|rebuild}"
    echo ""
    echo "Comandos:"
    echo "  up        - Inicia serviços em produção"
    echo "  up:dev    - Inicia serviços em desenvolvimento"
    echo "  down      - Para todos os serviços"
    echo "  logs      - Mostra logs da API (adicione 'dev' para desenvolvimento)"
    echo "  seed      - Executa seed no banco (adicione 'dev' para desenvolvimento)"
    echo "  rebuild   - Reconstrói as imagens Docker"
    exit 1
    ;;
esac
