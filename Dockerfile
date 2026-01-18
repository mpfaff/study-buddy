FROM alpine:latest

RUN apk add --no-cache caddy nodejs

COPY entrypoint.sh /entrypoint.sh
COPY server.js /server.js
COPY static /www

ENTRYPOINT ["entrypoint.sh"]
