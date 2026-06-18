const { handleCreateCryptoOrder } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleCreateCryptoOrder(req, res);
};
