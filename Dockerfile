# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar dependências (incluindo dev para executar seed)
RUN pnpm install --frozen-lockfile

# Copiar arquivos compilados do stage anterior
COPY --from=builder /app/dist ./dist

# Copiar código fonte para executar seed
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.build.json ./tsconfig.build.json

# Instalar cliente PostgreSQL para healthcheck
RUN apk add --no-cache postgresql-client

# Copiar script de entrypoint
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Expor porta
EXPOSE 3000

# Usar entrypoint para inicialização automática
ENTRYPOINT ["./entrypoint.sh"]
