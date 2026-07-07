#!/bin/sh
# AGENT_SERVICE includes port
envsubst '$AGENT_SERVICE' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec "$@"
