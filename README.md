# README #

A/B See is an A/B testing tool which will generate pairs of elements a user can select between.  The purpose of this data collection is to be able to generate large ranked and comparable data sets in systems such as tradable items, prototyped implementations, profile photos or other artistic works, or testing studies.  These API calls can be embedded in websites to present this data to the user in a visual format, where the frontend would then call the API again with their response from the presented options sets.

## Use-case ##

This project was originally written to provide a comparison tool for Pinny Arcade Pin rankings and comparison, to help collect data which can assist newcomers to the hobby understand the value of pins they may be looking to trade or obtain - largely to make sure that those people are not taken advantage of.

## How do I get set up? ##

The application is being migrated to Cloudflare Workers with D1. The legacy Express server and MySQL configuration remain available during the transition.

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

For the Cloudflare client build and Worker dry run, use `npm run cf:check:dev` with a local Wrangler configuration.

## Dependabot ##

Dependabot needs two **Dependabot secrets**—not Actions secrets—to update npm dependencies:

* `NPM_TOKEN` remains the existing credential for registry.npmjs.org.
* `TJSR_GITHUB_PACKAGES_TOKEN` is a new, dedicated GitHub Packages credential for npm.pkg.github.com.

### Configure `TJSR_GITHUB_PACKAGES_TOKEN`

1. In GitHub, open **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
2. Give it a descriptive name such as `absee-dependabot-packages-read`, select a suitable expiry, and select **only** the `read:packages` scope. Do not grant `write:packages`, `delete:packages`, or unrelated scopes.
3. Generate the token and copy it immediately. GitHub displays it only once.
4. In [tjsr/absee settings](https://github.com/tjsr/absee/settings/secrets/dependabot), open **Secrets and variables** → **Dependabot**, then choose **New repository secret**.
5. Set the name to `TJSR_GITHUB_PACKAGES_TOKEN`, paste the token as the value, and save.
6. Re-run Dependabot update job 163, or wait for its next scheduled check.

The account that creates the token must have read access to each `@tjsr/*` package that Dependabot resolves. Keep this token in Dependabot secrets only; do not add it to Actions secrets, source control, an `.npmrc`, or a workflow file.

See GitHub's [package permission guidance](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages) and [Dependabot private-registry guidance](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-private-registries).

### Contribution details ###

* Contacts

Contact Tim Rowe <tim@tjsr.id.au> if you wish to contribute to this project.
