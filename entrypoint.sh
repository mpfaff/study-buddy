#!/bin/sh

caddy run --config Caddyfile.prod &
node server.js
