const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

router.get("/", async (req, res) => {
    try {
        const from = req.query.from  || "ER";
        const to = req.query.to  || "UN";
        const data = await metrolinx.getFares(from, to);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Fares API failed" });
    }
});

module.exports = router;
