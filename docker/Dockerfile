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
COPY shared/ /app/shared/
RUN mkdir /app/db
WORKDIR /app/smart-craw-server/
RUN chown -R node:node /app
RUN npm ci --only=production
# Switch to the non-root user
USER node
ENV STATIC_HTML_LOCATION="/app/dist"
ENV DB_LOCATION="/app/db"
RUN node db_utils/create_db.ts # create tables to start
EXPOSE 8000
CMD ["node", "index.ts"]
