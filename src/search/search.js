/* eslint class-methods-use-this: ["error", { "exceptMethods": ["searchLocations"] }] */
/* eslint no-console: 0 */
/* eslint class-methods-use-this: 0 */

const {resolve, dirname} = require("path");
const fs = require("fs-extra")
module.exports = async (client) => {

    class Searchloader {

        constructor(client) {
            this.client = client;
            this.aliases = new Map()
            if (dirname(__dirname, "/../../") == dirname(require.main.filename)) {
                this.clientLocations = this.searchLocations(dirname(__dirname, "/../"))
            } else {
                this.clientLocations = this.searchLocations(dirname(__dirname, "/../"))
                this.userLocations = this.searchLocations(dirname(require.main.filename))
            }
            this.loadCommands = require("./loadCommands.js")
            this.loadMF = require("./loadMf.js")
            this.loadBF = require("./loadBf.js")
            this.loadSnippets = require("./loadSnippet.js")
            this.loadPermissions = require("./loadPermission.js")
        }

        searchLocations(location) {
            return {
                "commands": resolve(location, "commands"),
                "functions": resolve(location, "functions"),
                "messageFunctions": resolve(location, "functions/messages"),
                "bootFunctions": resolve(location, "functions/boot"),
                "snippets": resolve(location, "functions/snippets"),
                "events": resolve(location, "events"),
                "permissions": resolve(location, "permissions")
            }
        }

        async loadAll(locations) {

            if (this.dataStore) {
                this.backupDataStore = this.dataStore
            }
            this.dataStore = {}
            await this.loadCommands(locations.commands)
            if (!(await fs.exists(locations.functions))) {
                await this.genFolder(locations.functions)
            }
            await this.loadMF(locations.messageFunctions)
            await this.loadBF(locations.bootFunctions)
            await this.loadSnippets(locations.snippets)
            await this.loadPermissions(locations.permissions)
            //    this.loadEvents(locations.events)
            return this.dataStore;
        }

        async genFolder(location) {
            this.client.config.first = true;
            try {
                await fs.mkdir(location)
            } catch (e) {
                console.error(`${location} | Error while trying to generate folder: \n ${e}`)
            }
        }

        async searchInDirectories(location, notFirst) {
            var files = null;
            try {
                files = await fs.readdir(location)
            } catch (err) {

                if (err.code == "ENOENT") {
                    await this.genFolder(location)
                    var x = await this.searchInDirectories(location, notFirst)
                    return x;
                }
                return console.error("An error occurred while searching directories.", err)
            }
            var jsFiles = files.filter(i => {
                return i.endsWith(".js")
            })
            jsFiles = jsFiles.map(i => (resolve(location, i)))
            if (!files) {
                return new Map()
            }
            if (!notFirst) {
                var folders = files.filter(i => {
                    return !(i.includes("."))
                })
                var all = folders.map(i => (this.searchInDirectories(resolve(location, i), true)))
                var data = await Promise.all(all)
                data.forEach(i => {
                    i.forEach(i => {
                        jsFiles.push(resolve(location, i))
                    })
                })
            }
            return jsFiles

        }

        merge(c, u) {
            if (!u) {return c}
            u.commands.forEach((i, n) => {
                if (!c.commands.has(n)) {
                    c.commands.set(n, i)
                }
            })
            u.functions.message.forEach((i, n) => {
                if (!c.functions.message.has(n)) {
                    c.functions.message.set(n, i)
                }
            })
            u.functions.boot.forEach((i, n) => {
                if (!c.functions.boot.has(n)) {
                    c.functions.boot.set(n, i)
                }
            })
            return c;
        }

    }
    var loader = new Searchloader(client)
    return loader.merge(await loader.loadAll(loader.clientLocations), await loader.loadAll(loader.userLocations))
}