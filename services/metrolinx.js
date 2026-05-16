require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI/api/V1";
const API_KEY = process.env.METROLINX_KEY;

if (!API_KEY) {
  throw new Error("METROLINX_KEY is missing in environment variables");
}

/**
 * Generic request helper
 */
async function request(endpoint) {
    const url = `${BASE_URL}${endpoint}?key=${API_KEY}`;
    if (!res.ok) {
        const text = await res.text();
        console.error("Metrolinx API error:", text);
        throw new Error(`Metrolinx API failed: ${res.status}`);
    }

    return res.json();
}

//
// =======================
// 🚆 SCHEDULE APIs
// =======================
//

async function getFares(from, to) {
    const url = `${BASE_URL}/Fares/${from}/${to}?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleTripOnDate(date, from, to, start, maxJourney) {
    const url = `${BASE_URL}/Schedule/Journey/${date}/${from}/${to}/${start}/${maxJourney}?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}


async function getScheduleAllLine(date) {
    const url = `${BASE_URL}/Schedule/Line/All/${date}?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}


async function getScheduleDateLineDirection(date, line, direction) {
    const url = `${BASE_URL}/Schedule/Line/${date}/${line}/${direction}?key=${API_KEY}`;
    console.log("URL:", url);
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleDateTrip(date, trip) {
    const url = `${BASE_URL}/Schedule/Trip/${date}/${trip}?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getVehicles() {
    const url = `${BASE_URL}/Gtfs/FeedVehiclePosition?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getFeedAlerts() {
    const url = `${BASE_URL}/Gtfs/Feed/Alerts?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getFeedTripUpdates() {
    const url = `${BASE_URL}/Gtfs/Feed/TripUpdates?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getServiceAlert() {
    const url = `${BASE_URL}/ServiceUpdate/ServiceAlert/All?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getInformationAlert() {
    const url = `${BASE_URL}/ServiceUpdate/InformationAlert/All?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getMarketingAlert() {
    const url = `${BASE_URL}/ServiceUpdate/MarketingAlert/All?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getUnionDeparturesAlert() {
    const url = `${BASE_URL}/ServiceUpdate/UnionDepartures/All?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getAllException() {
    const url = `${BASE_URL}/ServiceUpdate/Exceptions/All?key=${API_KEY}`;
    const res = await axios.get(url);
    return res.data;
}

module.exports = {
    getFares,
    getScheduleTripOnDate,
    getScheduleAllLine,
    getScheduleDateLineDirection,
    getScheduleDateTrip,
    getVehicles,
    getFeedAlerts,
    getFeedTripUpdates,
    getServiceAlert,
    getInformationAlert,
    getMarketingAlert,
    getUnionDeparturesAlert,
    getAllException
};