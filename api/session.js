const { json, getSessionUser, sanitizeUser } = require("./_store");

module.exports = (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { message: "仅支持 GET 请求。" });
  }

  const user = getSessionUser(req);

  return json(res, 200, {
    authenticated: Boolean(user),
    user: user ? sanitizeUser(user) : null
  });
};
