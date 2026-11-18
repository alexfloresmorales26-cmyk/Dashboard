FROM node:lts-alpine
WORKDIR /usr/src/app

# Las devDependencies (vite) son necesarias para el build
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
CMD ["npx", "vite", "preview", "--host", "--port", "3000"]
