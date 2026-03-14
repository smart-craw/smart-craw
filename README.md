# SmartCraw

## Get Smart!  Its not Claw, its Craw!

Want to access your bots from anywhere?  Want to easily stop them if they are going haywire?  Want to easily schedule them?  Want infinite composibility that won't catch an infinite loop?

## Missed it by that much

Claude Code is great, and Anthropic's new mobile app makes remote access a flip-switch.  But who wants to pay 200 dollars a month for a mobile app?  Based on Anthropic's agent SDK, this gives you full control of bots without ponying up for a premium.

Features:
* UI to create, view, schedule, start, and stop bot execution
* Chat interface to remotely access bots

Architecture:
* ReactJS UI
* NodeJS server
* Each "bot" can use one or more tools.  Each "bot" then becomes a new tool available to any new "bot".  Cycles are checked dynamically to ensure the bot graph is acyclic.

## What if I told you 2 bots and a self-hosted model?

Any model that works with Anthropic's API can be used.  Want a fully private experience in a sandboxed environment?  Here is your chance!
