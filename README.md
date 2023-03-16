# README #

A/B See is an A/B testing tool which will generate pairs of elements a user can select between.  The purpose of this data collection is to be able to generate large ranked and comparable data sets in systems such as tradable items, prototyped implementations, profile photos or other artistic works, or testing studies.  These API calls can be embedded in websites to present this data to the user in a visual format, where the frontend would then call the API again with their response from the presented options sets.

### What is this repository for? ###

* Quick summary
* Version
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* Summary of set up
* Configuration
* Dependencies

This project makes use of the restsqlite service available at https://bitbucket.org/tjsrowe/restsqlite/  
The intent of using a REST-base API like this is so that the data source could in future be easily replaced, especially if you were to implement this in a high-traffic environment.

Generated IDs are uniquely created as snowflake numbers.

* Database configuration
* How to run tests
* Deployment instructions

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact