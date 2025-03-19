FROM python:3.11-slim

WORKDIR /app

# Poetryのインストール
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

# 依存関係のインストール
COPY pyproject.toml poetry.lock* ./
RUN poetry install --without dev --no-root --no-interaction --no-ansi

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
