process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");



let testCompany;
let testInvoice;
beforeEach(async () => {
    const company = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('test', 'Test Co.', 'This is a test company')
        RETURNING code, name, description`
    );
    testCompany = company.rows[0];
    const invoice = await db.query(`
        INSERT INTO invoices (comp_code, amt) 
        VALUES ('test', 500)
        RETURNING id, comp_code, amt, paid`
    );
    testInvoice = invoice.rows[0];
    console.log(`At creation, testInvoice.id = ${testInvoice.id}`)
});

afterEach(async () => {
    let deletes = [
        db.query(`DELETE FROM companies`),
        db.query(`DELETE FROM invoices`)
    ];
    Promise.all(deletes)
        .then(() => console.log("Deleted data from companies and invoices."))
        .catch(e => console.log(e))
    
});

describe("GET /invoices", () => {
    test("Should work for base case", async () => {
        const res = await request(app).get(`/invoices`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({invoices: [testInvoice]})
    });
});

describe("GET /invoices/:id", () => {
    test("Should work for base case", async () => {
        const res = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "test",
                amt: 500,
                paid: false,
                paid_date: null,
                add_date: expect.any(String)
            }
        });
    });
    test("Should return 404 when invoice is not found", async () => {
        const res = await request(app).get(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

describe("POST /invoices", () => {
    test("Should work for base case when valid json is provided", async () => {
        const data = {
            "comp_code": "test",
            "amt": 1000
        };
        const res = await request(app).post(`/invoices`).send(data);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "test",
                amt: 1000,
                paid: false,
                add_date: expect.any(String),
                paid_date: null
            }
        });
    });
    test("Should return 400 when bad request data is provided", async () => {
        const data = {
            "nocode": "new",
            "noname": "New Inc."
        };
        const res = await request(app).post(`/invoices`).send(data);
        expect(res.statusCode).toBe(400);    
    });
});

describe("PUT /invoices/:id", () => {
    test("Should work for base case when valid json is provided", async () => {
        const data = {amt: 20, paid: true}
        const res = await request(app).put(`/invoices/${testInvoice.id}`).send(data);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            status: "updated",
            invoice: {
                id: expect.any(Number),
                comp_code: "test",
                amt: 20,
                paid: true
            }
        })
    });
    test("Should return 400 when bad request data is provided", async () => {
        const data = {
            "nocode": "new",
            "noname": "New Inc."
        };
        const res = await request(app).put(`/invoices`).send(data);
        expect(res.statusCode).toBe(404);    
    });
});

describe("DELETE /invoices/:id", () => {
    test("Should work for base case when invoice is found", async () => {
        const res = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(res.statusCode).toBe(202);
        expect(res.body).toEqual({
            status: "deleted", 
            data: {
                id: expect.any(Number),
                comp_code: "test",
                amt: expect.any(Number)
            }
        });
    });
    test("Should return 404 when invoice is not found", async () => {
        const res = await request(app).delete(`/invoices/0`);
        expect(res.statusCode).toBe(404);
    });
});

afterAll(async () => {
    await db.end();
});
