#!/bin/bash

PRISMA_PASSWORD=$(head -c 18 /dev/urandom | base64)
API_PASSWORD=$(head -c 18 /dev/urandom | base64)

rm -f api.env.tmp
mv api.env api.env.tmp
cat api.env.tmp | sed "s/^API_PASSWORD=/#API_PASSWORD=/g" | sed "s/^PRISMA_PASSWORD=/#PRISMA_PASSWORD=/g" >api.env
rm api.env.tmp

echo "PRISMA_PASSWORD=$PRISMA_PASSWORD" >>api.env
echo "API_PASSWORD=$API_PASSWORD" >>api.env

export $(cat api.env | grep -v '^#' | xargs) && envsubst <scripts/privs.api.template
export $(cat api.env | grep -v '^#' | xargs) && envsubst <scripts/privs.prisma.template

echo ""
echo ""
echo ""

SAFE_PRISMA_PASSWORD=$PRISMA_PASSWORD
SAFE_PRISMA_PASSWORD=$(echo $SAFE_PRISMA_PASSWORD | sed 's/\+/%2B/' | sed 's/\//%2F/')

export $(cat api.env | grep -v '^#' | xargs) && echo set PRISMA_DATABASE_URL=mysql://$PRISMA_USER:$SAFE_PRISMA_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
