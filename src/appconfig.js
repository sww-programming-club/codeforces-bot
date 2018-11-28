module.exports = {
    CORE: {
        DISCORD_BOT_PREFIX: '!',
        DISCORD_BOT_NAME: 'Codeforces Bot',
        DISCORD_BOT_ICON: 'https://www.stopstalk.com/stopstalk/static/images/codeforces_logo.png?_rev=20180902021609',
        DISCORD_BOT_FOOTER: 'Certified Bot for the SWW Programming Club 🤖 | Slightly Sentient.',
        DISCORD_BOT_COLOR: [255, 255, 255],
        URL_CODEFORCES: 'https://codeforces.com',
        POINTS_MIN: 1000,
        POINTS_MAX: 2000,
        TIME_ZONE: -5,
        TIME_PROBLEM_DAILY: 8
    },
    SECURITY: {
        AUTH_DISCORD: {
            TOKEN: process.env.AUTH_TOKEN_DISCORD
        }
    }
}