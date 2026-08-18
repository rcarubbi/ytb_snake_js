FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY multiplayer/backend/package.json multiplayer/backend/
COPY multiplayer/client/package.json multiplayer/client/
RUN npm ci

COPY multiplayer/backend/tsconfig.json multiplayer/backend/
COPY multiplayer/backend/src multiplayer/backend/src/
RUN npm run build:server

COPY multiplayer/client/ multiplayer/client/
RUN npm run build:client

FROM node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/multiplayer/backend/dist multiplayer/backend/dist/
COPY --from=build /app/multiplayer/client/out multiplayer/client/out/

EXPOSE 3000
CMD ["node", "multiplayer/backend/dist/server.js"]
