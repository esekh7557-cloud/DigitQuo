const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadDotEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      return;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}
loadDotEnvFile(path.join(process.cwd(), ".env"));

const SUPABASE_URL = process.env.SUPABASE_URL || "https://umflohaswnlwzrqbzmxs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const APP_BASE_URL = process.env.APP_BASE_URL || "";
const APIRONE_API_BASE = "https://apirone.com/api/v2";
const FRANKFURTER_API_BASE = "https://api.frankfurter.dev/v2";
const APIRONE_WEBHOOK_SECRET = process.env.APIRONE_WEBHOOK_SECRET || "";
const APIRONE_BTC_WALLET_ID = process.env.APIRONE_BTC_WALLET_ID || "";
const APIRONE_LTC_WALLET_ID = process.env.APIRONE_LTC_WALLET_ID || "";
const APIRONE_DOGE_WALLET_ID = process.env.APIRONE_DOGE_WALLET_ID || "";
const APIRONE_BCH_WALLET_ID = process.env.APIRONE_BCH_WALLET_ID || "";
const APIRONE_TRX_WALLET_ID = process.env.APIRONE_TRX_WALLET_ID || "";
const APIRONE_ETH_WALLET_ID = process.env.APIRONE_ETH_WALLET_ID || "";
const APIRONE_BNB_WALLET_ID = process.env.APIRONE_BNB_WALLET_ID || "";
const APIRONE_TBTC_WALLET_ID = process.env.APIRONE_TBTC_WALLET_ID || "";

const PLAN_CATALOG = {
  basic: {
    name: "The Starter",
    amount: 8999,
    usdAmount: 99,
    addOns: [
      { id: "hosting", name: "Hosting", amount: 4000, kind: "hosting" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  business: {
    name: "The Professional",
    amount: 10599,
    usdAmount: 119,
    addOns: [
      { id: "hosting", name: "Hosting", amount: 4000, kind: "hosting" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  professional: {
    name: "Professional Plus",
    amount: 12999,
    usdAmount: 139,
    addOns: [
      { id: "hosting", name: "Hosting", amount: 4000, kind: "hosting" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  ecommerce: {
    name: "Enterprise",
    amount: 22999,
    usdAmount: 249,
    addOns: [
      { id: "vps-hosting", name: "VPS Hosting", amount: 17000, kind: "hosting" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  "advanced-ecommerce": {
    name: "Enterprise Plus",
    amount: 32999,
    usdAmount: 349,
    addOns: [
      { id: "vps-hosting", name: "VPS Hosting", amount: 17000, kind: "hosting" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  "bot-basic": {
    name: "Basic Bot",
    amount: 699,
    usdAmount: 6.99,
    addOns: [
      { id: "bot-hosting-basic", name: "Bot Hosting Setup", amount: 199, kind: "hosting" },
      { id: "bot-maintenance-starter", name: "Starter Maintenance Setup", amount: 299, kind: "maintenance" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  "bot-standard": {
    name: "Community Bot",
    amount: 1899,
    usdAmount: 19,
    addOns: [
      { id: "bot-hosting-premium", name: "Premium Bot Hosting Setup", amount: 499, kind: "hosting" },
      { id: "bot-feature-updates", name: "Feature Update Retainer", amount: 599, kind: "maintenance" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  "bot-premium": {
    name: "Professional Custom Bot",
    amount: 5499,
    usdAmount: 59,
    addOns: [
      { id: "bot-hosting-performance", name: "High-Performance Hosting Setup", amount: 999, kind: "hosting" },
      { id: "bot-priority-support", name: "Priority Support Retainer", amount: 999, kind: "maintenance" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
  "bot-enterprise": {
    name: "Enterprise Bot",
    amount: 9999,
    usdAmount: 99,
    addOns: [
      { id: "bot-hosting-enterprise", name: "Enterprise Hosting Setup", amount: 1499, kind: "hosting" },
      { id: "bot-enterprise-support", name: "Enterprise Support Retainer", amount: 1499, kind: "maintenance" },
      { id: "connect-bot-website", name: "Connect Bot with Website", amount: 1999, kind: "integration" },
    ],
  },
};

function sendJson(res, status, payload) {
  res.status(status).json(payload);
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+\-\s()]{7,20}$/.test(phone);
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

function getJsonBody(req) {
  if (!req || typeof req.body === "undefined" || req.body === null) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new Error("Invalid JSON body.");
    }
  }

  if (typeof req.body === "object") {
    return req.body;
  }

  return {};
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

function hasAppBaseUrl() {
  return Boolean(APP_BASE_URL);
}

function hasApironeWebhookSecret() {
  return Boolean(APIRONE_WEBHOOK_SECRET);
}

function getCryptoWalletId(currency) {
  switch (String(currency || "").trim().toLowerCase()) {
    case "btc":
      return APIRONE_BTC_WALLET_ID;
    case "ltc":
      return APIRONE_LTC_WALLET_ID;
    case "doge":
      return APIRONE_DOGE_WALLET_ID;
    case "bch":
      return APIRONE_BCH_WALLET_ID;
    case "trx":
      return APIRONE_TRX_WALLET_ID;
    case "eth":
      return APIRONE_ETH_WALLET_ID;
    case "bnb":
      return APIRONE_BNB_WALLET_ID;
    case "tbtc":
      return APIRONE_TBTC_WALLET_ID;
    default:
      return "";
  }
}

function getCryptoConfirmationRequirement(currency) {
  switch (String(currency || "").trim().toLowerCase()) {
    case "btc":
      return 1;
    case "ltc":
      return 3;
    case "doge":
      return 6;
    case "bch":
      return 1;
    case "trx":
      return 1;
    case "eth":
    case "bnb":
      return 12;
    case "tbtc":
      return 1;
    default:
      return 1;
  }
}

function getCryptoCurrencyLabel(currency) {
  switch (String(currency || "").trim().toLowerCase()) {
    case "btc":
      return "Bitcoin";
    case "ltc":
      return "Litecoin";
    case "doge":
      return "Dogecoin";
    case "bch":
      return "Bitcoin Cash";
    case "trx":
      return "Tron";
    case "eth":
      return "Ethereum";
    case "bnb":
      return "BNB Smart Chain";
    case "tbtc":
      return "Bitcoin Testnet";
    default:
      return String(currency || "").toUpperCase();
  }
}

function getCryptoUriScheme(currency) {
  switch (String(currency || "").trim().toLowerCase()) {
    case "btc":
      return "bitcoin";
    case "ltc":
      return "litecoin";
    case "doge":
      return "dogecoin";
    case "bch":
      return "bitcoincash";
    case "trx":
      return "tron";
    case "eth":
    case "bnb":
      return "ethereum";
    case "tbtc":
      return "bitcoin";
    default:
      return String(currency || "").toLowerCase();
  }
}

function getCryptoMinorUnitDecimals(currency) {
  switch (String(currency || "").trim().toLowerCase()) {
    case "trx":
      return 6;
    case "eth":
    case "bnb":
      return 18;
    case "btc":
    case "ltc":
    case "doge":
    case "bch":
    case "tbtc":
    default:
      return 8;
  }
}

function formatCryptoDecimalFromMinorUnits(value, decimals) {
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, decimals) : 8;
  const raw = String(value || "0").trim();
  const negative = raw.startsWith("-");
  const digitsOnly = raw.replace(/[^\d]/g, "") || "0";

  if (safeDecimals === 0) {
    return `${negative ? "-" : ""}${digitsOnly}`;
  }

  const padded = digitsOnly.padStart(safeDecimals + 1, "0");
  const integerPart = padded.slice(0, -safeDecimals) || "0";
  const decimalPart = padded.slice(-safeDecimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${integerPart}${decimalPart ? `.${decimalPart}` : ""}`;
}

function convertDecimalAmountToMinorUnits(amount, decimals) {
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, decimals) : 8;
  const normalized = String(amount || "0").trim();

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount for conversion.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const fractionPadded = `${fraction}${"0".repeat(safeDecimals)}`.slice(0, safeDecimals);
  const combined = `${whole}${fractionPadded}`.replace(/^0+(?=\d)/, "");
  return combined || "0";
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
    sendJson(res, 500, {
      error: "Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    });
    return null;
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    sendJson(res, 401, { error: "Missing session token." });
    return null;
  }

  const user = await getSupabaseUser(accessToken);
  if (!user || !user.id) {
    sendJson(res, 401, { error: "Invalid or expired session." });
    return null;
  }

  let profiles = await supabaseFetch(
    `/rest/v1/profiles?select=id,email,full_name,phone,role,is_active,suspension_reason&id=eq.${encodeURIComponent(user.id)}&limit=1`
  );
  let profile = Array.isArray(profiles) ? profiles[0] : null;

  if (!profile) {
    const metadata = user.user_metadata || {};
    profiles = await supabaseFetch("/rest/v1/profiles?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: {
        id: user.id,
        email: user.email,
        full_name: metadata.full_name || metadata.fullName || "",
        phone: metadata.phone || "",
        country: metadata.country || metadata.address || "",
        profile_photo: metadata.profile_photo || metadata.profilePhoto || "",
        role: "customer",
        is_active: true,
      },
    });
    profile = Array.isArray(profiles) ? profiles[0] : null;

    if (!profile) {
      profiles = await supabaseFetch(
        `/rest/v1/profiles?select=id,email,full_name,phone,role,is_active,suspension_reason&id=eq.${encodeURIComponent(user.id)}&limit=1`
      );
      profile = Array.isArray(profiles) ? profiles[0] : null;
    }
  }

  if (!profile) {
    sendJson(res, 403, { error: "Your account profile could not be loaded." });
    return null;
  }

  if (profile.is_active === false) {
    const suspensionReason = String(profile?.suspension_reason || "").trim();
    sendJson(res, 403, {
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
    sendJson(res, 403, { error: "Admin access required." });
    return null;
  }

  return authContext;
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

async function apironeFetch(pathname, options = {}) {
  const response = await fetch(`${APIRONE_API_BASE}${pathname}`, {
    method: options.method || "GET",
    headers: {
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
      (data && typeof data === "object" && (data.description || data.error || data.message)) ||
      "Apirone request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

async function frankfurterFetch(pathname) {
  const response = await fetch(`${FRANKFURTER_API_BASE}${pathname}`, {
    headers: {
      Accept: "application/json",
    },
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
      (data && typeof data === "object" && (data.message || data.error)) ||
      "Exchange rate request failed.";
    const error = new Error(message);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
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

function createCryptoWebhookSignature(orderId, projectId, currency, nonce) {
  return crypto
    .createHmac("sha256", APIRONE_WEBHOOK_SECRET)
    .update(`${orderId}|${projectId}|${currency}|${nonce}`)
    .digest("hex");
}

function verifyCryptoWebhookPayload(data = {}) {
  if (!hasApironeWebhookSecret()) {
    return false;
  }

  const orderId = String(data.order_id || "").trim();
  const projectId = String(data.project_id || "").trim();
  const currency = String(data.currency || "").trim().toLowerCase();
  const nonce = String(data.nonce || "").trim();
  const signature = String(data.signature || "").trim().toLowerCase();

  if (!orderId || !projectId || !currency || !nonce || !signature) {
    return false;
  }

  const expected = createCryptoWebhookSignature(orderId, projectId, currency, nonce);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function buildApironeCallbackUrl() {
  const baseUrl = String(APP_BASE_URL || "").trim().replace(/\/+$/, "");
  return baseUrl ? `${baseUrl}/api/crypto/webhook` : "";
}

async function getCryptoQuoteInInr(currency, inrAmount) {
  const normalizedCurrency = String(currency || "").trim().toLowerCase();
  const amountValue = Number(inrAmount || 0);
  if (!normalizedCurrency || !Number.isFinite(amountValue) || amountValue <= 0) {
    throw new Error("Invalid crypto quote request.");
  }

  const ticker = await apironeFetch(`/ticker?currency=${encodeURIComponent(normalizedCurrency)}&fiat=inr`);
  const inrPerCoin = Number(ticker?.inr);
  if (!Number.isFinite(inrPerCoin) || inrPerCoin <= 0) {
    throw new Error("Could not fetch the current crypto exchange rate.");
  }

  const decimals = getCryptoMinorUnitDecimals(normalizedCurrency);
  const cryptoAmountDecimal = (amountValue / inrPerCoin).toFixed(decimals);
  const cryptoAmountMinor = convertDecimalAmountToMinorUnits(cryptoAmountDecimal, decimals);

  return {
    inrPerCoin,
    decimals,
    cryptoAmountDecimal,
    cryptoAmountMinor,
  };
}

async function getSupportedCryptoRatesInInr() {
  const currencies = ["btc", "ltc", "doge", "bch", "trx", "eth", "bnb"];
  const results = await Promise.allSettled(
    currencies.map(async (currency) => {
      const ticker = await apironeFetch(`/ticker?currency=${encodeURIComponent(currency)}&fiat=inr`);
      const rate = Number(ticker?.inr);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`Could not fetch INR rate for ${currency.toUpperCase()}.`);
      }
      return [currency, rate];
    })
  );

  const successfulEntries = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  const failedCurrencies = results
    .map((result, index) => ({ result, currency: currencies[index] }))
    .filter((entry) => entry.result.status === "rejected");

  failedCurrencies.forEach((entry) => {
    console.error(`Crypto rate fetch failed for ${entry.currency.toUpperCase()}:`, entry.result.reason?.message || entry.result.reason);
  });

  if (!successfulEntries.length) {
    throw new Error("Could not fetch any crypto rates.");
  }

  return Object.fromEntries(successfulEntries);
}

async function getDisplayCurrencyRates() {
  const usdRatePayload = await frankfurterFetch("/rate/INR/USD");
  const usdRate = Number(usdRatePayload?.rate);
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    throw new Error("Could not fetch the current USD exchange rate.");
  }

  return {
    usd: usdRate,
  };
}

function getPlanConfig(planKey) {
  return PLAN_CATALOG[String(planKey || "").trim()] || null;
}

function normalizePlanAddOnIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
    )
  );
}

function getPlanAddOns(plan, addOnIds = []) {
  const catalog = Array.isArray(plan?.addOns) ? plan.addOns : [];
  const selectedIds = new Set(normalizePlanAddOnIds(addOnIds));
  return catalog.filter((addOn) => selectedIds.has(String(addOn?.id || "").trim()));
}

function arePlanAddOnIdsValid(plan, addOnIds = []) {
  const normalizedIds = normalizePlanAddOnIds(addOnIds);
  return getPlanAddOns(plan, normalizedIds).length === normalizedIds.length;
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
  const selectedAddOns = getPlanAddOns(plan, options.addOnIds);
  const addOnAmount = selectedAddOns.reduce((sum, addOn) => sum + Number(addOn?.amount || addOn?.price || 0), 0);
  const fastDeliveryFee = options.fastDelivery ? Math.round(planAmount * 0.1 * 100) / 100 : 0;
  const baseAmount = Math.round((planAmount + addOnAmount + fastDeliveryFee) * 100) / 100;
  const discountAmount = calculateCouponDiscount(baseAmount, coupon);
  const finalAmount = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);

  return {
    planAmount,
    selectedAddOns,
    addOnAmount,
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

async function incrementCouponUsageIfNeeded(couponId) {
  if (!couponId) {
    return;
  }

  try {
    const coupons = await supabaseFetch(
      `/rest/v1/coupons?select=id,current_uses&id=eq.${encodeURIComponent(couponId)}&limit=1`
    );
    const coupon = Array.isArray(coupons) ? coupons[0] : null;
    if (!coupon?.id) {
      return;
    }

    await supabaseFetch(`/rest/v1/coupons?id=eq.${encodeURIComponent(coupon.id)}`, {
      method: "PATCH",
      body: {
        current_uses: Number(coupon.current_uses || 0) + 1,
      },
    });
  } catch (couponUsageError) {
    console.error("Could not update coupon usage:", couponUsageError);
  }
}

async function handleAdminCreateUser(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const adminContext = await requireAdminAccess(req, res);
  if (!adminContext) {
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const fullName = normalizeName(body.fullName);
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const password = String(body.password || "");
  const role = String(body.role || "customer").trim().toLowerCase();
  const subscriptionPlan = String(body.subscriptionPlan || "free").trim().toLowerCase();

  if (fullName.length < 2) {
    sendJson(res, 400, { error: "Please enter a valid full name." });
    return;
  }

  if (!isValidEmail(email)) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (phone && !isValidPhone(phone)) {
    sendJson(res, 400, { error: "Please enter a valid phone number." });
    return;
  }

  if (!isValidPassword(password)) {
    sendJson(res, 400, { error: "Password must be at least 8 characters long." });
    return;
  }

  if (!isValidRole(role)) {
    sendJson(res, 400, { error: "Invalid user role." });
    return;
  }

  if (!isValidSubscriptionPlan(subscriptionPlan)) {
    sendJson(res, 400, { error: "Invalid subscription plan." });
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
        role,
        subscription_plan: subscriptionPlan,
        is_active: true,
      },
    });

    sendJson(res, 201, {
      message: "User created successfully.",
      user: {
        id: createdUser.id,
        email,
        full_name: fullName,
        phone,
        role,
        subscription_plan: subscriptionPlan,
        is_active: true,
      },
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not create user.",
    });
  }
}

async function handleAdminUpdateUserStatus(req, res, userId) {
  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const adminContext = await requireAdminAccess(req, res);
  if (!adminContext) {
    return;
  }

  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    sendJson(res, 400, { error: "User ID is required." });
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  if (typeof body.isActive !== "boolean") {
    sendJson(res, 400, { error: "isActive must be a boolean value." });
    return;
  }

  const suspensionReason = String(body.suspensionReason || "").trim();
  if (!body.isActive && !suspensionReason) {
    sendJson(res, 400, { error: "Suspension reason is required." });
    return;
  }

  if (normalizedUserId === adminContext.user.id && body.isActive === false) {
    sendJson(res, 400, { error: "You cannot suspend your own admin account." });
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
      sendJson(res, 404, { error: "User not found." });
      return;
    }

    sendJson(res, 200, {
      message: `User ${body.isActive ? "unsuspended" : "suspended"} successfully.`,
      user: updatedProfile,
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not update user status.",
    });
  }
}

async function handleCreateRazorpayOrder(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  if (!hasRazorpayConfig()) {
    sendJson(res, 500, {
      error: "Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const planKey = String(body.planKey || "").trim();
  const plan = getPlanConfig(planKey);
  const customerName = normalizeName(body.customerName);
  const customerEmail = normalizeEmail(body.customerEmail || authContext.profile.email || authContext.user.email);
  const customerPhone = normalizePhone(body.customerPhone);
  const projectName = normalizeName(body.projectName);
  const ideaSummary = normalizeName(body.ideaSummary);
  const requirements = body.requirements && typeof body.requirements === "object" ? body.requirements : {};
  const fastDelivery =
    body.fastDelivery === true || String(body.fastDelivery || "").trim().toLowerCase() === "yes";
  const couponCode = normalizeCouponCode(body.couponCode);
  const addOnIds = normalizePlanAddOnIds(body.addOnIds);

  if (!plan) {
    sendJson(res, 400, { error: "Invalid plan selected." });
    return;
  }

  if (!arePlanAddOnIdsValid(plan, addOnIds)) {
    sendJson(res, 400, { error: "Invalid add-on selected." });
    return;
  }

  if (customerName.length < 2) {
    sendJson(res, 400, { error: "Please enter a valid full name." });
    return;
  }

  if (!isValidEmail(customerEmail)) {
    sendJson(res, 400, { error: "Please enter a valid email address." });
    return;
  }

  if (!isValidPhone(customerPhone)) {
    sendJson(res, 400, { error: "Please enter a valid phone number." });
    return;
  }

  try {
    let appliedCoupon = null;

    if (couponCode) {
      appliedCoupon = await findCouponByCode(couponCode);
      const couponValidationError = getCouponValidationError(appliedCoupon);
      if (couponValidationError) {
        sendJson(res, 400, { error: couponValidationError });
        return;
      }

    }

    const pricing = getPlanPricing(plan, appliedCoupon, { fastDelivery, addOnIds });
    if (pricing.finalAmount <= 0) {
      sendJson(res, 400, { error: "Coupon discount cannot reduce the payable amount to zero." });
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
            add_ons: pricing.selectedAddOns.map((addOn) => ({
              id: addOn.id,
              name: addOn.name,
              price: Number(addOn.amount || addOn.price || 0),
            })),
            add_on_amount: pricing.addOnAmount,
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
            add_ons: pricing.selectedAddOns.map((addOn) => addOn.name).join(", "),
            plan_amount: String(pricing.planAmount),
            add_on_amount: String(pricing.addOnAmount),
            fast_delivery: fastDelivery ? "yes" : "no",
            fast_delivery_fee: String(pricing.fastDeliveryFee),
            coupon_code: appliedCoupon?.coupon_code || "",
            discount_amount: String(pricing.discountAmount),
            final_amount: String(pricing.finalAmount),
          },
        },
      });

      await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(createdOrder.id)}`, {
        method: "PATCH",
        body: {
          payment_method: "razorpay",
          payment_currency: String(razorpayOrder.currency || "INR").toUpperCase(),
          payment_reference: razorpayOrder.id,
        },
      });

      sendJson(res, 201, {
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
          planAmount: pricing.planAmount,
          selectedAddOns: pricing.selectedAddOns.map((addOn) => ({
            id: addOn.id,
            name: addOn.name,
            amount: Number(addOn.amount || addOn.price || 0),
          })),
          addOnAmount: pricing.addOnAmount,
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
    sendJson(res, error.status || 500, {
      error: error.message || "Could not create payment order.",
    });
  }
}

async function handleVerifyRazorpayPayment(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  if (!hasRazorpayConfig()) {
    sendJson(res, 500, {
      error: "Razorpay is not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const siteOrderId = String(body.siteOrderId || "").trim();
  const razorpayOrderId = String(body.razorpayOrderId || "").trim();
  const razorpayPaymentId = String(body.razorpayPaymentId || "").trim();
  const razorpaySignature = String(body.razorpaySignature || "").trim();

  if (!siteOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    sendJson(res, 400, { error: "Missing payment verification details." });
    return;
  }

  if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    sendJson(res, 400, { error: "Payment signature verification failed." });
    return;
  }

  try {
    const orders = await supabaseFetch(
      `/rest/v1/orders?select=id,user_id,project_id,coupon_id,payment_status,status,final_amount,payment_reference,payment_currency&id=eq.${encodeURIComponent(siteOrderId)}&user_id=eq.${encodeURIComponent(authContext.user.id)}&limit=1`
    );
    const order = Array.isArray(orders) ? orders[0] : null;

    if (!order) {
      sendJson(res, 404, { error: "Order not found." });
      return;
    }

    if (order.payment_status === "paid") {
      sendJson(res, 200, {
        message: "Payment already verified.",
        orderId: order.id,
      });
      return;
    }

    if (String(order.payment_reference || "").trim() !== razorpayOrderId) {
      sendJson(res, 400, { error: "Payment order reference mismatch." });
      return;
    }

    const payment = await razorpayFetch(`/v1/payments/${encodeURIComponent(razorpayPaymentId)}`);
    if (
      !payment ||
      payment.order_id !== razorpayOrderId ||
      !["authorized", "captured"].includes(String(payment.status || "").toLowerCase())
    ) {
      sendJson(res, 400, { error: "Razorpay payment could not be confirmed." });
      return;
    }

    const expectedAmountMinor = Math.round(Number(order.final_amount || 0) * 100);
    const paymentAmountMinor = Number(payment.amount || 0);
    const paymentCurrency = String(payment.currency || order.payment_currency || "INR").toUpperCase();
    const expectedCurrency = String(order.payment_currency || "INR").toUpperCase();

    if (
      !Number.isFinite(expectedAmountMinor) ||
      expectedAmountMinor <= 0 ||
      paymentAmountMinor !== expectedAmountMinor ||
      paymentCurrency !== expectedCurrency
    ) {
      sendJson(res, 400, { error: "Payment amount or currency mismatch." });
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

    await incrementCouponUsageIfNeeded(order.coupon_id);

    if (order.project_id) {
      await supabaseFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(order.project_id)}`, {
        method: "PATCH",
        body: {
          is_active: true,
        },
      });
    }

    const updatedOrder = Array.isArray(updatedOrders) ? updatedOrders[0] : null;
    sendJson(res, 200, {
      message: "Payment verified successfully.",
      order: updatedOrder || {
        id: order.id,
        payment_status: "paid",
      },
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not verify payment.",
    });
  }
}

async function handleCreateCryptoOrder(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const planKey = String(body.planKey || "").trim();
  const plan = getPlanConfig(planKey);
  const currency = String(body.cryptoCurrency || "").trim().toLowerCase();
  const walletId = getCryptoWalletId(currency);

  if (!plan) {
    sendJson(res, 400, { error: "Selected plan could not be found." });
    return;
  }

  if (!walletId) {
    sendJson(res, 400, { error: "This crypto currency is not configured yet." });
    return;
  }

  if (!hasAppBaseUrl()) {
    sendJson(res, 500, {
      error: "Crypto payments are not configured on the server. Add APP_BASE_URL and Apirone wallet IDs.",
    });
    return;
  }

  if (!hasApironeWebhookSecret()) {
    sendJson(res, 500, {
      error: "Crypto payments are not configured on the server. Add APIRONE_WEBHOOK_SECRET.",
    });
    return;
  }

  try {
    const customerName = normalizeName(body.customerName);
    const customerEmail = normalizeEmail(body.customerEmail || authContext.user.email || authContext.profile.email);
    const customerPhone = normalizePhone(body.customerPhone);
    const projectName = String(body.projectName || "").trim();
    const ideaSummary = String(body.ideaSummary || "").trim();
    const addOnIds = normalizePlanAddOnIds(body.addOnIds);
    const fastDelivery = body.fastDelivery === true || String(body.fastDelivery || "").trim().toLowerCase() === "yes";
    const requirements = body.requirements && typeof body.requirements === "object" ? body.requirements : {};

    if (customerName.length < 2) {
      throw new Error("Please enter your full name.");
    }

    if (!isValidEmail(customerEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (!isValidPhone(customerPhone)) {
      throw new Error("Please enter a valid phone number.");
    }

    if (!projectName) {
      throw new Error("Please enter your project name.");
    }

    if (!arePlanAddOnIdsValid(plan, addOnIds)) {
      throw new Error("One or more selected add-ons are invalid.");
    }

    let appliedCoupon = null;
    const couponCode = normalizeCouponCode(body.couponCode);
    if (couponCode) {
      appliedCoupon = await findCouponByCode(couponCode);
      const couponError = getCouponValidationError(appliedCoupon);
      if (couponError) {
        const error = new Error(couponError);
        error.status = 400;
        throw error;
      }
    }

    const pricing = getPlanPricing(plan, appliedCoupon, {
      addOnIds,
      fastDelivery,
    });

    if (pricing.finalAmount <= 0) {
      const error = new Error("Coupon discount cannot reduce the payable amount to zero.");
      error.status = 400;
      throw error;
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
            add_ons: pricing.selectedAddOns.map((addOn) => ({
              id: addOn.id,
              name: addOn.name,
              price: Number(addOn.amount || addOn.price || 0),
            })),
            add_on_amount: pricing.addOnAmount,
            fast_delivery: fastDelivery,
            fast_delivery_fee: pricing.fastDeliveryFee,
            coupon_code: appliedCoupon?.coupon_code || null,
            discount_amount: pricing.discountAmount,
            final_price: pricing.finalAmount,
            payment_method: "crypto",
            crypto_currency: currency,
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
        payment_method: "crypto",
        payment_currency: "INR",
        crypto_currency: currency,
        crypto_confirmation_target: getCryptoConfirmationRequirement(currency),
      },
    });

    const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : null;
    if (!createdOrder?.id) {
      throw new Error("Could not create order.");
    }

    try {
      const quote = await getCryptoQuoteInInr(currency, pricing.finalAmount);
      const paymentUriScheme = getCryptoUriScheme(currency);
      const callbackUrl = buildApironeCallbackUrl();
      const webhookNonce = crypto.randomBytes(16).toString("hex");
      const webhookSignature = createCryptoWebhookSignature(createdOrder.id, createdProject.id, currency, webhookNonce);
      const addressResult = await apironeFetch(`/wallets/${encodeURIComponent(walletId)}/addresses`, {
        method: "POST",
        body: {
          callback: {
            method: "POST",
            url: callbackUrl,
            data: {
              order_id: createdOrder.id,
              project_id: createdProject.id,
              currency,
              nonce: webhookNonce,
              signature: webhookSignature,
            },
          },
        },
      });

      const paymentAddress = String(addressResult?.address || "").trim();
      if (!paymentAddress) {
        throw new Error("Apirone did not return a payment address.");
      }

      const paymentUri = `${paymentUriScheme}:${paymentAddress}?amount=${quote.cryptoAmountDecimal}`;

      await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(createdOrder.id)}`, {
        method: "PATCH",
        body: {
          crypto_wallet_id: walletId,
          crypto_payment_address: paymentAddress,
          crypto_amount_expected: quote.cryptoAmountMinor,
          crypto_payment_uri: paymentUri,
          payment_reference: addressResult?.wallet || walletId,
        },
      });

      sendJson(res, 201, {
        siteOrderId: createdOrder.id,
        projectId: createdProject.id,
        planKey,
        planName: plan.name,
        paymentMethod: "crypto",
        paymentStatus: "pending",
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        pricing: {
          amount: pricing.baseAmount,
          baseAmount: pricing.planAmount,
          planAmount: pricing.planAmount,
          selectedAddOns: pricing.selectedAddOns.map((addOn) => ({
            id: addOn.id,
            name: addOn.name,
            amount: Number(addOn.amount || addOn.price || 0),
          })),
          addOnAmount: pricing.addOnAmount,
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
        crypto: {
          currency,
          label: getCryptoCurrencyLabel(currency),
          walletId,
          address: paymentAddress,
          amount: quote.cryptoAmountDecimal,
          amountMinor: quote.cryptoAmountMinor,
          amountInr: pricing.finalAmount,
          exchangeRateInr: quote.inrPerCoin,
          paymentUri,
          confirmationsRequired: getCryptoConfirmationRequirement(currency),
        },
      });
    } catch (apironeError) {
      try {
        await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(createdOrder.id)}`, {
          method: "PATCH",
          body: {
            status: "failed",
          },
        });
      } catch {}

      throw apironeError;
    }
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not create crypto payment order.",
    });
  }
}

async function handleGetCryptoPaymentStatus(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const authContext = await requireAuthenticatedProfile(req, res);
  if (!authContext) {
    return;
  }

  const siteOrderId = String(req.query?.siteOrderId || "").trim();
  if (!siteOrderId) {
    sendJson(res, 400, { error: "Missing siteOrderId." });
    return;
  }

  try {
    const orders = await supabaseFetch(
      `/rest/v1/orders?select=id,project_id,status,payment_status,final_amount,payment_method,payment_currency,crypto_currency,crypto_amount_expected,crypto_amount_received,crypto_payment_address,crypto_payment_uri,crypto_tx_hash,crypto_confirmations,crypto_confirmation_target,updated_at&id=eq.${encodeURIComponent(siteOrderId)}&user_id=eq.${encodeURIComponent(authContext.user.id)}&limit=1`
    );
    const order = Array.isArray(orders) ? orders[0] : null;

    if (!order) {
      sendJson(res, 404, { error: "Order not found." });
      return;
    }

    sendJson(res, 200, {
      order: {
        ...order,
        crypto_amount_expected_decimal: formatCryptoDecimalFromMinorUnits(
          order.crypto_amount_expected,
          getCryptoMinorUnitDecimals(order.crypto_currency)
        ),
        crypto_amount_received_decimal: formatCryptoDecimalFromMinorUnits(
          order.crypto_amount_received,
          getCryptoMinorUnitDecimals(order.crypto_currency)
        ),
      },
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not load crypto payment status.",
    });
  }
}

async function handleGetCryptoRates(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rates = await getSupportedCryptoRatesInInr();
    sendJson(res, 200, {
      baseCurrency: "INR",
      rates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not load crypto rates.",
    });
  }
}

async function handleGetDisplayCurrencyRates(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const rates = await getDisplayCurrencyRates();
    sendJson(res, 200, {
      baseCurrency: "INR",
      rates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.message || "Could not load display currency rates.",
    });
  }
}

async function handleCryptoWebhook(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("method not allowed");
    return;
  }

  let body;
  try {
    body = getJsonBody(req);
  } catch (error) {
    res.status(400).send("invalid");
    return;
  }

  const address = String(body.input_address || body.address || "").trim();
  const currency = String(body.currency || "").trim().toLowerCase();
  const confirmations = Number(body.confirmations ?? body.confirmation ?? 0);
  const amountMinor = String(body.value || "0").trim();
  const inputTransactionHash = String(body.input_transaction_hash || "").trim();
  const callbackData = body?.data && typeof body.data === "object" ? body.data : {};
  const orderIdFromCallback = String(callbackData.order_id || "").trim();

  if (!address || !currency || !orderIdFromCallback) {
    res.status(400).send("invalid");
    return;
  }

  if (!verifyCryptoWebhookPayload(callbackData)) {
    res.status(401).send("unauthorized");
    return;
  }

  try {
    const orders = await supabaseFetch(
      `/rest/v1/orders?select=id,project_id,coupon_id,payment_status,status,crypto_currency,crypto_payment_address,crypto_amount_expected,crypto_confirmation_target&id=eq.${encodeURIComponent(orderIdFromCallback)}&limit=1`
    );
    const order = Array.isArray(orders) ? orders[0] : null;

    if (!order) {
      throw new Error("Order not found for callback.");
    }

    if (String(order.crypto_currency || "").trim().toLowerCase() !== currency) {
      throw new Error("Crypto currency mismatch in callback.");
    }

    if (String(order.crypto_payment_address || "").trim() !== address) {
      throw new Error("Crypto payment address mismatch in callback.");
    }

    const expectedMinor = BigInt(String(order.crypto_amount_expected || "0"));
    const receivedMinor = BigInt(amountMinor || "0");
    const confirmationTarget = Number(order.crypto_confirmation_target || getCryptoConfirmationRequirement(currency));
    const isPaidEnough = receivedMinor >= expectedMinor && expectedMinor > 0n;
    const isConfirmed = isPaidEnough && confirmations >= confirmationTarget;
    const wasAlreadyPaid = String(order.payment_status || "").trim().toLowerCase() === "paid";
    const nextPaymentStatus = isConfirmed || wasAlreadyPaid ? "paid" : order.payment_status || "unpaid";
    const nextOrderStatus = isConfirmed ? "pending" : receivedMinor > 0n ? "ongoing" : order.status || "pending";

    await supabaseFetch(`/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      body: {
        payment_status: nextPaymentStatus,
        status: nextOrderStatus,
        crypto_amount_received: receivedMinor.toString(),
        crypto_tx_hash: inputTransactionHash || null,
        crypto_confirmations: Number.isFinite(confirmations) ? confirmations : 0,
      },
    });

    if (isConfirmed && order.project_id) {
      await supabaseFetch(`/rest/v1/projects?id=eq.${encodeURIComponent(order.project_id)}`, {
        method: "PATCH",
        body: {
          is_active: true,
        },
      });

      if (!wasAlreadyPaid) {
        await incrementCouponUsageIfNeeded(order.coupon_id);
      }
    }

    res.status(200).send("ok");
  } catch (error) {
    console.error("Crypto webhook error:", {
      error: error.message,
      address,
      currency,
      confirmations,
      orderIdFromCallback,
    });
    res.status(500).send("error");
  }
}

module.exports = {
  handleAdminCreateUser,
  handleAdminUpdateUserStatus,
  handleCreateCryptoOrder,
  handleCreateRazorpayOrder,
  handleCryptoWebhook,
  handleGetDisplayCurrencyRates,
  handleGetCryptoPaymentStatus,
  handleGetCryptoRates,
  handleVerifyRazorpayPayment,
};
