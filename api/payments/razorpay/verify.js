const { handleVerifyRazorpayPayment } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleVerifyRazorpayPayment(req, res);
};
