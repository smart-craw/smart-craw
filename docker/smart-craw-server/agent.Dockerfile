FROM node:24-alpine
COPY smart-craw-server/ /app/smart-craw-server/
COPY shared-utils/ /app/shared-utils/
COPY docker/smart-craw-server/script.sh /app/smart-craw-server/script.sh
COPY shared/ /app/shared/
COPY package.json package-lock.json /app/

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

WORKDIR /app/
RUN npm ci --workspace=smart-craw-server --include-workspace-root --omit=dev
WORKDIR /app/smart-craw-server/

# Switch to the non-root user
USER node
# don't manually set...keep this default
ENV DB_LOCATION="/app/db"
# don't manually set...keep this default
ENV AGENT_CWD="/app/bots"
# don't manually set...keep this default
ENV SESSION_DIRECTORY="/app/memory"
# doesn't matter the value, just needs to be set
ENV SERVER_ONLY="serveronly"
ENV LLAMA_CPP_ENDPOINT="http://host.docker.internal:11434"
ENV LOG_LEVEL="info"
EXPOSE 8000
ENTRYPOINT ["/bin/sh", "/app/smart-craw-server/script.sh"]
CMD []
