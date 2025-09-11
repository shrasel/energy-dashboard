# Dev stage for hot-reload in container
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV CHOKIDAR_USEPOLLING=true \
	WATCHPACK_POLLING=true \
	PORT=8888
EXPOSE 8888
CMD ["npm", "start"]

# Use official Node.js image as build environment
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# Use Nginx to serve the build
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]