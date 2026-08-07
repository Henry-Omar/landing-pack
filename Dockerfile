FROM python:3.11-slim

WORKDIR /app

COPY . .

# The app reads $PORT at runtime (defaults to 8000 locally).
EXPOSE 8000
ENV PORT=8000

CMD ["python", "server.py"]
