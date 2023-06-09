FROM node:18.13.0-alpine3.17 as absee-build-preflight
RUN npm install -g npm@9.6.2

RUN mkdir /opt/absee

WORKDIR /opt/absee

FROM absee-build-preflight as absee-build

COPY src/ /opt/absee/src
COPY public/ /opt/absee/public
COPY package*.json /opt/absee
COPY index.ts /opt/absee
COPY .eslintrc.json /opt/absee
COPY babel.config.js /opt/absee
COPY tsconfig.json /opt/absee
COPY .npmrc /opt/absee

RUN npm i && npm run build

FROM absee-build-preflight as absee

COPY package*.json /opt/absee
COPY .npmrc /opt/absee

RUN npm i --production
COPY --from=absee-build /opt/absee/dist /opt/absee/dist
COPY --from=absee-build /opt/absee/build /opt/absee/dist/build
WORKDIR /opt/absee/dist

EXPOSE 8280

CMD ["node", "index.js"]