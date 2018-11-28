const request = require('request')

//If the environment we are running in is not a production environment 
//then configure the development environment
if (process.env.NODE_ENV != 'PRODUCTION') 
    require('dotenv').config()

console.log('Launching Codeforces Bot...')

var http = require("http");

setInterval(() => {
    request("https://codeforces-bot.herokuapp.com/", { json: true }, (err, res, body) => {
        console.log('Ping!')
    })
}, 1500000);

//Setup the database system and pass in a 
//callback that initializes the bot with the db object on success
require('./db')((db) => require('./bot')({ db }))