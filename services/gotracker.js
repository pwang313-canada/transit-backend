require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://www.gotracker.ca/gotracker/mobile/proxy/web/Messages/DeparturesWithCoachCount/Union%20GO";

/**
 * Generic request helper (fixed)
 */
async function request() {
    try {
        const res = await axios.get(BASE_URL);
        return res.data;
    } catch (err) {
        console.error("goTracker API error:", err.message);
        throw err;
    }
}

/**
 * 🚆 Get platform data
 */
async function getPlatForm() {
    return await request();
}

module.exports = {
    getPlatForm
};