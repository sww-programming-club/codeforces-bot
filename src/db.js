const request = require('request')

const exporting = {}

const db = {
    index : {},
    points: {},
    tags  : {}
}

let used        = []
let problemPool = {}


//Return a problem within the range of [min, max] and remove it from the pool of problems
exporting.getProblemPoints = (min, max) => {
    const points = Object.keys(problemPool.points)

    //Removes any problem keys that are not within the range [min, max]
    for (i = points.length - 1; i >= 0; i--) {
        if (points[i] < min || points[i] > max) {
            points.splice(i, 1)
        }
    }

    //Exit if no problems exist within the constraints
    if (points.length == 0) return

    //Selects a random set of problems with a point total that falls in the range
    let key = points[Math.floor(Math.random() * points.length)]
    let problems = problemPool.points[key]

    //Selects a random problem from the set
    let problemKey = Math.floor(Math.random() * problems.length)
    let problem = problems[problemKey]

    //Removes the problem from the pool
    problems.splice(problemKey, 1)
    used.push(problem)

    //Delete the set if it is empty in order to avoid picking an empty set next time
    if (problems.length == 0) delete problemPool.points[key]

    return problem
}

//Return a random problem based on points
exporting.getRandomProblem = (index) => {
    
    //If the letter index constraint exists then filter by that, otherwise points
    let filterByKey = index ? 'index' : 'points'
    let keys = Object.keys(db[filterByKey])
    let problems = db[filterByKey][index ? index : keys[Math.floor(Math.random() * keys.length)]]

    //If the problem set doesnt exist under the constraint then exit the function
    if (!problems) return

    //Selects a random problem from that set
    let problemKey = Math.floor(Math.random() * problems.length)
    let problem = problems[problemKey]

    return problem
}

//Reset the problem pool indexed by points by performing a deep-copy of the original database
exporting.resetProblemPoints = () => problemPool.points = JSON.parse(JSON.stringify(db.points))

module.exports = (callback) => {

    //Fetch metadata on all Codeforces problems
    request('https://codeforces.com/api/problemset.problems', { json: true }, (err, res, body) => {

        //Exit process if fetch failed
        if (err || body.status !== 'OK') {
            console.log('HTTP GET ERROR')
            console.log(err)
            process.exit(1)
        }
        
        //Metadata
        let data = body.result.problems

        //Iterate through metadata, indexing each by their 
        //difficulty letter, points, and tags
        for (i = 0; i < data.length; i++) {
            let node = data[i]

            if (node.points) {
                node.points = parseInt(node.points)

                if (isNaN(node.points)) continue
                if (!db.points[node.points]) db.points[node.points] = []

                db.points[node.points].push(node)
            }

            if (!db.index[node.index]) db.index[node.index] = []
            db.index[node.index].push(node)

            for (k = 0; k < node.tags.length; k++)  {
                let tag = node.tags[k]

                if (!db.tags[tag]) db.tags[tag] = []
                db.tags[tag].push(node)
            }
        }

        //Initalize the pool of problems the bot can pick from by deep-copying 
        //the now populated and indexed database
        problemPool = JSON.parse(JSON.stringify(db))

        //On success, call the provided callback with the actual exports
        callback(exporting)
    })
}