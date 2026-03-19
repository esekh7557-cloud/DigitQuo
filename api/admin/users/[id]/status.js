const { handleAdminUpdateUserStatus } = require("../../../_lib/backend");

module.exports = async (req, res) => {
  await handleAdminUpdateUserStatus(req, res, req.query.id);
};
