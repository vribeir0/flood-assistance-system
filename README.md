# Flood Assistance System

Chatbot para situações de alagamento. O usuário informa sua localização e o sistema consulta o clima em tempo real, avalia o risco e, se necessário, gera uma rota de evacuação até um ponto seguro.

## Stack

Backend — Python, Flask, LangGraph, MCP, Google Maps API, Open-Meteo API
Frontend — Expo (React Native Web)
Infra — Docker Compose, Nginx, Gunicorn, Cloudflare (HTTPS)

## Estrutura

```
flood-assistance-system/
├── backend/
│   ├── src/
│   │   ├── domain/       # Modelos de domínio
│   │   ├── gateways/     # Integração com LLM
│   │   ├── routes/       # Eventos WebSocket e rotas HTTP
│   │   ├── usecases/     # Lógica de negócio e MCP
│   │   └── prompts/      # System prompts do agente
│   ├── app.py
│   ├── settings.py
│   ├── server.py         # Servidor MCP
│   └── Dockerfile
├── frontend/             # App Expo Web
├── nginx/
│   ├── nginx.conf        # Config de produção
│   ├── nginx.dev.conf    # Config de desenvolvimento
│   └── Dockerfile
├── docker-compose.yml          # Produção
└── docker-compose.override.yml # Desenvolvimento
```

## Pré-requisitos

- [Docker](https://docs.docker.com/engine/install/) com o plugin Compose
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (só pra rodar o backend local sem Docker)

## Configuração

```bash
git clone https://github.com/seu-usuario/flood-assistance-system.git
cd flood-assistance-system
cp .env.example .env
```

Preencha as chaves de API no `.env`:

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini (obrigatória) |
| `GEMINI_MODEL` | Modelo, ex: `gemini-2.5-flash` |
| `GOOGLE_MAPS_API_KEY` | Chave da API do Google Maps (obrigatória) |
| `GOOGLE_MAPS_API_URL` | URL da Directions API |
| `WEATHER_API_URL` | URL da API de clima (Open-Meteo) |
| `SERVER_PATH` | Caminho para o servidor MCP (padrão: `server.py`) |

## Modo de teste

O chat tem um botão "Modo Teste" no cabeçalho. Quando ativo, o sistema força a classificação de risco para ALTO independente das condições meteorológicas reais. Serve para testar o fluxo de emergência (rota de evacuação, alertas) sem precisar esperar por chuva de verdade.

## Desenvolvimento

Sobe backend, frontend (Expo dev server) e Nginx como proxy:

```bash
docker compose up --build
```

- App: http://localhost
- Frontend dev server: http://localhost:8081 (com hot-reload)
- Backend: http://localhost:5000 (exposto para debug)

## Produção

```bash
docker compose -f docker-compose.yml up --build -d
```

Sobe dois serviços: `app` (Gunicorn) e `nginx` (serve o frontend estático e faz proxy do backend).

Use `-f docker-compose.yml` para ignorar o `docker-compose.override.yml` de desenvolvimento.

