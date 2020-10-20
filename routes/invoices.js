const express = require("express");
const ExpressError = require("../ExpressError");
const db = require("../db");
const { jsonIncludes } = require("../helpers");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(
            `SELECT * FROM invoices`
        )
        return res.json({invoices: results.rows})
    } catch (e) {
        next(e);
    }
})

router.get("/:id", async (req, res, next) => {
    try {
        const queryString = `SELECT * FROM invoices WHERE id = $1`;
        const params = [req.params.id];
        const results = await db.query(queryString, params);
        if (results.rows.length === 0) {
            throw new ExpressError(`Invoice id ${req.params.id} not found`, 404);
        } else {
            return res.json({company: results.rows[0]});
        }
    } catch (e) {
        next(e);
    }
})

router.post("/", async (req, res, next) => {
    try {
        if (jsonIncludes(req.body, ["comp_code", "amt"])) {
            const queryString = `
            INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`;
            const params = [req.body.comp_code, req.body.amt];
            const results = await db.query(queryString, params);
            return res.status(201).json({invoice: results.rows[0]});
        } else {
            throw new ExpressError("Please provide a json value with comp_code and amt values", 400);
        }
        
    } catch (e) {
        next(e);
    }
})

router.put("/:id", async (req, res, next) => {
    try {
        if (jsonIncludes(req.body, ["amt"])) {
            const queryString = `
            UPDATE invoices
            SET amt=$1 
            WHERE id=$2
            RETURNING id, comp_code, amt
            `;
            const params = [req.body.amt, req.params.id];
            const results = await db.query(queryString, params);
            if (results.rows.length === 0) {
                throw new ExpressError(`invoice with id ${req.params.id} not found`, 404);
            }
            return res.json({status: "updated", invoice: results.rows[0]});
        } else {
            throw new ExpressError("Please provide a valid json with new invoice amt value", 400);
        }
    } catch (e) {
        next(e);
    }
})

router.delete("/:id", async (req, res, next) => {
    try {
        const queryString = `DELETE FROM invoices WHERE id=$1 RETURNING id, comp_code, amt`;
        const params = [req.params.id];
        const results = await db.query(queryString, params);
        if (results.rows.length === 0) {
            throw new ExpressError(`invoice with id ${req.params.id} not found`, 404);
        }
        return res.status(204).json({status: "deleted", data: results.rows[0]});
    } catch (e) {
        next(e);
    }
})

module.exports = router;