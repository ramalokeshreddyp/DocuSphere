FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tests ./tests
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/app.js"]
