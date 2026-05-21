# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests and install packages using npm ci for deterministic builds
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files and build the production bundle
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy built assets from Stage 1 to the Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run defaults to port 8080 and injects it as an environment variable
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
