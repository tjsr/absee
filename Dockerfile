ARG NPM_VERSION=9.8.1
ARG NODE_VERSION=18.18.0
FROM node:${NODE_VERSION}-alpine3.18 as absee-build-preflight
RUN npm install -g npm@${NPM_VERSION}

RUN mkdir /opt/absee

WORKDIR /opt/absee

FROM absee-build-preflight as absee-build

COPY package*.json /opt/absee
COPY .npmrc /opt/absee
RUN npm i

COPY babel.config.js /opt/absee
COPY tsconfig.json /opt/absee
COPY .eslintrc.json /opt/absee
COPY public/ /opt/absee/public
COPY server.ts /opt/absee
COPY index.html /opt/absee
COPY src/ /opt/absee/src
RUN npm run build

FROM absee-build-preflight as absee

COPY package*.json /opt/absee
COPY .npmrc /opt/absee

RUN npm i --production && npm i source-map-support
COPY --from=absee-build /opt/absee/dist /opt/absee/dist
WORKDIR /opt/absee/dist
RUN mkdir /opt/certs

EXPOSE 8280

CMD ["node", "-r", "source-map-support/register", "index.js"]