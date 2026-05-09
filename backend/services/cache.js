const NodeCache = require("node-cache");

// single shared cache instance
const cache = new NodeCache();

// ==============================
// 🕒 seconds until midnight
// ==============================
function secondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight - now) / 1000);
}

// ==============================
// 🔑 build cache key
// ==============================
function buildKey(prefix, params) {
    const today = new Date().toISOString().split("T")[0];
    return `${prefix}:${JSON.stringify(params)}:${today}`;
}

// ==============================
// ⚡ generic cache wrapper
// ==============================
async function getOrSetCache(prefix, params, fetchFn) {
    const key = buildKey(prefix, params);

    const cached = cache.get(key);
    if (cached) {
        console.log("⚡ Cache hit:", key);
        return cached;
    }

    console.log("🌐 Fetching:", key);

    const data = await fetchFn();

    cache.set(key, data, secondsUntilMidnight());

    return data;
}

module.exports = {
    cache,
    getOrSetCache
};