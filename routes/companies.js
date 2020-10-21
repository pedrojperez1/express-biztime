const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../ExpressError");
const db = require("../db");
const { jsonIncludes } = require("../helpers");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT * FROM companies`
        )
        return res.json({companies: results.rows})
    } catch (e) {
        next(e);
    }
})

router.get("/:code", async (req, res, next) => {
    try {
        const queryString = `SELECT code, name, description FROM companies WHERE code = $1`;
        const params = [req.params.code];
        const results = await db.query(queryString, params);
        if (results.rows.length === 0) {
            throw new ExpressError(`Company code ${req.params.code} not found`, 404);
        }
        const invoices = await db.query("SELECT * FROM invoices WHERE comp_code=$1", [req.params.code]);
        const companyInfo = {company: results.rows[0]};
        companyInfo.company["invoices"] = invoices.rows;
        return res.json(companyInfo);
    } catch (e) {
        next(e);
    }
})

router.post("/", async (req, res, next) => {
    try {
        if (jsonIncludes(req.body, ["code", "name", "description"])) {
            const queryString = `
            INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3) RETURNING code, name, description`;
            const params = [slugify(req.body.code), req.body.name, req.body.description];
            const results = await db.query(queryString, params);
            return res.status(201).json({company: results.rows[0]});
        } else {
            throw new ExpressError("Please provide a json value with code, name, and description values", 400);
        }
        
    } catch (e) {
        next(e);
    }
})

router.put("/:code", async (req, res, next) => {
    try {
        if (jsonIncludes(req.body, ["name", "description"])) {
            const queryString = `
            UPDATE companies
            SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description
            `;
            const params = [req.body.name, req.body.description, req.params.code];
            const results = await db.query(queryString, params);
            if (results.rows.length === 0) {
                throw new ExpressError(`company ${req.params.code} not found`, 404);
            }
            return res.json({status: "updated", company: results.rows[0]});
        } else {
            throw new ExpressError("Please provide a valid json with name and description values", 400);
        }
    } catch (e) {
        next(e);
    }
})

router.delete("/:code", async (req, res, next) => {
    try {
        const queryString = `DELETE FROM companies WHERE code=$1 RETURNING code, name`;
        const params = [req.params.code];
        const results = await db.query(queryString, params);
        if (results.rows.length === 0) {
            throw new ExpressError(`company ${req.params.code} not found`, 404);
        }
        return res.status(202).json({status: "deleted", data: results.rows[0]});
    } catch (e) {
        next(e);
    }
})


module.exports = router;