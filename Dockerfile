# 1️⃣ Build Stage
FROM node:alpine AS builder
WORKDIR /app

# Copy only package.json first to cache dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the files and build
COPY . .
RUN npm run build

# 2️⃣ Serve Stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 since Nginx runs on 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

