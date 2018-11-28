const Discord   = require('discord.js')
const commando  = require('discord.js-commando')

const appconfig = require('../../appconfig')

const {
    DISCORD_BOT_COLOR,
    DISCORD_BOT_ICON,
    DISCORD_BOT_NAME,
    URL_CODEFORCES
} = appconfig.CORE

//Build the RichEmbed for a given problem
const buildProblemRichEmbed = (data) => {
    return new Discord.RichEmbed()
        .setTitle(`Codeforces Problem | ${data.index} | ${data.name}`)
        .setAuthor(DISCORD_BOT_NAME, DISCORD_BOT_ICON)
        .setURL(`${URL_CODEFORCES}/problemset/problem/${data.contestId}/${data.index}`)
        .setColor(DISCORD_BOT_COLOR)
        .setFooter('Tags: ' + (data.tags.length == 0 ? 'none' : data.tags.join(', ')))
        .setThumbnail(DISCORD_BOT_ICON)
        .setTimestamp()
        .setDescription(`This is a ${data.points ? `**${Math.floor(data.points)}** point` : ''} **${data.index}** problem. ` +
            `Good luck out there. 👍`)
}

class Problem extends commando.Command {
    //Setup
    constructor(client) {
        super(client, {
            name: 'problem',
            group: 'main',
            memberName: 'problem',
            description: `Outputs a random problem to the user.
                This command has no restrictions.
                This command can only be used 120 times per minute.
                This command can be used within servers or DMs.`,
            throttling: {
                usages: 120,
                duration: 60
            }
        })
    }

    //Reply with the RichEmbed of a random problem
    async run(message, arg) {
        
        //Extract the letter index from the message if specified
        let letter = arg.match(/[a-zA-Z]/)
        let problem = appconfig.exports.db.getRandomProblem(letter && letter[0].toUpperCase())

        message.reply(problem 
            ? {embed: buildProblemRichEmbed(problem)} 
            : `Sorry, but I couldn't find any ${letter ? letter[0].toUpperCase() : ''} problems for some reason. 🤔`
        )
    }
}

module.exports = Problem