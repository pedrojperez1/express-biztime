
function jsonIncludes(json, values) {
    for (let v of values) {
        if (!json[v]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    jsonIncludes
};