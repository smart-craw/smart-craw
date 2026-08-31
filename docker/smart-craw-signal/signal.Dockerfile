FROM node:24-alpine
COPY smart-craw-signal/ /app/smart-craw-signal/
COPY shared-utils/ /app/shared-utils/
COPY package.json package-lock.json /app/

RUN apk add --no-cache bash # bash is needed for claude code

# location of mounted files
RUN mkdir /app/mounts
# store sessions etc
RUN mkdir /app/memory

## Lock down "node" user
# Set all of /app to root:root, read-only for node
RUN chown -R root:root /app && chmod -R 755 /app
# Grant node write access ONLY to the specific dirs
RUN chown node:node /app/mounts /app/memory && chmod 700 /app/mounts /app/memory

WORKDIR /app/
RUN npm ci --workspace=smart-craw-signal --include-workspace-root --omit=dev
WORKDIR /app/smart-craw-signal/
# Switch to the non-root user
USER node
# don't manually set AGENT_CWD...keep this default
ENV AGENT_CWD="/app/mounts"
# don't manually set SESSION_DIRECTORY...keep this default
ENV SESSION_DIRECTORY="/app/memory"
ENV LLAMA_CPP_ENDPOINT="http://host.docker.internal:11434"
ENV LOG_LEVEL="info"
ENV SIGNAL_BOT_PHONE_NUMBER="0123456789"
ENV SIGNAL_USER_ADMIN_NUMBER="9876543210"
ENV SIGNAL_REST_ENDPOINT="http://localhost:9001"
CMD ["node", "index.ts"]
