# SmartCraw

## Get Smart!  Its not Claw, its Craw!

Want to access your bots from anywhere?  Want to easily stop them if they are going haywire?  Want to easily schedule them?

## Missed it by that much

Claude Code is great, and Anthropic's new mobile app makes remote access a flip-switch.  But who wants to pay 200 dollars a month for a mobile app?  Based on Anthropic's agent SDK, this gives you full control of bots without ponying up for a premium.

Features:
* UI to create, view, schedule, start, and stop bot execution
* Chat interface playground to test and explore

Architecture:
* ReactJS UI
* NodeJS server
* Anthropic's SDK

## What if I told you 2 bots and a self-hosted model?

Any model that works with Anthropic's API can be used.  Want a fully private experience in a sandboxed environment?  Here is your chance!

## Get smarted!

Store memories for later use:
`mkdir memory`

Run docker container, mounting current directory for the persistent storage and the memory directory for notes.  Works if you are locally hosting a model via Ollama.  `add-host` is optional Windows/Mac.

`docker run -p 8000:8000 -v $(pwd):/app/db -v $(pwd)/memory:/app/smart-craw-server/memory --add-host=host.docker.internal:host-gateway  ghcr.io/smart-craw/smart-craw:v0.0.3`

Run with remote or public LLM:

`docker run -p 8000:8000 -e ANTHROPIC_BASE_URL=[yourllmurl] -e ANTHROPIC_AUTH_TOKEN=[yourauthtoken] -e ANTHROPIC_API_KEY=[yourapikey] -v $(pwd):/app/db -v $(pwd)/memory:/app/smart-craw-server/memory --add-host=host.docker.internal:host-gateway ghcr.io/smart-craw/smart-craw:v0.0.3`


## Cautions

This is intended for local and trusted networks.  An ideal setup would be to run this and access it on a local workstation.  The LLM service can be hosted elsewhere.

If you run this on a Raspberry Pi and access the UI "remotely" it is strongly recommended to set static IPs and block all traffic except from your workstation.  Similarly, if you want to access this from your phone on your local network, have your local router assign a static IP to your phone and block all traffic except from your phone.

I may at some point set up authentication which would allow exposure to a wider array of (LAN) endpoints, but I still would urge caution and tight network restrictions.

Under no circumstances should you host this on a cloud system or expose your ports outside of your LAN.


## Screenshot

![homepage](./docs/ui.png)
