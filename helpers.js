const db = require("./db");

function jsonIncludes(json, values) {
    const keys = Object.keys(json);
    for (let v of values) {
        if (!keys.includes(v)) {
            return false;
        }
    }
    return true;
}


module.exports = {
    jsonIncludes
};