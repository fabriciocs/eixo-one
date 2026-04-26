FROM node:22-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/api_node/package.json backend/api_node/package.json
COPY packages/shared_contracts/package.json packages/shared_contracts/package.json

RUN npm ci

COPY backend/api_node backend/api_node
COPY packages/shared_contracts packages/shared_contracts

RUN npm run build -w @eixoone/shared-contracts \
  && npm run build -w @eixoone/api-node

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json package-lock.json ./
COPY backend/api_node/package.json backend/api_node/package.json
COPY packages/shared_contracts/package.json packages/shared_contracts/package.json

RUN npm ci --omit=dev

COPY --from=build /workspace/backend/api_node/dist ./backend/api_node/dist
COPY --from=build /workspace/packages/shared_contracts/dist ./packages/shared_contracts/dist

CMD ["node", "backend/api_node/dist/index.js"]
