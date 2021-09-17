# VIVA

## Introduction

This repository consists of three VueJS apps and two NodeJS servers

* Admin `yarn run serve:admin`
* Mobile App `yarn run serve:app`
* Canvas LTI `yarn run serve:lti`

* VIVA Server `node server/viva.js`
* VIVA task delegator (video processing) `node server/taskDelegator.js`

VIVA requires an Educloud (S3) storage connection, a MongoDB database and for consents, and an account at the UiO TSD Consent Portal
To log in users, it requires a Dataporten FEIDE 'app' profile, and an Instructure Canvas API token and LTI token.
It depends on the user's Dataporten 'dataporten-userid_sec' to match with the same user's Canvas 'login_id'
It also depends on Canvas for determining which user can see which 'Dataset' under which Videos are recorded, and several other things.
Refer to /docs for more detailed information

## Setup

Ensure [Forever](https://github.com/foreversd/forever#readme) is available on the server
Run `yarn` from the root folder to install all dependencies in each tree
Create a `.env` file based on the template `template.env`

Set `NODE_ENV` as follows:

'development'
* the system will fork the task delegator atomatically when running `node server/viva.js`
* allows access to the server/LTI from a local development machine (FIEDE callbacks must be set accordingly)
  * this influences various URI address hosts / ports that change depending on where the server is being run
* returns sample consents, as the consent portal is not accessible unless VIVA is running on a whitelisted server
* enable deletion route for users

Use `node server/viva.js` (also spawns taskDelegator automatically)

'test'
* run Jest tests for the VIVA API without requiring real user profile. The user will be authenticated as a 'test user'
* attempts to connect to the real Consent Portal
* requires separate start of the taskDelegator
* NOTE: This mode will skip over API calls to Canvas
* NOTE: run viva in development mode first to create a sample Dataset, User and Video in the database

Use `forever start forever/test-viva.json` & `forever start forever/test-td.json`

'production'
* removes the above development / test features

Use `forever start forever/prod-viva.json` & `forever start forever/prod-td.json`

## Contact

VIVA is produced by Engagelab, UiO, Oslo, Norway
Contact us at engagelab@uv.uio.no
