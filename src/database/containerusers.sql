create database absee_dev;

grant ALL PRIVILEGES ON absee_dev.* TO absee_dev_prisma@'172.18.%';
grant ALL PRIVILEGES ON absee_dev.* TO absee_dev_prisma@'172.29.0.%';

GRANT SELECT,INSERT,UPDATE ON absee_dev.* TO absee_dev_api@'172.31.9.%';
 
GRANT ALL PRIVILEGES ON absee_dev.* TO absee_dev_prisma@'124.150.45.56';
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO absee_dev_prisma@'124.150.45.56';

GRANT SELECT,INSERT,UPDATE ON absee_dev.* TO absee_dev_api@'124.150.45.56';


GRANT SELECT,INSERT,UPDATE ON absee_dev.* TO absee_dev_api@'13.55.229.114';

GRANT ALL PRIVILEGES ON absee_dev.* TO absee_dev_prisma@'13.55.229.114';
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO absee_dev_prisma@'13.55.229.114';

ALTER USER absee_dev_prisma@'172.31.9.%' IDENTIFIED BY '15CihqPrkZV6jIeKdjOR';
ALTER USER absee_dev_prisma@'124.150.45.56' IDENTIFIED BY '5C\05ra59heNyx0F';
ALTER USER absee_dev_prisma@'13.55.229.114' IDENTIFIED BY 'T9AF2OG-pNJMaAE0';
ALTER USER absee_dev_api@'172.31.9.%' IDENTIFIED BY '.8d\d&8N2%lNMJG';
ALTER USER absee_dev_api@'124.150.45.56' IDENTIFIED BY ':ox%;5Jw1QxK5*nj';
ALTER USER absee_dev_api@'13.55.229.114' IDENTIFIED BY '*z=;/qC%q3~"=:XX';


-- mysql://absee_dev_prisma:T9AF2OG-pNJMaAE0@13.236.68.242/absee_dev
