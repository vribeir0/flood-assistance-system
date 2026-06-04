FROM python:3.10-slim

WORKDIR /app

# Instala o uv 
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copia os arquivos de dependências primeiro
COPY pyproject.toml .
COPY uv.lock* .

# Instala dependências de produção
RUN uv sync --frozen --no-install-project --no-dev

# Copia o restante do código
COPY . .

EXPOSE 5000

# Gunicorn com worker threading para suporte a WebSocket
CMD ["uv", "run", "gunicorn", "-k", "gthread", "--threads", "4", "-w", "1", "--timeout", "120", "--bind", "0.0.0.0:5000", "app:app"]
