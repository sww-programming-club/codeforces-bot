//If the environment we are running in is not a production environment 
//then configure the development environment
if (process.env.NODE_ENV != 'PRODUCTION') 
    require('dotenv').config()

console.log('Launching Codeforces Bot...')

//Setup the database system and pass in a 
//callback that initializes the bot with the db object on success
require('./db')((db) => require('./bot')({ db }))