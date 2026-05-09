const express = require("express");
const app = express();
const schedule = require("./routes/schedule");
const PORT = process.env.PORT || 3000;

// ✅ In-memory cache
const cache = {};

// ✅ Helper: get today date YYYYMMDD
function getToday() {
  const now = new Date();
  return now.toISOString().slice(0, 10).replace(/-/g, "");
}

// ✅ Helper: ms until next midnight
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

// ✅ Preload cache for today
async function preloadCache() {
  const today = getToday();
  console.log("🔥 Preloading cache for:", today);

  try {
    const data = await require("./services/metrolinx").getScheduleAllLine(today);

    cache[today] = {
      data,
      expiresAt: Date.now() + msUntilMidnight()
    };

    console.log("✅ Cache ready for", today);
  } catch (err) {
    console.error("❌ Preload failed:", err.message);
  }
}

// ✅ Midnight refresh loop
function startMidnightRefresh() {
  const delay = msUntilMidnight();

  console.log(`⏳ Next refresh in ${Math.round(delay / 1000)} sec`);

  setTimeout(async () => {
    console.log("🌙 Midnight refresh triggered");

    // Clear old cache
    Object.keys(cache).forEach(k => delete cache[k]);

    // Preload new day
    await preloadCache();

    // Restart loop
    startMidnightRefresh();
  }, delay);
}

// ✅ Attach cache to request
app.use((req, res, next) => {
  req.cache = cache;
  next();
});

app.use("/schedule", scheduleRouter);

// ✅ Start server + preload
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await preloadCache();       // 🔥 preload immediately
  startMidnightRefresh();     // 🔁 schedule daily refresh
});