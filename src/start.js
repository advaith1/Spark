var Chalk = require("chalk")
module.exports = (client) => {

    /*
    client.dataStore.events.forEach((i,n) => {
    client.on(name, (one, two, three, four, five) => {
    i.function(one, two, three, four, five)
    })
    })
    */

    client.on("ready", () => {
        client.dataStore.functions.boot.forEach(i => {
            setTimeout(() => {

                if (i.time == 0) {
                    i.function(client)
                } else {
                    i.function(client)
                    setInterval(() => {i.function(client)}, i.time)
                }
            }, i.delay)
        })
    })
    client.on("message", (message) => {

        client.config.prefix.forEach(async i => {
            if (message.content.toLowerCase().startsWith(i)) {
                var command = await isValidCommand(client, message, message.content.toLowerCase().split(" ")[0].replace(i, ""))
                if (command == true) {
                    if (await mf(client, message, command)) {executeCommand(client, message, message.content.toLowerCase().split(" ")[0].replace(i, ""))}
                } else {
                    await mf(client, message)
                }
            }
        })

    })




}

async function mf(client, message, command) {
    var results = null;
    if (command) {
        try {
            results = await client.dataStore.functions.message.filter(i => {
                return (i.mf.type == "all" || i.mf.type == "commands")
            }).map(i => (i.mf.code(client, message)))
        } catch (e) {
            console.log(e)
        }
        if (results.includes(true)) {
            return false;
        }
        return true;
    }
    try {
        results = await client.dataStore.functions.message.filter(i => {
            return (i.mf.type == "all" || i.mf.type == "messages")
        }).map(i => (i.mf.code(client, message)))
    } catch (e) {
        console.log(e)
    }
    if (results.includes(true)) {
        return false;
    }
    return true;
}

async function isValidCommand(client, message, commandName) {
    if (client.dataStore.commands.has(commandName)) {
        var {command} = client.dataStore.commands.get(commandName)
        var permissions = client.dataStore.permissions.filter(i => {
            return i.permission.level == command.level
        })
        if (permissions.size == 0) {return true}
        var results = permissions.map(async i => {
            var {permission} = i
            var result = await permission.code(client, message)
            if (typeof result != "boolean") {
                console.log(Chalk.red("Error | ") + "Permission " + Chalk.yellow(permission.name) + " is not returning the correct value, please read " + Chalk.blue("https://discordspark.tk/docs/permissions") + " for more information.")
                return true;
            }
            return result;

        })
        results = await Promise.all(results)
        if (results.includes(true)) {
            return false;
        }
        return true;
    }
    return false;


}

function executeCommand(client, message, commandName) {
    var {command, location} = client.dataStore.commands.get(commandName)

    try {
        command.code(client, message)
    } catch (e) {
        console.error(location + " | An error occured while executing the command.\n" + e)
    }

}
