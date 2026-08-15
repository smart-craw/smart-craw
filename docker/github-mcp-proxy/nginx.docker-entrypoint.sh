#!/bin/sh
envsubst '$GITHUB_MCP_SERVICE $GITHUB_PAT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec "$@"
