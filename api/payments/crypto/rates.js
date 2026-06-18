const { handleGetCryptoRates } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleGetCryptoRates(req, res);
};
