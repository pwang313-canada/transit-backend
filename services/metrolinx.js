require("dotenv").config();
const axios = require("axios");

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI/api";
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

/**
 * Get all lines
 */
async function getScheduleAllLine() {
    return request("/Schedule/All/Line");
}

/**
 * Get journeys between stations (your main use case)
 */
async function getScheduleDateLineDirection({
    from,
    to,
    date,
    start,
    maxJourney = 3
}) {
    if (!from || !to || !date || !start) {
        throw new Error("Missing required params: from, to, date, start");
    }

    const endpoint =
        `/JourneyPlanningService/JSON/journey` +
        `?from=${from}` +
        `&to=${to}` +
        `&date=${date}` +
        `&time=${start}` +
        `&maxJourneys=${maxJourney}`;

    return request(endpoint);
}

//
// =======================
// 💰 FARES
// =======================
//

async function getFares(from, to) {
    if (!from || !to) {
        throw new Error("Missing fare params");
    }

    const endpoint =
        `/FareService/fares` +
        `?from=${from}` +
        `&to=${to}`;

    return request(endpoint);
}

//
// =======================
// 🚨 SERVICE ALERTS
// =======================
//

/**
 * Get alerts (optionally filter type)
 */
async function getAlerts(type = "") {
    // If API supports filtering, adjust here
    const endpoint = type
        ? `/ServiceUpdateService/alerts?type=${type}`
        : `/ServiceUpdateService/alerts`;

    return request(endpoint);
}

//
// =======================
// EXPORTS
// =======================
//

module.exports = {
    // Schedule
    getScheduleAllLine,
    getScheduleDateLineDirection,

    // Fares
    getFares,

    // Alerts
    getAlerts
};



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
    console.log("URL:", url);
    const res = await axios.get(url);
    return res.data;
}


async function getScheduleDateLineDirection(date, line, direction) {
    const url = `${BASE_URL}/Schedule/Line/${date}/${line}/${direction}?key=${API_KEY}`;
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