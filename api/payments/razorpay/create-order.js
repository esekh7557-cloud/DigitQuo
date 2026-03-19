const { handleCreateRazorpayOrder } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleCreateRazorpayOrder(req, res);
};
