const axios = require("axios");

const KEY = process.env.METROLINX_KEY;

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI/api/V1";

async function getFares(from, to) {
    const url = `${BASE_URL}/Fares/${from}/${to}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleTripOnDate(date, from, to, start, maxJourney) {
    const url = `${BASE_URL}/Schedule/Journey/${date}/${from}/${to}/${start}/${maxJourney}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleDateTrip(date, trip) {
    const url = `${BASE_URL}/Schedule/Trip/${date}/${trip}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getScheduleAllLine(date) {
    const url = `${BASE_URL}/Schedule/Line/All/${date}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleDateLineDirection(date, line, direction) {
    const url = `${BASE_URL}/Schedule/Line/${date}/${line}/${direction}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getScheduleDateTrip(date, trip) {
    const url = `${BASE_URL}/Schedule/Trip/${date}/${trip}?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getVehicles() {
    const url = `${BASE_URL}/Gtfs/FeedVehiclePosition?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getFeedAlerts() {
    const url = `${BASE_URL}/Gtfs/Feed/Alerts?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getFeedTripUpdates() {
    const url = `${BASE_URL}/Gtfs/Feed/TripUpdates?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

async function getServiceAlert() {
    const url = `${BASE_URL}/ServiceUpdate/ServiceAlert/All?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getInformationAlert() {
    const url = `${BASE_URL}/ServiceUpdate/InformationAlert/All?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getMarketingAlert() {
    const url = `${BASE_URL}/ServiceUpdate/MarketingAlert/All?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getUnionDeparturesAlert() {
    const url = `${BASE_URL}/ServiceUpdate/UnionDepartures/All?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}
async function getAllException() {
    const url = `${BASE_URL}/ServiceUpdate/Exceptions/All?key=${KEY}`;
    const res = await axios.get(url);
    return res.data;
}

module.exports = {
    getFares,
    getScheduleTripOnDate,
    getScheduleJourney,
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