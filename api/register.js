const {
  state,
  json,
  readBody,
  validateEmail,
  hashPassword,
  sanitizeUser
} = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { message: "仅支持 POST 请求。" });
  }

  try {
    const body = await readBody(req);
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const confirmPassword = body.confirmPassword || "";

    if (!name) {
      return json(res, 400, { message: "请输入用户名。" });
    }

    if (!validateEmail(email)) {
      return json(res, 400, { message: "请输入有效的邮箱地址。" });
    }

    if (password.length < 6) {
      return json(res, 400, { message: "密码长度至少需要 6 位。" });
    }

    if (password !== confirmPassword) {
      return json(res, 400, { message: "两次输入的密码不一致。" });
    }

    if (state.users.has(email)) {
      return json(res, 409, { message: "该邮箱已被注册，请直接登录。" });
    }

    const user = {
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    state.users.set(email, user);

    return json(res, 201, {
      message: `注册成功，欢迎你，${name}。请切换到登录完成验证。`,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return json(res, 400, { message: error.message || "注册失败，请重试。" });
  }
};
