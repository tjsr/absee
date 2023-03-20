FROM node:18.13.0-alpine3.17 as absee

RUN npm install -g npm@9.6.2

RUN mkdir /opt/absee
COPY --from=dbmigrate /opt/absee/node_modules /opt/absee/node_modules

COPY src/ /opt/absee/src
COPY public/ /opt/absee/public
COPY package*.json /opt/absee
COPY index.ts /opt/absee
COPY .eslintrc.json /opt/absee
COPY babel.config.js /opt/absee
COPY tsconfig.json /opt/absee

WORKDIR /opt/absee
RUN npm i && npm run build

EXPOSE 8280

CMD ["npm", "run", "start:prod"]