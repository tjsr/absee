aws --profile absee-ecr-push ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/tjsrowe

docker tag absee:latest public.ecr.aws/tjsrowe/absee:latest
docker push public.ecr.aws/tjsrowe/absee:latest