const {
  state,
  json,
  readBody,
  validateEmail,
  verifyPassword,
  sanitizeUser,
  createSession,
  setSessionCookie
} = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "仅支持 POST 请求。" });
  }

  try {
    const body = await readBody(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!validateEmail(email)) {
      return json(res, 400, { message: "请输入有效的邮箱地址。" });
    }

    const user = state.users.get(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return json(res, 401, { message: "邮箱或密码不正确，请重试。" });
    }

    const token = createSession(email);
    setSessionCookie(res, token);

    return json(res, 200, {
      message: `登录成功，欢迎回来，${user.name}。`,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return json(res, 400, { message: error.message || "登录失败，请重试。" });
  }
};
