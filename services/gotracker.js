require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://www.gotracker.ca/gotracker/mobile/proxy/web";

/**
 * Generic request helper (fixed)
 */
async function request() {
    try {
        const res = await axios.get(BASE_URL);
        return res.data;
    } catch (err) {
        console.error("gotracker API error:", err.message);
        throw err;
    }
}

/**
 * 🚆 Get platform data
 */
async function getPlatForm() {
    return await request();
}

async function getPlatForm() {
    const url = `${BASE_URL}/Messages/DeparturesWithCoachCount/Union%20GO`;
    const res = await axios.get(url);
    return res.data;
}

async function getTrip(trip) {
    const url = `${BASE_URL}/Schedule/Today/Trip/${trip}`;
    const res = await axios.get(url);
    return res.data;
}

module.exports = {
    getPlatForm,
    getTrip
};