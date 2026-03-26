const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const SUPABASE_URL = process.env.SUPABASE_URL || "https://umflohaswnlwzrqbzmxs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const GOOGLE_PLACES_PLACE_ID = process.env.GOOGLE_PLACES_PLACE_ID || "";
const GOOGLE_PLACES_TEXT_QUERY = process.env.GOOGLE_PLACES_TEXT_QUERY || "DigitQuo";
const GOOGLE_REVIEW_LINK = process.env.GOOGLE_REVIEW_LINK || "https://g.page/r/CWOrOQD44wreEAE/review";
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
const PLAN_CATALOG = {
  basic: {
    name: "The Starter",
    amount: 12999,
  },
  business: {
    name: "The Professional",
    amount: 14599,
  },
  professional: {
    name: "Professional Plus",
    amount: 16999,
  },
  ecommerce: {
    name: "Enterprise",
    amount: 39999,
  },
  "advanced-ecommerce": {
    name: "Enterprise Plus",
    amount: 49999,
  },
};

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

function isValidRole(role) {
  return role === "admin" || role === "customer";
}

function isValidSubscriptionPlan(plan) {
  return ["free", "basic", "business", "professional"].includes(plan);
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
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

function getAccessToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : "";
}

function hasSupabaseAdminConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function hasRazorpayConfig() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

async function supabaseFetch(pathname, options = {}) {
  if (!hasSupabaseAdminConfig()) {
    throw new Error("Supabase admin backend is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.msg || data.message || data.error_description || data.error)) ||
      "Supabase request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function getSupabaseUser(accessToken) {
  if (!accessToken) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function requireAuthenticatedProfile(req, res) {
  if (!hasSupabaseAdminConfig()) {
    json(res, 500, {
      error: "Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    });
    return null;
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    json(res, 401, { error: "Missing session token." });
    return null;
  }

  const user = await getSupabaseUser(accessToken);
  if (!user || !user.id) {
    json(res, 401, { error: "Invalid or expired session." });
    return null;
  }

  const profiles = await supabaseFetch(
    `/rest/v1/profiles?select=id,email,full_name,phone,country,role,is_active,suspension_reason&id=eq.${encodeURIComponent(user.id)}&limit=1`
  );
  const profile = Array.isArray(profiles) ? profiles[0] : null;

  if (!profile || profile.is_active === false) {
    const suspensionReason = String(profile?.suspension_reason || "").trim();
    json(res, 403, {
      error: suspensionReason ? `You are suspended. ${suspensionReason}` : "You are suspended.",
    });
    return null;
  }

  return { user, profile, accessToken };
}

async function requireAdminAccess(req, res) {
  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return null;
  }

  if (authContext.profile.role !== "admin") {
    json(res, 403, { error: "Admin access required." });
    return null;
  }

  return authContext;
}

function getPlanConfig(planKey) {
  return PLAN_CATALOG[String(planKey || "").trim()] || null;
}

function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase();
}

function getCouponDiscountType(coupon) {
  return String(coupon?.discount_type || "").trim().toLowerCase() === "fixed" ? "fixed" : "percentage";
}

function getCouponDiscountValue(coupon) {
  const discountType = getCouponDiscountType(coupon);
  const rawValue =
    discountType === "fixed"
      ? coupon?.discount_value
      : coupon?.discount_value ?? coupon?.discount_percentage;
  const value = Number(rawValue || 0);
  return Number.isFinite(value) ? value : 0;
}

function getCouponValidationError(coupon) {
  if (!coupon) {
    return "Coupon code is invalid.";
  }

  if (coupon.is_active === false) {
    return "Coupon code is inactive.";
  }

  if (coupon.expiry_date) {
    const expiryDate = new Date(coupon.expiry_date);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
      return "Coupon code has expired.";
    }
  }

  if (coupon.max_uses && Number(coupon.current_uses || 0) >= Number(coupon.max_uses)) {
    return "Coupon code usage limit has been reached.";
  }

  const discountValue = getCouponDiscountValue(coupon);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return "Coupon code has an invalid discount value.";
  }

  if (getCouponDiscountType(coupon) === "percentage" && discountValue > 100) {
    return "Coupon percentage cannot exceed 100.";
  }

  return "";
}

function calculateCouponDiscount(amount, coupon) {
  const baseAmount = Number(amount || 0);
  if (!coupon || !Number.isFinite(baseAmount) || baseAmount <= 0) {
    return 0;
  }

  const discountValue = getCouponDiscountValue(coupon);
  let discountAmount =
    getCouponDiscountType(coupon) === "fixed"
      ? discountValue
      : (baseAmount * discountValue) / 100;

  if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
    return 0;
  }

  discountAmount = Math.min(baseAmount, discountAmount);
  return Math.round(discountAmount * 100) / 100;
}

function getPlanPricing(plan, coupon, options = {}) {
  const planAmount = Number((plan?.amount ?? plan?.subtotal) || 0);
  const fastDeliveryFee = options.fastDelivery ? Math.round(planAmount * 0.1 * 100) / 100 : 0;
  const baseAmount = Math.round((planAmount + fastDeliveryFee) * 100) / 100;
  const discountAmount = calculateCouponDiscount(baseAmount, coupon);
  const finalAmount = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);

  return {
    planAmount,
    fastDeliveryFee,
    baseAmount,
    discountAmount,
    finalAmount,
  };
}

async function findCouponByCode(couponCode) {
  const normalizedCode = normalizeCouponCode(couponCode);
  if (!normalizedCode) {
    return null;
  }

  const coupons = await supabaseFetch(
    `/rest/v1/coupons?select=*&coupon_code=eq.${encodeURIComponent(normalizedCode)}&limit=1`
  );

  return Array.isArray(coupons) ? coupons[0] || null : null;
}

async function razorpayFetch(pathname, options = {}) {
  if (!hasRazorpayConfig()) {
    throw new Error("Razorpay is not configured on the server.");
  }

  const authToken = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com${pathname}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.description || data.error?.description || data.message)) ||
      "Razorpay request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

function hasGooglePlacesConfig() {
  return Boolean(GOOGLE_PLACES_API_KEY);
}

async function googlePlacesFetch(url, options = {}) {
  if (!hasGooglePlacesConfig()) {
    throw new Error("Google Places is not configured on the server.");
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.error?.message || data.message || data.error)) ||
      "Google Places request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function resolveGooglePlaceId() {
  if (GOOGLE_PLACES_PLACE_ID) {
    return GOOGLE_PLACES_PLACE_ID;
  }

  const data = await googlePlacesFetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "X-Goog-FieldMask": "places.id,places.displayName,places.googleMapsUri",
    },
    body: {
      textQuery: GOOGLE_PLACES_TEXT_QUERY,
      maxResultCount: 1,
    },
  });

  const place = Array.isArray(data?.places) ? data.places[0] : null;
  if (!place?.id) {
    throw new Error("Could not resolve the Google place. Set GOOGLE_PLACES_PLACE_ID on the server.");
  }

  return place.id;
}

function normalizeGoogleReview(review, index = 0) {
  return {
    id: String(review?.name || `google-review-${index + 1}`),
    authorName: String(review?.authorAttribution?.displayName || "Google user").trim(),
    authorPhotoUri: String(review?.authorAttribution?.photoUri || "").trim(),
    authorUri: String(review?.authorAttribution?.uri || "").trim(),
    rating: Number(review?.rating || 0),
    relativeTime: String(review?.relativePublishTimeDescription || "").trim(),
    text: String(review?.originalText?.text || review?.text?.text || "").trim(),
    googleMapsUri: String(review?.googleMapsUri || "").trim(),
    publishTime: String(review?.publishTime || "").trim(),
  };
}

async function fetchGoogleReviewsPayload() {
  const placeId = await resolveGooglePlaceId();
  const place = await googlePlacesFetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
    },
  });

  const reviews = Array.isArray(place?.reviews)
    ? place.reviews
        .map((review, index) => normalizeGoogleReview(review, index))
        .filter((review) => review.text || review.rating > 0)
    : [];

  return {
    placeId,
    placeName: String(place?.displayName?.text || GOOGLE_PLACES_TEXT_QUERY).trim(),
    rating: Number(place?.rating || 0),
    userRatingCount: Number(place?.userRatingCount || 0),
    googleMapsUri: String(place?.googleMapsUri || GOOGLE_REVIEW_LINK).trim(),
    reviewLink: GOOGLE_REVIEW_LINK,
    reviews,
  };
}

async function handleGoogleReviews(req, res) {
  if (!hasGooglePlacesConfig()) {
    json(
      res,
      503,
      {
        error: "Google Places is not configured on the server. Add GOOGLE_PLACES_API_KEY and optionally GOOGLE_PLACES_PLACE_ID.",
        reviewLink: GOOGLE_REVIEW_LINK,
        reviews: [],
      },
      { "Cache-Control": "public, max-age=300" }
    );
    return;
  }

  try {
    const payload = await fetchGoogleReviewsPayload();
    json(res, 200, payload, { "Cache-Control": "public, max-age=300" });
  } catch (error) {
    json(
      res,
      error.status || 502,
      {
        error: error.message || "Could not load Google reviews.",
        reviewLink: GOOGLE_REVIEW_LINK,
        reviews: [],
      },
      { "Cache-Control": "public, max-age=120" }
    );
  }
}

function buildRazorpayReceipt(orderId) {
  return String(orderId || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 40);
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

async function handleAdminCreateUser(req, res) {
  const adminContext = await requireAdminAccess(req, res);
  if (!adminContext) {
    return;
  }

  const body = await readJsonBody(req);
  const fullName = normalizeName(body.fullName);
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const country = String(body.country || "").trim();
  const password = String(body.password || "");
  const role = String(body.role || "customer").trim().toLowerCase();
  const subscriptionPlan = String(body.subscriptionPlan || "free").trim().toLowerCase();

  if (fullName.length < 2) {
    json(res, 400, { error: "Please enter a valid full name." });
    return;
  }

  if (!isValidEmail(email)) {
    json(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (phone && !isValidPhone(phone)) {
    json(res, 400, { error: "Please enter a valid phone number." });
    return;
  }

  if (country.length < 2) {
    json(res, 400, { error: "Please enter your country." });
    return;
  }

  if (!isValidPassword(password)) {
    json(res, 400, { error: "Password must be at least 8 characters long." });
    return;
  }

  if (!isValidRole(role)) {
    json(res, 400, { error: "Invalid user role." });
    return;
  }

  if (!isValidSubscriptionPlan(subscriptionPlan)) {
    json(res, 400, { error: "Invalid subscription plan." });
    return;
  }

  try {
    const createdUser = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: {
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
          country,
        },
      },
    });

    await supabaseFetch("/rest/v1/profiles", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: {
        id: createdUser.id,
        email,
        full_name: fullName,
        phone,
        country,
        role,
        subscription_plan: subscriptionPlan,
        is_active: true,
      },
    });

    json(res, 201, {
      message: "User created successfully.",
      user: {
        id: createdUser.id,
        email,
        full_name: fullName,
        phone,
        country,
        role,
        subscription_plan: subscriptionPlan,
        is_active: true,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    json(res, status, {
      error: error.message || "Could not create user.",
    });
  }
}

async function handleAdminUpdateUserStatus(req, res, userId) {
  const adminContext = await requireAdminAccess(req, res);
  if (!adminContext) {
    return;
  }

  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    json(res, 400, { error: "User ID is required." });
    return;
  }

  const body = await readJsonBody(req);
  if (typeof body.isActive !== "boolean") {
    json(res, 400, { error: "isActive must be a boolean value." });
    return;
  }

  const suspensionReason = String(body.suspensionReason || "").trim();
  if (!body.isActive && !suspensionReason) {
    json(res, 400, { error: "Suspension reason is required." });
    return;
  }

  if (normalizedUserId === adminContext.user.id && body.isActive === false) {
    json(res, 400, { error: "You cannot suspend your own admin account." });
    return;
  }

  try {
    const updatedProfiles = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(normalizedUserId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        is_active: body.isActive,
        suspension_reason: body.isActive ? null : suspensionReason,
      },
    });

    const updatedProfile = Array.isArray(updatedProfiles) ? updatedProfiles[0] : null;
    if (!updatedProfile) {
      json(res, 404, { error: "User not found." });
      return;
    }

    json(res, 200, {
      message: `User ${body.isActive ? "unsuspended" : "suspended"} successfully.`,
      user: updatedProfile,
    });
  } catch (error) {
    const status = error.status || 500;
    json(res, status, {
      error: error.message || "Could not update user status.",
    });
  }
}

async function handleCreateRazorpayOrder(req, res) {
  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  if (!hasRazorpayConfig()) {
    json(res, 500, {
      error: "Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const planKey = String(body.planKey || "").trim();
  const plan = getPlanConfig(planKey);
  const customerName = normalizeName(body.customerName);
  const customerEmail = normalizeEmail(body.customerEmail || authContext.profile.email || authContext.user.email);
  const customerPhone = normalizePhone(body.customerPhone);
  const projectName = normalizeName(body.projectName);
  const ideaSummary = normalizeName(body.ideaSummary);
  const requirements = body.requirements && typeof body.requirements === "object" ? body.requirements : {};
  const fastDelivery = body.fastDelivery === true;
  const couponCode = normalizeCouponCode(body.couponCode);

  if (!plan) {
    json(res, 400, { error: "Invalid plan selected." });
    return;
  }

  if (customerName.length < 2) {
    json(res, 400, { error: "Please enter a valid full name." });
    return;
  }

  if (!isValidEmail(customerEmail)) {
    json(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (!isValidPhone(customerPhone)) {
    json(res, 400, { error: "Please enter a valid phone number." });
    return;
  }

  try {
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await findCouponByCode(couponCode);
      const couponValidationError = getCouponValidationError(appliedCoupon);
      if (couponValidationError) {
        json(res, 400, { error: couponValidationError });
        return;
      }

    }

    const pricing = getPlanPricing(plan, appliedCoupon, { fastDelivery });
    if (pricing.finalAmount <= 0) {
      json(res, 400, { error: "Coupon discount cannot reduce the payable amount to zero." });
      return;
    }

    await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(authContext.user.id)}`, {
      method: "PATCH",
      body: {
        full_name: customerName,
        phone: customerPhone,
      },
    });

    const createdProjects = await supabaseFetch("/rest/v1/projects", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        user_id: authContext.user.id,
        project_name: (projectName || ideaSummary || `${plan.name} Project`).slice(0, 120),
        template_id: planKey,
        site_config: {
          source: "plan_requirements_form",
          submitted_at: new Date().toISOString(),
          contact: {
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          plan: {
            key: planKey,
            name: plan.name,
            price: pricing.baseAmount,
            base_price: pricing.planAmount,
            fast_delivery: fastDelivery,
            fast_delivery_fee: pricing.fastDeliveryFee,
            coupon_code: appliedCoupon?.coupon_code || null,
            discount_amount: pricing.discountAmount,
            final_price: pricing.finalAmount,
          },
          summary: {
            project_name: projectName,
            idea: ideaSummary || `${plan.name} Requirement`,
          },
          requirements,
        },
        is_active: false,
      },
    });

    const createdProject = Array.isArray(createdProjects) ? createdProjects[0] : null;
    if (!createdProject?.id) {
      throw new Error("Could not create project.");
    }

    const createdOrders = await supabaseFetch("/rest/v1/orders", {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        user_id: authContext.user.id,
        project_id: createdProject.id,
        amount: pricing.baseAmount,
        coupon_id: appliedCoupon?.id || null,
        discount_amount: pricing.discountAmount,
        final_amount: pricing.finalAmount,
        payment_status: "unpaid",
        status: "pending",
      },
    });

    const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : null;
    if (!createdOrder?.id) {
      throw new Error("Could not create order.");
    }

    try {
      const razorpayOrder = await razorpayFetch("/v1/orders", {
        method: "POST",
        body: {
          amount: Math.round(pricing.finalAmount * 100),
          currency: "INR",
          receipt: buildRazorpayReceipt(createdOrder.id),
          notes: {
            site_order_id: createdOrder.id,
            project_id: createdProject.id,
            plan_key: planKey,
            customer_name: customerName,
            customer_email: customerEmail,
            fast_delivery: fastDelivery ? "yes" : "no",
            coupon_code: appliedCoupon?.coupon_code || "",
          },
        },
      });

      json(res, 201, {
        siteOrderId: createdOrder.id,
        projectId: createdProject.id,
        planKey,
        planName: plan.name,
        razorpayKeyId: RAZORPAY_KEY_ID,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || "INR",
        },
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        pricing: {
          amount: pricing.baseAmount,
          baseAmount: pricing.planAmount,
          fastDeliveryFee: pricing.fastDeliveryFee,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
        },
        coupon: appliedCoupon
          ? {
              code: appliedCoupon.coupon_code,
              discountType: getCouponDiscountType(appliedCoupon),
              discountValue: getCouponDiscountValue(appliedCoupon),
            }
          : null,
      });
    } catch (razorpayError) {
      try {
        await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(createdOrder.id)}`, {
          method: "PATCH",
          body: {
            status: "failed",
          },
        });
      } catch {}

      throw razorpayError;
    }
  } catch (error) {
    const status = error.status || 500;
    json(res, status, {
      error: error.message || "Could not create payment order.",
    });
  }
}

async function handleVerifyRazorpayPayment(req, res) {
  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  if (!hasRazorpayConfig()) {
    json(res, 500, {
      error: "Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return;
  }

  const body = await readJsonBody(req);
  const siteOrderId = String(body.siteOrderId || "").trim();
  const razorpayOrderId = String(body.razorpayOrderId || "").trim();
  const razorpayPaymentId = String(body.razorpayPaymentId || "").trim();
  const razorpaySignature = String(body.razorpaySignature || "").trim();

  if (!siteOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    json(res, 400, { error: "Missing payment verification details." });
    return;
  }

  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    json(res, 400, { error: "Payment signature verification failed." });
    return;
  }

  try {
    const orders = await supabaseFetch(
      `/rest/v1/orders?select=id,user_id,project_id,coupon_id,payment_status,status,final_amount&id=eq.${encodeURIComponent(siteOrderId)}&user_id=eq.${encodeURIComponent(authContext.user.id)}&limit=1`
    );
    const order = Array.isArray(orders) ? orders[0] : null;

    if (!order) {
      json(res, 404, { error: "Order not found." });
      return;
    }

    if (order.payment_status === "paid") {
      json(res, 200, {
        message: "Payment already verified.",
        orderId: order.id,
      });
      return;
    }

    const payment = await razorpayFetch(`/v1/payments/${encodeURIComponent(razorpayPaymentId)}`);
    if (
      !payment ||
      payment.order_id !== razorpayOrderId ||
      !["authorized", "captured"].includes(String(payment.status || "").toLowerCase())
    ) {
      json(res, 400, { error: "Razorpay payment could not be confirmed." });
      return;
    }

    const updatedOrders = await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: {
        payment_status: "paid",
        status: order.status === "failed" ? "pending" : order.status || "pending",
        stripe_payment_id: razorpayPaymentId,
      },
    });

    const updatedOrder = Array.isArray(updatedOrders) ? updatedOrders[0] : null;

    if (order.coupon_id) {
      try {
        const coupons = await supabaseFetch(
          `/rest/v1/coupons?select=id,current_uses&id=eq.${encodeURIComponent(order.coupon_id)}&limit=1`
        );
        const coupon = Array.isArray(coupons) ? coupons[0] : null;
        if (coupon?.id) {
          await supabaseFetch(`/rest/v1/coupons?id=eq.${encodeURIComponent(coupon.id)}`, {
            method: "PATCH",
            body: {
              current_uses: Number(coupon.current_uses || 0) + 1,
            },
          });
        }
      } catch (couponUsageError) {
        console.error("Could not update coupon usage:", couponUsageError);
      }
    }

    if (order.project_id) {
      await supabaseFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(order.project_id)}`, {
        method: "PATCH",
        body: {
          is_active: true,
        },
      });
    }

    json(res, 200, {
      message: "Payment verified successfully.",
      order: updatedOrder || {
        id: order.id,
        payment_status: "paid",
      },
    });
  } catch (error) {
    const status = error.status || 500;
    json(res, status, {
      error: error.message || "Could not verify payment.",
    });
  }
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
  const adminUserStatusMatch = /^\/api\/admin\/users\/([^/]+)\/status$/.exec(pathname);

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

  if (req.method === "POST" && pathname === "/api/admin/users") {
    await handleAdminCreateUser(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/payments/razorpay/create-order") {
    await handleCreateRazorpayOrder(req, res);
    return;
  }

  if (req.method === "POST" && pathname === "/api/payments/razorpay/verify") {
    await handleVerifyRazorpayPayment(req, res);
    return;
  }

  if (req.method === "PATCH" && adminUserStatusMatch) {
    await handleAdminUpdateUserStatus(req, res, adminUserStatusMatch[1]);
    return;
  }

  if (req.method === "GET" && pathname === "/api/google-reviews") {
    await handleGoogleReviews(req, res);
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
