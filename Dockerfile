FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/tsconfig.json ./backend/
COPY backend/src/prisma/schema.prisma ./backend/src/prisma/

RUN npm ci

COPY backend ./backend

RUN npx prisma generate --schema=backend/src/prisma/schema.prisma
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/prisma ./backend/src/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 5001 3001 3000

CMD ["node", "backend/dist/server.js"]
