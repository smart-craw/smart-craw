#!/bin/bash

# Trap to kill socat on exit
trap 'kill %1' EXIT

# Start socat in separate process
socat TCP-LISTEN:9000,fork TCP:$1 &

docker run -p 8000:8000 -e ANTHROPIC_BASE_URL="http://host.docker.internal:9000" -v $(pwd):/app/db -v $(pwd)/memory:/home/node/.claude --add-host=host.docker.internal:host-gateway ghcr.io/smart-craw/smart-craw:v0.0.5
