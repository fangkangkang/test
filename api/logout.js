const { json, clearSessionCookie, parseCookies, state } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "仅支持 POST 请求。" });
  }

  const cookies = parseCookies(req);
  const token = cookies.northline_session;

  if (token) {
    state.sessions.delete(token);
  }

  clearSessionCookie(res);

  return json(res, 200, { message: "你已退出登录。" });
};
