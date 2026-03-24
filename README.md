# Flood Assistance System

Chatbot de assistência para situações de alagamento. O usuário informa sua localização e o sistema retorna as condições climáticas atuais, avaliação de risco e uma rota de evacuação até um ponto seguro em tempo real.

Desenvolvido como Trabalho de Conclusão de Curso na UTFPR.

## Stack

Python · Flask-SocketIO · LangGraph · Google Gemini · MCP · Google Maps API · Open-Meteo · Nginx · Docker

## Configuração

```bash
git clone https://github.com/seu-usuario/flood-assistance-system.git
cd flood-assistance-system
cp .env.example .env
```

Preencha as chaves de API no `.env` (`GEMINI_API_KEY` e `GOOGLE_MAPS_API_KEY` são obrigatórias).

Requer [uv](https://docs.astral.sh/uv/getting-started/installation/) instalado.

## Rodando

**Desenvolvimento (local)**
```bash
uv run python app.py
# http://localhost:5000
```

**Desenvolvimento (Docker)**
```bash
docker compose up --build
# http://localhost:5000
```

**Produção (Docker + Nginx + Gunicorn)**
```bash
docker compose -f docker-compose.yml up --build -d
# http://seu-servidor:80
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `FLASK_ENV` | `development` ou `production` |
| `GEMINI_API_KEY` | Chave da API do Google Gemini |
| `GEMINI_MODEL` | Modelo (ex: `gemini-2.5-flash`) |
| `GOOGLE_MAPS_API_KEY` | Chave da API do Google Maps |
| `GOOGLE_MAPS_API_URL` | URL da Directions API |
| `WEATHER_API_URL` | URL da API de clima (Open-Meteo) |
| `SERVER_PATH` | Caminho para o servidor MCP (padrão: `server.py`) |
