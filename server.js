const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const SESSION_COOKIE = "dq_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 2;
const SESSION_REMEMBER_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const sessions = new Map();
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 1000 * 60 * 15;
const LOGIN_LOCK_MS = 1000 * 60 * 15;
const LOGIN_MAX_ATTEMPTS = 5;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function json(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...getSecurityHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";
  return cookieHeader.split(";").reduce((acc, rawPair) => {
    const pair = rawPair.trim();
    if (!pair) {
      return acc;
    }

    const idx = pair.indexOf("=");
    const key = idx > -1 ? pair.slice(0, idx).trim() : pair;
    const value = idx > -1 ? pair.slice(idx + 1).trim() : "";
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function normalizePhotoUrl(photoUrl) {
  return String(photoUrl || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+\-\s()]{7,20}$/.test(phone);
}

function isValidPhotoUrl(photoUrl) {
  if (!photoUrl) {
    return true;
  }

  if (photoUrl.length > 2_000_000) {
    return false;
  }

  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(photoUrl)) {
    return true;
  }

  try {
    const url = new URL(photoUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "no-store",
  };
}

function makeSessionCookie(token, ttlMs, persistent) {
  const isSecure = process.env.NODE_ENV === "production";
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (persistent) {
    attrs.push(`Max-Age=${Math.floor(ttlMs / 1000)}`);
  }

  if (isSecure) {
    attrs.push("Secure");
  }

  return attrs.join("; ");
}

function clearSessionCookie() {
  const attrs = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") {
    attrs.push("Secure");
  }
  return attrs.join("; ");
}

async function ensureDataFile() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await ensureJsonFile(USERS_FILE, "[]");
  await ensureJsonFile(SESSIONS_FILE, "[]");
}

async function ensureJsonFile(filepath, fallback) {
  try {
    await fsp.access(filepath);
  } catch {
    await fsp.writeFile(filepath, fallback, "utf8");
  }
}

async function readUsers() {
  const raw = await fsp.readFile(USERS_FILE, "utf8");
  const users = JSON.parse(raw);
  return Array.isArray(users) ? users : [];
}

async function writeUsers(users) {
  await fsp.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

async function loadSessions() {
  const raw = await fsp.readFile(SESSIONS_FILE, "utf8");
  const records = JSON.parse(raw);
  const now = Date.now();
  sessions.clear();

  for (const record of Array.isArray(records) ? records : []) {
    if (
      record &&
      typeof record.token === "string" &&
      typeof record.userId === "string" &&
      typeof record.expiresAt === "number" &&
      record.expiresAt > now
    ) {
      sessions.set(record.token, {
        userId: record.userId,
        expiresAt: record.expiresAt,
      });
    }
  }

  await persistSessions();
}

async function persistSessions() {
  const now = Date.now();
  const records = [];

  for (const [token, session] of sessions.entries()) {
    if (!session || session.expiresAt <= now) {
      sessions.delete(token);
      continue;
    }

    records.push({
      token,
      userId: session.userId,
      expiresAt: session.expiresAt,
    });
  }

  await fsp.writeFile(SESSIONS_FILE, JSON.stringify(records, null, 2), "utf8");
}

function getSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || user.email,
    phone: user.phone || "",
    profilePhoto: user.profilePhoto || "",
    createdAt: user.createdAt,
  };
}

async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    await persistSessions();
    return null;
  }

  return { token, ...session };
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "unknown";
}

function getAttemptKey(req, email) {
  return `${getClientIp(req)}:${normalizeEmail(email) || "*"}`;
}

function getRateLimitState(req, email) {
  const key = getAttemptKey(req, email);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current) {
    return { key, attempts: 0, blockedUntil: 0 };
  }

  if (current.blockedUntil > now) {
    return { key, ...current };
  }

  if (current.lastAttemptAt + LOGIN_WINDOW_MS <= now) {
    loginAttempts.delete(key);
    return { key, attempts: 0, blockedUntil: 0 };
  }

  return { key, ...current };
}

function recordFailedLogin(req, email) {
  const key = getAttemptKey(req, email);
  const now = Date.now();
  const current = getRateLimitState(req, email);
  const attempts = current.attempts + 1;
  const blockedUntil = attempts >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_LOCK_MS : 0;

  loginAttempts.set(key, {
    attempts,
    blockedUntil,
    lastAttemptAt: now,
  });

  return blockedUntil;
}

function clearFailedLogins(req, email) {
  loginAttempts.delete(getAttemptKey(req, email));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

async function handleRegister(req, res) {
  const body = await readJsonBody(req);
  const fullName = normalizeName(body.fullName);
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const profilePhoto = normalizePhotoUrl(body.profilePhoto);
  const password = String(body.password || "");

  if (fullName.length < 2) {
    json(res, 400, { error: "Please enter your full name." });
    return;
  }

  if (!isValidEmail(email)) {
    json(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (!isValidPhone(phone)) {
    json(res, 400, { error: "Please enter a valid phone number." });
    return;
  }

  if (!isValidPhotoUrl(profilePhoto)) {
    json(res, 400, { error: "Please enter a valid profile photo URL." });
    return;
  }

  if (password.length < 8) {
    json(res, 400, { error: "Password must be at least 8 characters long." });
    return;
  }

  const users = await readUsers();
  const exists = users.some((user) => user.email === email);
  if (exists) {
    json(res, 409, { error: "An account with this email already exists." });
    return;
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    fullName,
    email,
    phone,
    profilePhoto,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsers(users);
  json(res, 201, { message: "Account created successfully." });
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const remember = Boolean(body.remember);
  const rateLimit = getRateLimitState(req, email);

  if (rateLimit.blockedUntil > Date.now()) {
    const retryAfterSeconds = Math.ceil((rateLimit.blockedUntil - Date.now()) / 1000);
    json(
      res,
      429,
      { error: "Too many failed login attempts. Try again later." },
      { "Retry-After": String(retryAfterSeconds) }
    );
    return;
  }

  if (!isValidEmail(email) || !password) {
    json(res, 400, { error: "Email and password are required." });
    return;
  }

  const users = await readUsers();
  const user = users.find((item) => item.email === email);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    const blockedUntil = recordFailedLogin(req, email);
    const headers = blockedUntil
      ? { "Retry-After": String(Math.ceil((blockedUntil - Date.now()) / 1000)) }
      : {};
    json(res, 401, { error: "Invalid email or password." }, headers);
    return;
  }

  clearFailedLogins(req, email);
  const token = crypto.randomBytes(32).toString("hex");
  const ttlMs = remember ? SESSION_REMEMBER_TTL_MS : SESSION_TTL_MS;
  const expiresAt = Date.now() + ttlMs;

  sessions.set(token, {
    userId: user.id,
    expiresAt,
  });
  await persistSessions();

  json(
    res,
    200,
    {
      message: "Login successful.",
      user: getSafeUser(user),
    },
    { "Set-Cookie": makeSessionCookie(token, ttlMs, remember) }
  );
}

async function handleMe(req, res) {
  const session = await getSession(req);
  if (!session) {
    json(res, 401, { authenticated: false });
    return;
  }

  const users = await readUsers();
  const user = users.find((item) => item.id === session.userId);
  if (!user) {
    sessions.delete(session.token);
    json(res, 401, { authenticated: false }, { "Set-Cookie": clearSessionCookie() });
    return;
  }

  json(res, 200, { authenticated: true, user: getSafeUser(user) });
}

async function handleLogout(req, res) {
  const session = await getSession(req);
  if (session) {
    sessions.delete(session.token);
    await persistSessions();
  }

  json(res, 200, { message: "Logged out." }, { "Set-Cookie": clearSessionCookie() });
}

function toPublicPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^[/\\]+/, "");
  const resolved = path.resolve(ROOT_DIR, relativePath);
  const isInsideRoot = resolved === ROOT_DIR || resolved.startsWith(`${ROOT_DIR}${path.sep}`);

  if (!isInsideRoot) {
    return null;
  }

  return resolved;
}

function sendFile(res, filepath) {
  fs.stat(filepath, (err, stat) => {
    if (err || !stat.isFile()) {
      json(res, 404, { error: "Not found." });
      return;
    }

    const ext = path.extname(filepath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      ...getSecurityHeaders(),
      "Content-Type": contentType,
    });
    fs.createReadStream(filepath).pipe(res);
  });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/api/auth/register") {
    await handleRegister(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    await handleLogin(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/api/auth/me") {
    await handleMe(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    await handleLogout(req, res);
    return;
  }

  if (req.method === "GET") {
    const filepath = toPublicPath(pathname);
    if (!filepath) {
      json(res, 403, { error: "Forbidden." });
      return;
    }
    sendFile(res, filepath);
    return;
  }

  json(res, 405, { error: "Method not allowed." });
}

async function bootstrap() {
  await ensureDataFile();
  await loadSessions();

  const server = http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (error) {
      json(res, 500, { error: "Internal server error." });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
  });
}

bootstrap();
