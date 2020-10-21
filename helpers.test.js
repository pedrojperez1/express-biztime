process.env.NODE_ENV = "test";

const { jsonIncludes } = require("./helpers");

let testJson = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
}

describe("Test jsonIncludes() helper method", () => {
    test("Function should work for base case" , () => {
        expect(jsonIncludes(testJson, ["key1", "key2", "key3"])).toBe(true);
        expect(jsonIncludes(testJson, ["key1"])).toBe(true);
        expect(jsonIncludes(testJson, ["key1", "key5"])).toBe(false);
    })

    test("Function should return true when empty array is provided", () => {
        expect(jsonIncludes(testJson, [])).toBe(true);
    })
})