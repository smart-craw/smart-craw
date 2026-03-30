#!/bin/bash
# use: ./startup_mac.sh ${llm_url} ${docker_tag}
# eg ./startup_mac.sh example_ip:example_port v0.0.6

# Trap to kill socat on exit
trap 'kill %1' EXIT

# Start socat in separate process
socat TCP-LISTEN:9000,fork TCP:$1 &

docker run -p 8000:8000 -e ANTHROPIC_BASE_URL="http://host.docker.internal:9000" -v $(pwd):/app/db -v $(pwd)/memory:/home/node/.claude --add-host=host.docker.internal:host-gateway ghcr.io/smart-craw/smart-craw:$2
