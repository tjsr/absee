#!/bin/bash

if [ "$1" = "" ]; then
  OUTPUT_FILE=.env.ec2
else
  OUTPUT_FILE=$1
fi
TMP_FILE=$OUTPUT_FILE.tmp

source $OUTPUT_FILE
PRISMA_PASSWORD=$(head -c 18 /dev/urandom | base64)
MYSQL_PASSWORD=$(head -c 18 /dev/urandom | base64)

rm -f $TMP_FILE
mv $OUTPUT_FILE $TMP_FILE
cat $TMP_FILE | sed "s/^MYSQL_PASSWORD=/#MYSQL_PASSWORD=/g" | sed "s/^PRISMA_PASSWORD=/#PRISMA_PASSWORD=/g" >$OUTPUT_FILE
rm $TMP_FILE

echo "PRISMA_PASSWORD=$PRISMA_PASSWORD" >>$OUTPUT_FILE
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD" >>$OUTPUT_FILE

./dbusers.sh $OUTPUT_FILE
