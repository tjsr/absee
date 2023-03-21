# README #

A/B See is an A/B testing tool which will generate pairs of elements a user can select between.  The purpose of this data collection is to be able to generate large ranked and comparable data sets in systems such as tradable items, prototyped implementations, profile photos or other artistic works, or testing studies.  These API calls can be embedded in websites to present this data to the user in a visual format, where the frontend would then call the API again with their response from the presented options sets.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Summary of set up
* Configuration

Notes on morgan logging: If you are running this in vscode, the debug console will not capture output to process.stdout.write which is what VSCode monitors - it only captures console.log  

To solve this, you need to make sure you have "console": "integratedTerminal" in launch.json - See https://stackoverflow.com/a/65437944 for more info.

* Dependencies

Generated IDs are uniquely created as snowflake numbers.

* Database configuration

The project now expect a MySQL database for the backend.  Details to come.

* How to run tests
* Deployment instructions

Containers are built from scripts called from bitbucket-pipelines.yml - see scripts directory.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact