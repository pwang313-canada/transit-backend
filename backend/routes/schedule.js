const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

router.get("/tripOnDate", async (req, res) => {
    try {
        const date = req.query.date || "20260626";
        const from = req.query.from || "ER";
        const to = req.query.to || "UN"; || "20260626";
        const start = req.query.start || "0600";
        const maxJourney = req.query.maxJourney || "10";

        const data = await metrolinx.getTripOnDate(date, from, to, startTime, maxJourney);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});

router.get("/journey", async (req, res) => {
    try {
        const date = req.query.date || "20260626";
        const trip = req.query.trip || "2706";

        const data = await metrolinx.getScheduleJourney(date, trip);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});


router.get("/allLine", async (req, res) => {
    try {
        const date = req.query.date || "20260626";

        const data = await metrolinx.getScheduleAllLine(date);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});

router.get("/dateLineDirection", async (req, res) => {
    try {
        const date = req.query.date || "20260626";
        const line = req.query.line || "2706";
        const direction = req.query.direction || "E";

        const data = await metrolinx.getScheduleDateLine(date);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});

router.get("/dateTrip", async (req, res) => {
    try {
        const date = req.query.date || "20260626";
        const trip = req.query.trip || "2706";

        const data = await metrolinx.getScheduleDateTrip(date);

        res.json(data);

    } catch (err) {
        res.status(500).json({ error: "Schedule API failed" });
    }
});

module.exports = router;
