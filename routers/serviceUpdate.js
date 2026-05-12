const express = require("express");
const router = express.Router();
const metrolinx = require("../services/metrolinx");

router.get("/serviceAlert", async (req, res) => {
    try {
        const data = await metrolinx.getAlerts();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Alerts API failed" });
    }
});

router.get("/informationAlert", async (req, res) => {
    try {
        const data = await metrolinx.getAlerts();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Alerts API failed" });
    }
});
router.get("/marketingAlert", async (req, res) => {
    try {
        const data = await metrolinx.getAlerts();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Alerts API failed" });
    }
});

router.get("/unionDeparturesAlert", async (req, res) => {
    try {
        const data = await metrolinx.getAlerts();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Alerts API failed" });
    }
});
module.exports = router;
