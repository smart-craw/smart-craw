FROM node:24-alpine AS builder
COPY smart-craw-ui/ /app/smart-craw-ui/
COPY shared/ /app/shared/
WORKDIR /app/smart-craw-ui/
RUN npm ci
RUN ls -la
RUN npm run build

FROM nginx:stable-alpine3.21-perl
ENV UI_TLS=tls

COPY docker/smart-craw-ui/listen-plain.conf docker/smart-craw-ui/listen-tls.conf /etc/nginx/snippets/
COPY docker/smart-craw-ui/check-tls.sh /usr/local/bin/check-tls.sh
RUN chmod +x /usr/local/bin/check-tls.sh

COPY docker/smart-craw-ui/default.conf.template /etc/nginx/templates/default.conf.template

ADD docker/smart-craw-ui/nginx.entrypoint.sh /usr/local/bin/docker-entrypoint.sh
ADD docker/smart-craw-ui/nginx.conf /etc/nginx/nginx.conf.template
COPY --from=builder /app/smart-craw-ui/dist /app/dist/

RUN mkdir -p /var/run/nginx && chown -R nginx:nginx /var/run/nginx
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/ && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to the non-root user
USER nginx
ENV AGENT_SERVICE="http://localhost:8000"
ENV ALLOWED_IP_ADDRESS="192.168.0.0"
# Final entrypoint and command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
