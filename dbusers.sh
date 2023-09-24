#!/bin/bash

if [ "$1" = "" ]; then
  OUTPUT_FILE=.env.ec2
else
  OUTPUT_FILE=$1
fi
TMP_FILE=$OUTPUT_FILE.tmp

PRISMA_PASSWORD=$(head -c 18 /dev/urandom | base64)
MYSQL_PASSWORD=$(head -c 18 /dev/urandom | base64)

rm -f $TMP_FILE
mv $OUTPUT_FILE $TMP_FILE
cat $TMP_FILE | sed "s/^MYSQL_PASSWORD=/#MYSQL_PASSWORD=/g" | sed "s/^PRISMA_PASSWORD=/#PRISMA_PASSWORD=/g" >$OUTPUT_FILE
rm $TMP_FILE

echo "PRISMA_PASSWORD=$PRISMA_PASSWORD" >>$OUTPUT_FILE
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD" >>$OUTPUT_FILE

export $(cat $OUTPUT_FILE | grep -v '^#' | xargs) && envsubst <scripts/privs.api.template
export $(cat $OUTPUT_FILE | grep -v '^#' | xargs) && envsubst <scripts/privs.prisma.template

echo ""
echo ""
export $(cat $OUTPUT_FILE | grep -v '^#' | xargs) && echo "*** ENV FILE ***
MYSQL_HOST=$MYSQL_HOST
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_PORT=$MYSQL_PORT
"

SAFE_PRISMA_PASSWORD=$PRISMA_PASSWORD
SAFE_PRISMA_PASSWORD=$(echo $SAFE_PRISMA_PASSWORD | sed 's/\+/%2B/' | sed 's/\//%2F/')

export $(cat $OUTPUT_FILE | grep -v '^#' | xargs) && echo set PRISMA_DATABASE_URL=mysql://$PRISMA_USER:$SAFE_PRISMA_PASSWORD@$MYSQL_HOST:$MYSQL_PORT/$MYSQL_DATABASE
