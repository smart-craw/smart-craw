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
COPY shared-utils/ /app/shared-utils/
COPY docker/smart-craw-server/script.sh /app/smart-craw-server/script.sh
COPY shared/ /app/shared/
RUN apk add --no-cache bash # bash is needed for tool calls
# location of sqlite db
RUN mkdir /app/db
# location of mounted files for each bot
RUN mkdir /app/bots
# location of where strands stores session data
RUN mkdir /app/memory

## Lock down "node" user: only allow writes to /app/bots, /app/db, and /app/memory
# Set all of /app to root:root, read-only for node
RUN chown -R root:root /app && chmod -R 755 /app
# Grant node write access ONLY to the specific dirs
RUN chown node:node /app/db /app/bots /app/memory && chmod 700 /app/db /app/bots /app/memory

WORKDIR /app/smart-craw-server/
RUN npm ci --omit=dev
# this lets both the "standard" app and shared-utils access the node_modules
RUN mv node_modules /app/
# Switch to the non-root user
USER node
# don't manually set...keep this default
ENV STATIC_HTML_LOCATION="/app/dist"
# don't manually set...keep this default
ENV DB_LOCATION="/app/db"
# don't manually set...keep this default
ENV AGENT_CWD="/app/bots"
# don't manually set...keep this default
ENV SESSION_STORAGE_LOCATION="/app/memory"
ENV OPEN_API_COMPATIBLE_ENDPOINT="http://host.docker.internal:11434"
ENV LOG_LEVEL="info"
# "<|channel>" for gemma
ENV START_THINK_TOKEN="<think>"
# "<channel|>" for gemma
ENV END_THINK_TOKEN="</think>"
EXPOSE 8000
ENTRYPOINT ["/bin/sh", "/app/smart-craw-server/script.sh"]
CMD []
