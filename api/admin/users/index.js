const { handleAdminCreateUser } = require("../../_lib/backend");

module.exports = async (req, res) => {
  await handleAdminCreateUser(req, res);
};
