const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

router.get("/", async (req, res) => {
    try {
        const date = req.query.date || "20260626";

        const data = await metrolinx.getSchedule(date);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});

module.exports = router;
