FROM node:24-alpine AS builder
COPY smart-craw-ui/ /app/smart-craw-ui/
COPY shared/ /app/shared/
WORKDIR /app/smart-craw-ui/
RUN npm ci
RUN ls -la
RUN npm run build

FROM node:24-alpine

COPY --from=builder /app/smart-craw-ui/dist /app/dist/
COPY smart-craw-server/ /app/smart-craw-server/
COPY docker/script.sh /app/smart-craw-server/script.sh
COPY shared/ /app/shared/
RUN apk add --no-cache bash # bash is needed for claude code
RUN mkdir /app/db
WORKDIR /app/smart-craw-server/
RUN chown -R node:node /app
RUN npm ci --only=production
# Switch to the non-root user
USER node
# don't manually set...keep this default
ENV STATIC_HTML_LOCATION="/app/dist"
# don't manually set...keep this default
ENV DB_LOCATION="/app/db"
ENV ANTHROPIC_BASE_URL="http://host.docker.internal:11434"
ENV ANTHROPIC_AUTH_TOKEN="ollama"
ENV ANTHROPIC_API_KEY="sk-local-dummy"
ENV LOG_LEVEL="info"
ENV MODEL="hf.co/Qwen/Qwen3-4B-GGUF:latest"

EXPOSE 8000
ENTRYPOINT ["/bin/sh", "/app/smart-craw-server/script.sh"]
CMD []
