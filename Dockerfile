ARG NODE_VERSION=22.19.0
ARG ALPINE_VERSION=3.22
ARG NPM_VERSION=11.6.2
ARG NODE_IMAGE=ghcr.io/tjsr/node_patched_npm:${NODE_VERSION}-alpine${ALPINE_VERSION}-npm${NPM_VERSION}
ARG NODE_RUNTIME_IMAGE=node:${NODE_VERSION}-alpine${ALPINE_VERSION}
FROM ${NODE_IMAGE} AS absee-build-preflight

RUN mkdir /opt/absee

WORKDIR /opt/absee

FROM absee-build-preflight AS absee-build

COPY package*.json /opt/absee

COPY [ "tsconfig.json", ".npmrc", "vite.config.ts", "vitest.config.ts", "server.ts", "index.html", ".eslintrc.json", "/opt/absee/" ]

COPY public/ /opt/absee/public
COPY src/ /opt/absee/src
COPY prisma/schema.prisma /opt/absee/prisma/schema.prisma

RUN --mount=type=secret,id=github --mount=type=cache,target=/root/.npm  \
  echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/github)" >> /root/.npmrc && \
  npm ci --no-fund && \
  npm run build && \
  rm -f /root/.npmrc

FROM absee-build-preflight AS absee

COPY package*.json /opt/absee
COPY .npmrc /opt/absee
COPY prisma/schema.prisma /opt/absee/prisma/schema.prisma

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