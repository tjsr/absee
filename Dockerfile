ARG NODE_VERSION=20.15.1
ARG ALPINE_VERSION=3.20
ARG NPM_VERSION=10.8.2
FROM ghcr.io/tjsr/node_patched_npm:${NODE_VERSION}-alpine${ALPINE_VERSION}-npm${NPM_VERSION} AS absee-build-preflight

RUN mkdir /opt/absee

WORKDIR /opt/absee

FROM absee-build-preflight AS absee-build

COPY package*.json /opt/absee

COPY [ "tsconfig.json", ".npmrc", "vite.config.ts", "vitest.config.ts", "server.ts", "index.html", ".eslintrc.json", "/opt/absee/" ]

COPY public/ /opt/absee/public
COPY src/ /opt/absee/src

RUN --mount=type=secret,id=github --mount=type=cache,target=/root/.npm  \
  echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github)" >> /root/.npmrc && \
  npm ci --no-fund && \
  npm run build && \
  rm -f /root/.npmrc

FROM absee-build-preflight AS absee

COPY package*.json /opt/absee
COPY .npmrc /opt/absee

RUN --mount=type=secret,id=github --mount=type=cache,target=/root/.npm \
  echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github)" >> /root/.npmrc && \
  npm ci --omit=dev --no-fund && \
  npm i source-map-support && \
  rm -f /root/.npmrc

COPY --from=absee-build /opt/absee/dist /opt/absee/dist
WORKDIR /opt/absee/dist
RUN mkdir /opt/certs
ENV STATIC_CONTENT=/opt/absee/dist

EXPOSE 8283

CMD ["node", "-r", "source-map-support/register", "--experimental-specifier-resolution=node", "server.js"]