FROM node:lts-alpine AS build

RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN rm -rf ./src/generated/prisma
RUN npx prisma generate
RUN npm run build

FROM node:lts-alpine AS runtime

RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
RUN rm -rf ./src/generated/prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate dev --name init && npx prisma generate && npx prisma db push && npm run start:prod"]
