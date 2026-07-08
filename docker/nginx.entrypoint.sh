#!/bin/sh
# AGENT_SERVICE includes port
envsubst '${AGENT_SERVICE} ${ALLOWED_IP_ADDRESS}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec "$@"
