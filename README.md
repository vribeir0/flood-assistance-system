# Flood Assistance System

Chatbot de assistência para situações de alagamento. O usuário informa sua localização e o sistema retorna as condições climáticas atuais, avaliação de risco e uma rota de evacuação até um ponto seguro em tempo real.

## Stack

**Backend** — Python · Flask· LangGraph · MCP · Google Maps API · Open-Meteo API  
**Frontend** — Expo (React Native Web) 
**Infra** — Docker Compose · Nginx · Gunicorn · Cloudflare (HTTPS)

## Estrutura

```
flood-assistance-system/
├── backend/          # API Flask + agente LangGraph
│   ├── src/
│   │   ├── routes/   # Eventos WebSocket
│   │   ├── usecases/ # Lógica de negócio e MCP
│   │   └── prompts/  # System prompts do agente
│   ├── app.py
│   ├── server.py     # Servidor MCP 
│   └── Dockerfile
├── frontend/         # App Expo Web
├── nginx/
│   ├── nginx.conf        # Config de produção
│   ├── nginx.dev.conf    # Config de desenvolvimento
│   └── Dockerfile        # Build multi-stage 
├── docker-compose.yml          # Produção
└── docker-compose.override.yml # Desenvolvimento 
```

## Pré-requisitos

- [Docker](https://docs.docker.com/engine/install/) com o plugin Compose
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (apenas para rodar o backend local sem Docker)

## Configuração

```bash
git clone https://github.com/seu-usuario/flood-assistance-system.git
cd flood-assistance-system
cp .env.example .env
```

Preencha as chaves de API no `.env`:

| Variável | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave da API do Google Gemini **(obrigatória)** |
| `GEMINI_MODEL` | Modelo — ex: `gemini-2.5-flash` |
| `GOOGLE_MAPS_API_KEY` | Chave da API do Google Maps **(obrigatória)** |
| `GOOGLE_MAPS_API_URL` | URL da Directions API |
| `WEATHER_API_URL` | URL da API de clima (Open-Meteo) |
| `SERVER_PATH` | Caminho para o servidor MCP (padrão: `server.py`) |

## Desenvolvimento

Sobe os três serviços (backend, frontend Expo dev server e Nginx como proxy):

```bash
docker compose up --build
```

- **App** → [http://localhost](http://localhost)
- **Frontend dev server** → [http://localhost:8081](http://localhost:8081) (com hot-reload)
- **Backend** → [http://localhost:5000](http://localhost:5000) (exposto para debug)


## Produção

```bash
docker compose -f docker-compose.yml up --build -d
```

Sobe apenas dois serviços: `app` (Gunicorn) e `nginx` (serve o frontend estático e faz proxy do backend).

> **Importante:** use `-f docker-compose.yml` para ignorar o `docker-compose.override.yml` (desenvolvimento). Sem essa flag, serão 3 serviços incluindo o Expo dev server.

