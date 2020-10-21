process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
    // create test company
    const results = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('test', 'Test Co.', 'This is a test company')
        RETURNING code, name, description`
    );
    testCompany = results.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`);
});

describe("GET /companies", () => {
    test("Should work for base case", async () => {
        const res = await request(app).get(`/companies`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({companies: [testCompany]})
    });
});

describe("GET /companies/:code", () => {
    test("Should work for base case when company is found", async () => {
        const res = await request(app).get(`/companies/test`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: "test", 
                name: "Test Co.", 
                description: "This is a test company", 
                invoices: []
            }
        });
    });
    test("Should return 404 when company is not found", async () => {
        const res = await request(app).get(`/companies/nogood`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /companies", () => {
    test("Should work for base case when valid json is provided", async () => {
        const data = {
            "code": "new",
            "name": "New Inc.",
            "description": "A new company"
        };
        const res = await request(app).post(`/companies`).send(data);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({company: data});
    });
    test("Should slugify code when provided a code with spaces or punctuation", async () => {
        const data = {
            "code": "new 123",
            "name": "New Inc.",
            "description": "A new company"
        };
        const res = await request(app).post(`/companies`).send(data);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            company: {
                code: "new-123",
                name: "New Inc.",
                description: "A new company"
            }
        });
    });
    test("Should return 400 when bad request data is provided", async () => {
        const data = {
            "nocode": "new",
            "noname": "New Inc."
        };
        const res = await request(app).post(`/companies`).send(data);
        expect(res.statusCode).toBe(400);    
    });
});

describe("PUT /companies/:code", () => {
    test("Should work for base case when company is found", async () => {
        const data = {
            "name": "Old Inc.",
            "description": "An old company"
        };
        const res = await request(app).put(`/companies/test`).send(data);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            status: "updated",
            company: {
                code: "test",
                name: "Old Inc.",
                description: "An old company"
            }
        });
    });
    test("Should return 404 when company is not found", async () => {
        const data = {
            "name": "Old Inc.",
            "description": "An old company"
        };
        const res = await request(app).put(`/companies/nogood`).send(data);
        expect(res.statusCode).toBe(404);
    });
    test("Should return 400 when bad request data is provided", async () => {
        const data = {
            "nocode": "new",
            "noname": "New Inc."
        };
        const res = await request(app).put(`/companies/new`).send(data);
        expect(res.statusCode).toBe(400);  
    });
});

describe("DELETE /companies/:code", () => {
    test("Should work for base case when company is found", async () => {
        const res = await request(app).delete(`/companies/test`);
        expect(res.statusCode).toBe(202);
        expect(res.body).toEqual({
            status: "deleted",
            data: {code: "test", name: "Test Co."}
        });
    });
    test("Should return 404 when company is not found", async () => {
        const res = await request(app).delete(`/companies/omg`);
        expect(res.statusCode).toBe(404);
    });
});

afterAll(async () => {
    await db.end();
});