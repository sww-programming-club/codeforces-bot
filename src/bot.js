const path      = require('path')
const Discord   = require('discord.js')
const commando  = require('discord.js-commando')

const appconfig = require('./appconfig')

const { 
    DISCORD_BOT_PREFIX,
    DISCORD_BOT_NAME, 
    DISCORD_BOT_ICON, 
    DISCORD_BOT_COLOR,
    DISCORD_BOT_FOOTER,
    URL_CODEFORCES,
    POINTS_MAX,
    POINTS_MIN,
    TIME_ZONE,
    TIME_PROBLEM_DAILY
} = appconfig.CORE

const { TOKEN } = appconfig.SECURITY.AUTH_DISCORD

const MS_HOUR = 1000 * 60 * 60
const MS_DAY  = MS_HOUR * 24

//UTC Time of Daily Problem
const UTC_HOUR = 
    (TIME_PROBLEM_DAILY - TIME_ZONE) < 0 ? 
    (24 - ((TIME_ZONE - TIME_PROBLEM_DAILY) % 24)) % 24 : 
    (TIME_PROBLEM_DAILY - TIME_ZONE) % 24

const bot       = new commando.Client({
    commandPrefix: DISCORD_BOT_PREFIX,
    owner: '224078425911066624', //Rusuban UserID
    disableEveryone: true,
    unknownCommandResponse: false
})

const ObjifyEmbed = (embed) => {
    return {
        title: embed.title,
        author: embed.author ? {...embed.author} : undefined,
        color: embed.color,
        description: embed.description,
        url: embed.url,
        timestamp: embed.timestamp,
        footer: embed.footer ? {...embed.footer} : undefined,
        thumbnail: embed.thumbnail ? {...embed.thumbnail} : undefined,
        image: embed.image ? {...embed.image} : undefined,
        fields: embed.fields ? [...embed.fields] : undefined
    }
}

//Logins into discord bot, exiting process if it fails
const login = async (callback) => {
    let successful = false

    try {
        await bot.login(TOKEN)
        successful = true
    } catch(e) {
        console.log('ERROR LOGGING IN')
        console.log(e)
        process.exit(1)
    }

    if (successful && typeof callback == 'function') callback()
}

//Sends a message to the announcement channel in all guilds the bot is connected to
const announce = async (message, announceInChannel) => {
    
    //Iterate through all the guilds the bot is connected to
    try {
        let guilds = bot.guilds.array()

        for (i = 0; i < guilds.length; i++) {
            let payload = typeof message == 'string' ? message : {...message, embed: message.embed ? ObjifyEmbed(message.embed) : undefined}
            let guild = guilds[i]
            let channel = guild.channels.find(channel => channel.name === announceInChannel)

            //If the guild lacks an (announceInChannel) channel then skip it
            if (!channel) continue

            //Replace all channel references with an actual channel reference (ex: #codeforces -> <#CHANNEL_ID>)
            if (typeof payload != 'string' && payload.embed) {
                payload.embed.description = (payload.embed.description || '').replace(/#[^\s]+/g, (match) => {
                    let myChannel = guild.channels.find(channel => channel.name === match.substring(1))
                    return myChannel ? `<#${myChannel.id}>` : match
                })
            }

            //Send the message
            try { channel.send(payload) } catch(e) {
                console.log(`MESSAGE FAILURE IN GUILD: ${guild.name}`)
                console.log(e)
            }
        }
    } catch(e) {
        console.log('message could not be sent')
        console.log(e)
    }
}

//Builds a RichEmbed out of the metadata of the challenge
const buildDailyChallengeRichEmbed = (data) => {
    return new Discord.RichEmbed()
        .setTitle(`Codeforces Daily Problem | ${data.index} | ${data.name}`)
        .setAuthor(DISCORD_BOT_NAME, DISCORD_BOT_ICON)
        .setURL(`${URL_CODEFORCES}/problemset/problem/${data.contestId}/${data.index}`)
        .setColor(DISCORD_BOT_COLOR)
        .setFooter('Tags: ' + (data.tags.length == 0 ? 'none' : data.tags.join(', ')))
        .setThumbnail(DISCORD_BOT_ICON)
        .setTimestamp()
        .setDescription(`This is a **${Math.floor(data.points)}** point **${data.index}** problem. ` +
            `Good luck and make sure to post solutions in the #codeforces channel. 👍`)
}

//Register commands
bot.registry.registerGroup('main', 'Codeforces Core Commands')
bot.registry.registerDefaults()
bot.registry.registerCommandsIn(path.normalize(path.join(__dirname, './commands')))

bot.on('disconnected', login)
bot.on('ready', () => {

    console.log(`Discord Bot: Logged in as ${bot.user.tag}`)

    setTimeout(() => {

        //Sends launch message
            const embed = new Discord.RichEmbed()
            .setTitle('Codeforces Bot Status')
            .setAuthor(DISCORD_BOT_NAME, DISCORD_BOT_ICON)
            .setColor(DISCORD_BOT_COLOR)
            .setFooter(DISCORD_BOT_FOOTER)
            .setTimestamp()
            .setThumbnail("https://i.imgur.com/NCmARE5.jpg")
            .setDescription("The Codeforces Daily Challenge Bot has Successfully Launched! 🔥")

        announce({ embed }, 'bot-commands')

        //Sends development alert if the environment is not a production environment
        if (process.env.NODE_ENV != "PRODUCTION") {
            const embedDev = new Discord.RichEmbed()
                .setTitle("Codeforces Bot Status Update")
                .setAuthor(DISCORD_BOT_NAME, DISCORD_BOT_ICON)
                .setColor(DISCORD_BOT_COLOR)
                .setThumbnail('https://static1.squarespace.com/' +
                    'static/598bdedff9a61ea2b0da2866/t/59f794a427ef2d4ad323e4e5/1509397669374/dev+logo.jpg')
                .setFooter(DISCORD_BOT_FOOTER)
                .setTimestamp()
                .setDescription(`The Codeforces Bot is currently running in a development environment` +
                    ` (A.K.A. probably <@${bot.owners[0].id}>'s PC).` + 
                    ` Please disregard any issues that arise.\n\nThank you. 🙏`)

            announce({ embed: embedDev }, 'bot-commands')
        }
    }, 3000)
})

module.exports = (appexports) => {
    appconfig.exports = appexports

    const { getProblemPoints, resetProblemPoints } = appexports.db

    //Gets daily problem
    const announceDailyProblem = () => {
        let problem = getProblemPoints(POINTS_MIN, POINTS_MAX)

        if (!problem) {

            //If a problem wasnt returned then none must be left 
            //with the parameters set. In that case, refresh the list.
            resetProblemPoints()
            problem = getProblemPoints(POINTS_MIN, POINTS_MAX)

            if (!problem) {

                //If it still doesnt send a problem then exit the process
                console.error('PROBLEM NOT FOUND')
                process.exit(1)
            }
        }

        //Announce the problem
        announce({ embed: buildDailyChallengeRichEmbed(problem) }, 'codeforces')
    }

    //Setup timing
    let currentUTCHour = Date.now() % MS_DAY

    login(() => {

        setTimeout(() => { announceDailyProblem(); setInterval(announceDailyProblem, MS_DAY) },  
            UTC_HOUR * MS_HOUR > currentUTCHour ? 
            UTC_HOUR * MS_HOUR - currentUTCHour : MS_DAY - currentUTCHour + UTC_HOUR * MS_HOUR)
    })
}