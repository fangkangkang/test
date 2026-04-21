const crypto = require("crypto");

const SESSION_COOKIE = "northline_session";

function createState() {
  return {
    users: new Map(),
    sessions: new Map()
  };
}

const state = globalThis.__NORTHLINE_AUTH__ || createState();
globalThis.__NORTHLINE_AUTH__ = state;

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("请求体不是合法的 JSON。"));
      }
    });

    req.on("error", reject);
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, hashedPassword) {
  const [salt, savedHash] = hashedPassword.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(savedHash, "hex"));
}

function sanitizeUser(user) {
  return {
    name: user.name,
    email: user.email
  };
}

function parseCookies(req) {
  const header = req.headers.cookie || "";

  return header.split(";").reduce((all, part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name) return all;
    all[name] = decodeURIComponent(rest.join("="));
    return all;
  }, {});
}

function createSession(userEmail) {
  const token = crypto.randomBytes(24).toString("hex");
  state.sessions.set(token, userEmail);
  return token;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const userEmail = state.sessions.get(token);
  if (!userEmail) {
    return null;
  }

  return state.users.get(userEmail) || null;
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

module.exports = {
  state,
  json,
  readBody,
  validateEmail,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  createSession,
  getSessionUser,
  setSessionCookie,
  clearSessionCookie,
  parseCookies
};
