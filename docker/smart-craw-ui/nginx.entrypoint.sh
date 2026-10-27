#!/bin/sh
# AGENT_SERVICE includes http:// and port
/usr/local/bin/check-tls.sh
envsubst '${AGENT_SERVICE} ${ALLOWED_IP_ADDRESS} ${UI_TLS}' \
  < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
  
exec "$@"
