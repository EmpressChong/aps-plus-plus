let fs = require('fs'),
    path = require('path'),
    groups = fs.readdirSync(path.resolve(__dirname, './groups')),
    addons = fs.readdirSync(path.resolve(__dirname, './addons')),
    Class = {},
    definitionCount = 0,
    definitionGroupsLoadStart = Date.now();
console.log(`Loading ${groups.length} groups...`);
for (let filename of groups) {
    console.log(`Loading group: ${filename}`);
    let group = require('./groups/' + filename);
    for (let key in group) {
        if (key in Class) {
            console.warn(`WARNING: ${key} is present in multiple definition groups!`);
        } else {
            definitionCount++;
        }
        Class[key] = group[key];
    }
}

let definitionGroupsLoadEnd = Date.now();
console.log("Loaded definitions in " + (definitionGroupsLoadEnd - definitionGroupsLoadStart) + " milliseconds. \n");

console.log(`Loading ${addons.length} addons...`);
for (let filename of addons) {
    if (!filename.endsWith('.js')) continue;
    
    console.log(`Loading addon: ${filename}`);
    require('./addons/' + filename)({ Config: c, Class, Events: events });
}

let addonsLoadEnd = Date.now();
console.log("Loaded addons in " + (addonsLoadEnd - definitionGroupsLoadEnd) + " milliseconds. \n");

// "Flattening" refers to removing PARENT attributes and applying the parents' attributes to the definition themselves, if not overwritten later on.
if (c.flattenDefintions) {
    console.log(`Flattening ${definitionCount} definitions...`);
    let flatten = (output, definition) => {

        // Support for string definition references
        if ("string" == typeof definition) {
            if (definition in Class) {
                definition = Class[definition];
            } else {
                throw Error(`Definition ${definition} is attempted to be gotten but does not exist!`);
            }
        }

        if (definition.PARENT) {
            if (Array.isArray(definition.PARENT) || "string" == typeof definition.PARENT) {
                flatten(output, definition.PARENT);
            } else for (let parent in definition.PARENT) {
                flatten(output, definition.PARENT[parent]);
            }
        }

        for (let key in definition) {
            if (key !== "PARENT") {
                output[key] = definition[key];
            }
        }

        return output;
    };

    let flattened = {};
    for (let key in Class) {
        let output = {};
        flatten(output, Class[key]);
        flattened[key] = output;
    }
    Class = flattened;
    definitionCount = Object.keys(Class).length;
    console.log("Definitions flattened in " + (Date.now() - addonsLoadEnd) + " milliseconds. \n");
}

console.log(`Combined ${groups.length} definition groups and ${addons.length} addons into ${definitionCount} ${c.flattenDefintions ? 'flattened ' : ''}definitions!\n`);
module.exports = Class;