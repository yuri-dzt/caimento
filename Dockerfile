# ---- base: Node + OpenSSL (Prisma) ----
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- build: devDeps + compila client (vite) e server (tsc) ----
FROM base AS build
COPY package.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate
COPY . .
RUN npm run build:client && npm run build:server

# ---- prod-deps: só dependências de runtime ----
FROM base AS prod-deps
COPY package.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# ---- production: 1 processo serve API + front ----
FROM base AS production
RUN apt-get update -y && apt-get install -y tzdata wget && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
COPY package.json ./
COPY prisma ./prisma/
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server/generated ./dist/server/generated
EXPOSE ${PORT}
# CMD definido no docker-compose.yml
