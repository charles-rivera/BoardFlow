FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN yarn install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/

WORKDIR /app/packages/backend

CMD ["yarn", "start"]
