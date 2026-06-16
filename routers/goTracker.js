const express = require("express");
const router = express.Router();
const gotracker = require("../services/gotracker");

// Convert service name to two-letter code
const serviceToCode = (serviceName) => {
  const mapping = {
    "Lakeshore West": "LW",
    "Lakeshore East": "LE",
    "Milton": "MI",
    "Barrie": "BR",
    "Kitchener": "KI",
    "Stouffville": "ST",
    "Richmond Hill": "RH",
  };
  return mapping[serviceName] || serviceName.substring(0, 2).toUpperCase();
};

// Convert ISO timestamp to local time string HH:MM:SS
const toLocalTimeHMS = (isoString) => {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

router.get("/platform", async (req, res) => {
  try {
    const rawData = await gotracker.getPlatForm();

    if (!rawData || rawData.status !== "Ok") {
      return res.status(500).json({ error: "Invalid data from GO Tracker" });
    }

    const filteredTrips = rawData.trips
      .filter(trip => trip.info !== "Wait" && trip.platform !== "-")
      .map(trip => ({
        number: trip.number,
        isExpress: trip.isExpress || false,
        coachCount: trip.coachCount,
        time: toLocalTimeHMS(trip.time),
        platform: trip.platform,
        service: serviceToCode(trip.service),   // ✅ now returns "LW", "LE", etc.
        status: trip.info.split('/')[0].trim(),
      }));

    res.json({
      status: "Ok",
      date: rawData.date,
      trips: filteredTrips,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Platform API failed" });
  }
});

router.get("/trip", async (req, res) => {
  try {
    const trip = req.query.trip;
    const data = await gotracker.getTrip(trip);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "goTracker trip API failed" });
  }
});

module.exports = router;