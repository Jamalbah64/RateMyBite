const axios = require("axios");

async function geocodeAddress(address) {
  const url = "https://nominatim.openstreetmap.org/search";

  const response = await axios.get(url, {
    params: {
      q: address,
      format: "json",
      limit: 1
    },
    headers: {
      "User-Agent": "RateMyBite/1.0 (cs465 student project)"
    }
  });

  if (!response.data || response.data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lng: parseFloat(response.data[0].lon)
  };
}

module.exports = { geocodeAddress };
