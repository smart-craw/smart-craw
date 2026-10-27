#!/bin/sh
# Fail fast with a clear message instead of nginx dying on a missing cert.
set -eu

case "${UI_TLS:-}" in
  plain)
    ;;
  tls)
    for f in device.crt device.key; do
      if [ ! -f "/etc/nginx/certs/$f" ]; then
        echo "UI_TLS=tls but /etc/nginx/certs/$f is missing." >&2
        echo "Mount your certs, or set UI_TLS=plain when running behind a TLS-terminating proxy." >&2
        exit 1
      fi
    done
    ;;
  *)
    echo "UI_TLS must be 'tls' or 'plain' (got '${UI_TLS:-}')." >&2
    exit 1
    ;;
esac
