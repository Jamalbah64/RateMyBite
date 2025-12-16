const { geocodeAddress } = require("./services/geocoding");

(async () => {
  const r = await geocodeAddress("Boston, MA");
  console.log(r);
})();
