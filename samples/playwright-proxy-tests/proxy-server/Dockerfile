# Dockerfile
#
# Builds the proxy container image. Runs server.mjs which exposes the
# authenticated forward proxy on :8080. Also injects `127.0.0.1 intranet.local`
# into /etc/hosts at start time so the proxy can resolve the friendly name to
# its in-container loopback origin (ACI doesn't let us mount /etc/hosts).
#
# Build + run locally:
#   docker build -t pw-proxy .
#   docker run --rm -e PROXY_USER=usr -e PROXY_PASS=pwd -p 8080:8080 pw-proxy

FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.mjs ./

ENV PORT=8080
EXPOSE 8080

# `intranet.local` should resolve to loopback inside this container, so the
# proxy can tunnel CONNECT requests for that name to the in-container origin.
# We append to /etc/hosts at start time because ACI does not let us mount one.
CMD ["sh", "-c", "echo '127.0.0.1 intranet.local' >> /etc/hosts && node server.mjs"]
