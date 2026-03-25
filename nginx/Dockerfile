# Stage 1 — Build do frontend Expo Web
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend .

# EXPO_PUBLIC_API_URL vazio = usa a mesma origem (window.location)
ARG EXPO_PUBLIC_API_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

ARG EXPO_PUBLIC_TURNSTILE_SITE_KEY=""
ENV EXPO_PUBLIC_TURNSTILE_SITE_KEY=$EXPO_PUBLIC_TURNSTILE_SITE_KEY

ENV EXPO_PUBLIC_ENV=production

RUN npx expo export --platform web --output-dir /dist

# Stage 2 — Nginx serve o frontend estático e faz proxy do backend
FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /dist /usr/share/nginx/html
