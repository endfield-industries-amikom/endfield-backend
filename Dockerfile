# Build stage
FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Prune to production dependencies
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

# Production stage
FROM node:22-alpine AS production
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only what we need at runtime
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Run as non-root user
USER node

CMD ["node", "dist/main.js"]
