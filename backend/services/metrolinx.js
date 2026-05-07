const axios = require("axios");

const KEY = process.env.METROLINX_KEY;

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI/api/V1";

async function getSchedule(date) {
    const url = `${BASE_URL}/Schedule/Line/All/${date}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getVehicles() {
    const url = `${BASE_URL}/Gtfs/FeedVehiclePosition?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getAlerts() {
    const url = `${BASE_URL}/ServiceUpdate/Exceptions/Train?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

module.exports = {
    getSchedule,
    getVehicles,
    getAlerts
};
