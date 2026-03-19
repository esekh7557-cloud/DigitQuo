const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://umflohaswnlwzrqbzmxs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

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

  const profiles = await supabaseFetch(
    `/rest/v1/profiles?select=id,email,full_name,phone,role,is_active,suspension_reason&id=eq.${encodeURIComponent(user.id)}&limit=1`
  );
  const profile = Array.isArray(profiles) ? profiles[0] : null;

  if (!profile || profile.is_active === false) {
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

function getPlanConfig(planKey) {
  return PLAN_CATALOG[String(planKey || "").trim()] || null;
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

  if (!plan) {
    sendJson(res, 400, { error: "Invalid plan selected." });
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
            price: plan.amount,
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
        amount: plan.amount,
        discount_amount: 0,
        final_amount: plan.amount,
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
          amount: Math.round(Number(plan.amount) * 100),
          currency: "INR",
          receipt: buildRazorpayReceipt(createdOrder.id),
          notes: {
            site_order_id: createdOrder.id,
            project_id: createdProject.id,
            plan_key: planKey,
            customer_name: customerName,
            customer_email: customerEmail,
          },
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
      `/rest/v1/orders?select=id,user_id,project_id,payment_status,status,final_amount&id=eq.${encodeURIComponent(siteOrderId)}&user_id=eq.${encodeURIComponent(authContext.user.id)}&limit=1`
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

    const payment = await razorpayFetch(`/v1/payments/${encodeURIComponent(razorpayPaymentId)}`);
    if (
      !payment ||
      payment.order_id !== razorpayOrderId ||
      !["authorized", "captured"].includes(String(payment.status || "").toLowerCase())
    ) {
      sendJson(res, 400, { error: "Razorpay payment could not be confirmed." });
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

module.exports = {
  handleAdminCreateUser,
  handleAdminUpdateUserStatus,
  handleCreateRazorpayOrder,
  handleVerifyRazorpayPayment,
};
