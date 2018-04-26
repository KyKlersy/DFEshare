# Drop File Encrypted share

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.3.

## Third Party Requirements
1.Heroku

2.Heroku Managed Postgresql

3.Google Cloud Services

***
## Pre-Setup
Assuming the above requirements, this project makes use of these services, no guarantee is made for other setups.
You will need a heroku account. A google cloud services account. Already installed NodeJS > 9.6, Angular CLI, Yarn package manager.
This project used yarn, but it might work with npm no guarantee.

## Setup
Clone Project,

  Run npm install / yarn install to get dependancies

## Setup - Heroku
Run the following command in your shell of choice in the cloned project directory to create and attach an empty heroku project.


```heroku create```

## Setup - Heroku Database
Using heroku.com's dashboard select your project and under resources tab  -> add-ons search for herokus postgresql database.
Once that has been added you can test remote connections following [Heroku Remote DB connections](https://devcenter.heroku.com/articles/connecting-to-heroku-postgres-databases-from-outside-of-heroku) through PGadmin for checking tables.
After confirming that the addon is working run in your shell of choice, making sure you launch this command from the same directory location for createTables.sql which should be in the folder sql.


```heroku pg:psql --app [YOUR_APP_NAME_HERE] < createTables.sql```

 ## Setup - Google Cloud Service
 You will need a [Google cloud service account](https://cloud.google.com/)
  Google provides a free 1 year no charge account to their services and 300$ credit. There is no catch and no billing when the trial ends just that it will no longer work unless you pay to upgrade.
  
  Once you have a google cloud account you will need to create a project and a bucket, make note of the project of the project-id as you will need this later. Name the bucket how ever you like. Once those steps are done you will need to create an iam service account so that heroku will be able to access this bucket this can be found under the IAM & Admin. The service account should be created for server to server, with read/write/delete access to the bucket you created. Once done you need to export the key it generates, save this somewhere safe.
  
At this point you will need to download and install googles gsutil command line tools, you will need to set up cors on your bucket so that users using the app with the server generating time limited links will be able to download their encrypted files.


```gsutil cors set cors-config.json gs://YOUR_BUCKET_NAME```


See [here](https://developer.bitmovin.com/hc/en-us/articles/360000059353-How-do-I-set-up-CORS-for-my-Google-Cloud-Storage-Bucket-) for an example cors file.

Not included in this git is the cors-config file used.
 
***

### Note this project makes use of .env to hide keys for local developement
Because of this, these keys will not work unless they are entered as config vars on heroku.

This app uses the following Key / Pairs for local developement you should create a .env file in the root of the project folder making sure to add this to git ignore. DO NOT EVER COMMIT KEYS.

DATABASE_URL can be founder under herokus dashboard for the addon database, by clicking on it and going to datastores -> settings -> view credentials copy the connection string and paste it into your .env file.


```
DATABASE_URL = [The url connection string to the heroku database]
GOOGLE_CREDENTIALS = [The Entire key generated earlier when exporting the service account]
GOOGLE_BUCKET = [In single quotes ' Name of the project id ']
GOOGLE_BUCKET_NAME = [ In single quotes ' Name of the bucket ' ]
```


The follow config vars in .env also need to be copied into herokus config vars for your project.
Heroku wraps vars with single quotes, so do not add them to GOOGLE_BUCKET and GOOGLE_BUCKET_NAME for heroku.

## Push and Deployment to heroku
Assuming everthing is setup correctly and the master for the project is up to date.


```git push heroku master```


Will start the build process.

***
## ((Optionally)) Running Local


```yarn postinstall``` Will build and compile the app.


```yarn start``` will run the local app, this still assumes you setup correctly the .env file.


