const { handleGetDisplayCurrencyRates } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleGetDisplayCurrencyRates(req, res);
};
