# README #

A/B See is an A/B testing tool which will generate pairs of elements a user can select between.  The purpose of this data collection is to be able to generate large ranked and comparable data sets in systems such as tradable items, prototyped implementations, profile photos or other artistic works, or testing studies.  These API calls can be embedded in websites to present this data to the user in a visual format, where the frontend would then call the API again with their response from the presented options sets.

## Use-case ##

This project was originally written to provide a comparison tool for Pinny Arcade Pin rankings and comparison, to help collect data which can assist newcomers to the hobby understand the value of pins they may be looking to trade or obtain - largely to make sure that those people are not taken advantage of.

## How do I get set up? ##

For this project you will need

* A host from which to run the Express API server, either standalone or in the built docker container.  This can also host the React frontend and serve this as static compiled resources.
* A MySQL server or container

### Logging ###

Notes on morgan logging: If you are running this in vscode, the debug console will not capture output to process.stdout.write which is what VSCode monitors - it only captures console.log  

To solve this, you need to make sure you have "console": "integratedTerminal" in launch.json - See https://stackoverflow.com/a/65437944 for more info.

### Database configuration ###

The project now expect a MySQL database for the backend.  It is recommended you use a separate user for Prisma schema migrations which has elevated privileges, and a separate standard user which the API server will use.

Create these users with:

```sql
GRANT ALL PRIVILEGES ON abseedb.* TO absee_prisma_user@'127.0.0.1';
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO absee_prisma_user@'127.0.0.1';
ALTER USER absee_prisma_user@'127.0.0.1' IDENTIFIED BY 'aStrongPassword';

GRANT SELECT,INSERT,UPDATE ON abseedb.* TO absee_api_user@'127.0.0.1';
ALTER USER absee_api_user@'127.0.0.1' IDENTIFIED BY 'anotherStrongPassword';

FLUSH PRIVILEGES;
```

## Run targets ##

* How to run tests

``npm run test``

## To run a local development environment ##

This assumes you have a running database with database connection details configured in .env

``npm run start``

This will launch both the frontend with react-scripts on port 3000, and a nodemon process for the API server running on port 8283 or another port specified by `HTTP_PORT` in `.env`

* To build the Docker containers

```
npm run docker:build
npm run docker:run:test
```

To apply the database patches required:
```
npm run docker:build:dbmigrate
npm run docker:run:dbmigrate
```

## Dependabot ##

The repo will requires an NPM_TOKEN to update npm dependencies using dependabot.  
`gh secret set NPM_TOKEN --app dependabot --body "$NPM_TOKEN"`

### Contribution details ###

* Contacts

Contact Tim Rowe <tim@tjsr.id.au> if you wish to contribute to this project.
