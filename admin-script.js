/* ========== ADMIN SCRIPT - Role-Based Access Control ========== */

const dqAuth = window.dqAuth;
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

let supabaseClient = null;
let currentUser = null;
let allUsers = [];
let allProjects = [];
let allCoupons = [];
let allOrders = [];
let orderSequenceMap = new Map();
let unreadOrderNotifications = [];
let notificationsPollingId = null;
const MOBILE_ADMIN_BREAKPOINT = 1024;
const ADMIN_THEME_STORAGE_KEY = "dq_admin_theme";
const ADMIN_SEEN_ORDER_IDS_STORAGE_KEY = "dq_admin_seen_order_ids";

function getPaymentStatusLabel(paymentStatus) {
  return String(paymentStatus || "").trim() === "paid" ? "Paid" : "Unpaid";
}

function getPaymentStatusClass(paymentStatus) {
  return String(paymentStatus || "").trim() === "paid"
    ? "payment-status paid"
    : "payment-status unpaid";
}

function getLatestProjectOrder(project) {
  if (!Array.isArray(project?.orders) || !project.orders.length) {
    return null;
  }

  return [...project.orders].sort((a, b) => {
    const aTime = new Date(a?.created_at || 0).getTime();
    const bTime = new Date(b?.created_at || 0).getTime();
    return bTime - aTime;
  })[0];
}

function isManagedProject(project) {
  return (
    String(project?.site_config?.source || "").trim() === "plan_requirements_form" ||
    String(project?.site_config?.source || "").trim() === "admin_panel" ||
    Boolean(getLatestProjectOrder(project))
  );
}

function getProjectWorkflowStatus(project) {
  const projectStatus = String(project?.site_config?.project_status || "pending").trim().toLowerCase();
  if (projectStatus === "terminated") {
    return "terminated";
  }

  const latestOrderStatus = String(getLatestProjectOrder(project)?.status || "").trim().toLowerCase();
  if (latestOrderStatus === "pending" || latestOrderStatus === "ongoing" || latestOrderStatus === "completed") {
    return latestOrderStatus;
  }

  if (projectStatus === "pending" || projectStatus === "ongoing" || projectStatus === "completed") {
    return projectStatus;
  }

  return "pending";
}

function getProjectWorkflowStatusLabel(status) {
  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
    terminated: "Terminated",
  };

  return labels[String(status || "").trim()] || "Pending";
}

function getProjectWorkflowStatusClass(status) {
  const classes = {
    pending: "project-status project-status-pending",
    ongoing: "project-status project-status-ongoing",
    completed: "project-status project-status-completed",
    terminated: "project-status project-status-terminated",
  };

  return classes[String(status || "").trim()] || "project-status project-status-pending";
}

function rebuildOrderSequenceMap(orders) {
  orderSequenceMap = new Map(
    [...(orders || [])]
      .sort((a, b) => {
        const aTime = new Date(a?.created_at || 0).getTime();
        const bTime = new Date(b?.created_at || 0).getTime();

        if (aTime === bTime) {
          return String(a?.id || "").localeCompare(String(b?.id || ""));
        }

        return aTime - bTime;
      })
      .map((order, index) => [order.id, index + 1])
  );
}

function getOrderSequenceNumber(orderId) {
  return orderSequenceMap.get(orderId) || null;
}

function getProjectOrderStatusForWorkflow(status) {
  if (status === "terminated") {
    return "failed";
  }

  return status;
}

function getPlanLabelFromKey(planKey) {
  const labels = {
    basic: "The Starter",
    business: "The Professional",
    professional: "Professional Plus",
    ecommerce: "Enterprise",
    "advanced-ecommerce": "Enterprise Plus",
  };

  return labels[String(planKey || "").trim().toLowerCase()] || "Custom";
}

function isCompactAdminViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_ADMIN_BREAKPOINT}px)`).matches;
}

function setSidebarState(isOpen) {
  const sidebar = document.getElementById("adminSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("sidebarToggle");
  const shouldOpen = Boolean(isOpen) && isCompactAdminViewport();

  if (sidebar) {
    sidebar.classList.toggle("active", shouldOpen);
  }

  if (overlay) {
    overlay.classList.toggle("active", shouldOpen);
  }

  document.body.classList.toggle("sidebar-open", shouldOpen);

  if (toggle) {
    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  }
}

function syncResponsiveTableLabels() {
  document.querySelectorAll(".data-table").forEach((table) => {
    const labels = Array.from(table.querySelectorAll("thead th")).map((heading) =>
      heading.textContent.trim()
    );

    table.querySelectorAll("tbody tr").forEach((row) => {
      Array.from(row.children).forEach((cell, index) => {
        if (cell.tagName !== "TD") {
          return;
        }

        if (cell.classList.contains("empty-state")) {
          cell.removeAttribute("data-label");
          return;
        }

        cell.setAttribute("data-label", labels[index] || "");
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeAdmin().catch((error) => {
    console.error("Admin initialization error:", error);
    redirectToLogin("Error checking admin status");
  });
});

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function getCouponDiscountType(coupon) {
  return String(coupon?.discount_type || "").trim().toLowerCase() === "fixed" ? "fixed" : "percentage";
}

function getCouponDiscountValue(coupon) {
  const type = getCouponDiscountType(coupon);
  const rawValue =
    type === "fixed"
      ? coupon?.discount_value
      : coupon?.discount_value ?? coupon?.discount_percentage;
  const value = Number(rawValue || 0);
  return Number.isFinite(value) ? value : 0;
}

function formatCouponDiscount(coupon) {
  const value = getCouponDiscountValue(coupon);
  return getCouponDiscountType(coupon) === "fixed"
    ? formatCurrency(value)
    : `${escapeHtml(String(value))}%`;
}

function toggleCouponDiscountInputState() {
  const discountTypeField = document.getElementById("couponDiscountType");
  const discountLabel = document.getElementById("couponDiscountLabel");
  const discountInput = document.getElementById("couponDiscount");
  if (!discountTypeField || !discountLabel || !discountInput) {
    return;
  }

  const type = String(discountTypeField.value || "percentage").trim().toLowerCase();
  if (type === "fixed") {
    discountLabel.textContent = "Discount Amount (INR)";
    discountInput.min = "1";
    discountInput.removeAttribute("max");
    discountInput.placeholder = "500";
    discountInput.step = "0.01";
    return;
  }

  discountLabel.textContent = "Discount Percentage (%)";
  discountInput.min = "1";
  discountInput.max = "100";
  discountInput.placeholder = "20";
  discountInput.step = "0.01";
}

function isRevenueOrder(order) {
  return (
    String(order?.status || "").trim().toLowerCase() === "completed" &&
    String(order?.payment_status || "").trim().toLowerCase() === "paid"
  );
}

function formatDate(value, options) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", options);
}

function getStoredAdminTheme() {
  return window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

function applyAdminTheme(theme) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = resolvedTheme;
  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, resolvedTheme);
  syncThemeToggle();
}

function syncThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) {
    return;
  }

  const isDark = document.body.dataset.theme === "dark";
  themeToggle.classList.toggle("is-active", isDark);
  themeToggle.setAttribute("aria-label", isDark ? "Enable light mode" : "Enable dark mode");
  themeToggle.innerHTML = `<i class="fas ${isDark ? "fa-sun" : "fa-moon"}"></i>`;
}

function readSeenOrderIds() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SEEN_ORDER_IDS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSeenOrderIds(orderIds) {
  window.localStorage.setItem(
    ADMIN_SEEN_ORDER_IDS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set((orderIds || []).filter(Boolean))))
  );
}

function renderOrderNotifications() {
  const notificationsList = document.getElementById("notificationsList");
  const notificationsBell = document.getElementById("notificationsBell");
  const badge = notificationsBell?.querySelector(".badge");

  if (!notificationsList || !badge) {
    return;
  }

  badge.textContent = String(unreadOrderNotifications.length);
  badge.classList.toggle("is-hidden", unreadOrderNotifications.length === 0);

  if (!unreadOrderNotifications.length) {
    notificationsList.innerHTML = '<p class="empty-state">No new order notifications.</p>';
    return;
  }

  notificationsList.innerHTML = unreadOrderNotifications
    .map((order) => {
      const customer = getOrderCustomerDetails(order);
      const orderNumber = getOrderSequenceNumber(order.id);
      const orderDate = formatDate(order.created_at, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      return `
        <article class="notification-item">
          <strong>New order ${orderNumber ? `#${escapeHtml(String(orderNumber))}` : ""}</strong>
          <p>${escapeHtml(customer.name)} placed a ${escapeHtml(getOrderPlanName(order))} order.</p>
          <div class="notification-item-meta">
            <span>${escapeHtml(formatCurrency(order.final_amount || 0))} • ${escapeHtml(orderDate)}</span>
            <button class="btn btn-secondary" type="button" onclick="viewOrderDetails('${escapeHtml(order.id)}')">View</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function syncOrderNotifications(orders) {
  const orderIds = (orders || []).map((order) => order.id).filter(Boolean);
  const stored = window.localStorage.getItem(ADMIN_SEEN_ORDER_IDS_STORAGE_KEY);

  if (!stored) {
    writeSeenOrderIds(orderIds);
    unreadOrderNotifications = [];
    renderOrderNotifications();
    return;
  }

  const seenOrderIds = new Set(readSeenOrderIds());
  unreadOrderNotifications = (orders || []).filter((order) => !seenOrderIds.has(order.id));
  renderOrderNotifications();
}

function markAllNotificationsRead() {
  writeSeenOrderIds(allOrders.map((order) => order.id));
  unreadOrderNotifications = [];
  renderOrderNotifications();
}

function refreshProjectOwnerOptions() {
  const ownerSelect = document.getElementById("projectOwner");
  if (!ownerSelect) {
    return;
  }

  const ownerOptions = allUsers
    .filter((user) => user.is_active !== false && String(user.role || "").trim().toLowerCase() !== "admin")
    .map((user) => {
      const label = `${user.full_name || user.email} (${user.email || "No email"})`;
      return `<option value="${escapeHtml(user.id)}">${escapeHtml(label)}</option>`;
    })
    .join("");

  ownerSelect.innerHTML = `<option value="">Select a customer</option>${ownerOptions}`;
}

function startNotificationsPolling() {
  if (notificationsPollingId) {
    window.clearInterval(notificationsPollingId);
  }

  notificationsPollingId = window.setInterval(() => {
    Promise.all([loadOrders(), loadDashboardData()]).catch((error) => {
      console.error("Notification refresh error:", error);
    });
  }, 45000);
}

function getOrderPlanName(order) {
  return (
    order?.projects?.site_config?.plan?.name ||
    order?.projects?.template_id ||
    "Not selected"
  );
}

function getOrderCustomerDetails(order) {
  const contact = order?.projects?.site_config?.contact || {};

  return {
    name: order?.profiles?.full_name || contact.full_name || "Unknown",
    email: order?.profiles?.email || contact.email || "Unknown",
    phone: order?.profiles?.phone || contact.phone || "Not provided",
  };
}

function getRevenueTrendPoints(orders, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      amount: 0,
    };
  });

  const pointMap = new Map(points.map((point) => [point.key, point]));

  orders.forEach((order) => {
    if (!isRevenueOrder(order) || !order?.created_at) {
      return;
    }

    const createdDate = new Date(order.created_at);
    if (Number.isNaN(createdDate.getTime())) {
      return;
    }

    const key = createdDate.toISOString().slice(0, 10);
    const point = pointMap.get(key);
    if (!point) {
      return;
    }

    point.amount += Number(order.final_amount || 0);
  });

  return points;
}

function renderRevenueChart(orders) {
  const chartRoot = document.getElementById("revenueChart");
  if (!chartRoot) {
    return;
  }

  const points = getRevenueTrendPoints(orders, 30);
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);
  const totalRevenue = points.reduce((sum, point) => sum + point.amount, 0);
  const activeDays = points.filter((point) => point.amount > 0).length;
  const peakPoint = points.reduce((best, point) => (point.amount > best.amount ? point : best), points[0] || {
    label: "N/A",
    amount: 0,
  });

  if (!maxAmount) {
    chartRoot.classList.remove("chart-ready");
    chartRoot.innerHTML = '<div class="revenue-chart-empty">No completed-order revenue recorded in the last 30 days.</div>';
    return;
  }

  const width = 760;
  const height = 300;
  const paddingTop = 24;
  const paddingBottom = 42;
  const paddingLeft = 52;
  const paddingRight = 18;
  const graphHeight = height - paddingTop - paddingBottom;
  const graphWidth = width - paddingLeft - paddingRight;
  const barGap = 6;
  const barWidth = graphWidth / points.length - barGap;
  const yTicks = 4;

  const gridLines = Array.from({ length: yTicks + 1 }, (_, index) => {
    const value = (maxAmount / yTicks) * (yTicks - index);
    const y = paddingTop + (graphHeight / yTicks) * index;

    return `
      <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="rgba(148, 163, 184, 0.2)" stroke-width="1" />
      <text x="${paddingLeft - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${escapeHtml(formatCurrency(value))}</text>
    `;
  }).join("");

  const bars = points
    .map((point, index) => {
      const x = paddingLeft + index * (barWidth + barGap);
      const barHeight = maxAmount ? Math.max((point.amount / maxAmount) * graphHeight, point.amount > 0 ? 4 : 0) : 0;
      const y = paddingTop + graphHeight - barHeight;
      const showLabel = index === 0 || index === points.length - 1 || index % 5 === 0;

      return `
        <g>
          <title>${escapeHtml(`${point.label}: ${formatCurrency(point.amount)}`)}</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="url(#revenueGradient)" />
          ${showLabel ? `<text x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle" font-size="10" fill="#6b7280">${escapeHtml(point.label)}</text>` : ""}
        </g>
      `;
    })
    .join("");

  chartRoot.classList.add("chart-ready");
  chartRoot.innerHTML = `
    <div class="revenue-chart">
      <div class="revenue-chart-summary">
        <div class="revenue-chart-stat">
          <span>Days tracked</span>
          <strong>${points.length}</strong>
        </div>
        <div class="revenue-chart-stat">
          <span>Revenue earned</span>
          <strong>${escapeHtml(formatCurrency(totalRevenue))}</strong>
        </div>
        <div class="revenue-chart-stat">
          <span>Best day</span>
          <strong>${escapeHtml(`${peakPoint.label} • ${formatCurrency(peakPoint.amount)}`)}</strong>
        </div>
      </div>
      <svg class="revenue-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Revenue trend for the last 30 days">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>
        </defs>
        ${gridLines}
        <line x1="${paddingLeft}" y1="${paddingTop + graphHeight}" x2="${width - paddingRight}" y2="${paddingTop + graphHeight}" stroke="rgba(148, 163, 184, 0.35)" stroke-width="1" />
        ${bars}
      </svg>
      <p class="recent-item-meta">${activeDays} day(s) recorded completed revenue in the last 30 days.</p>
    </div>
  `;
}

function buildRecentOrdersMarkup(orders) {
  return orders
    .map((order) => {
      const customer = getOrderCustomerDetails(order);
      const orderDate = formatDate(order.created_at, { day: "numeric", month: "short", year: "numeric" });
      const planName = getOrderPlanName(order);
      const orderNumber = getOrderSequenceNumber(order.id);

      return `
        <div class="recent-item">
          <div class="recent-item-copy">
            <strong>${escapeHtml(customer.name)}</strong>
            <p class="recent-item-meta">${escapeHtml(customer.email)}</p>
            <p class="recent-item-meta">Order ID: ${escapeHtml(String(orderNumber || ""))} • ${escapeHtml(orderDate)}</p>
            <p class="recent-item-meta">${escapeHtml(planName)}</p>
          </div>
          <div class="recent-item-actions">
            <span class="recent-item-amount">${escapeHtml(formatCurrency(order.final_amount || 0))}</span>
            <button class="btn btn-secondary" type="button" onclick="viewOrderDetails('${escapeHtml(order.id)}')">View</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function buildOrderDetailsMarkup(order) {
  const customer = getOrderCustomerDetails(order);
  const planName = getOrderPlanName(order);
  const orderNumber = getOrderSequenceNumber(order.id);
  const createdAt = formatDate(order.created_at, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return `
    <div class="project-detail-grid">
      ${buildProjectDetailSection("Order Summary", [
        { label: "Order ID", value: orderNumber ? String(orderNumber) : "Not available" },
        { label: "Order Date", value: createdAt },
        { label: "Plan Chosen", value: planName },
        { label: "Status", value: String(order.status || "pending").replace(/\b\w/g, (char) => char.toUpperCase()) },
        { label: "Payment", value: getPaymentStatusLabel(order.payment_status) },
      ])}
      ${buildProjectDetailSection("Customer Details", [
        { label: "Name", value: customer.name },
        { label: "Email", value: customer.email },
        { label: "Phone", value: customer.phone },
      ])}
      ${buildProjectDetailSection("Pricing", [
        { label: "Order Amount", value: formatCurrency(order.amount || 0) },
        { label: "Discount", value: formatCurrency(order.discount_amount || 0) },
        { label: "Final Amount", value: formatCurrency(order.final_amount || 0) },
      ])}
    </div>
  `;
}

function buildAvatarFallback(name) {
  const initial = escapeHtml((name || "A").charAt(0).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#6366f1"/><text x="32" y="39" text-anchor="middle" font-size="28" fill="#ffffff" font-family="Arial, sans-serif">${initial}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function initializeAdmin() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    redirectToLogin("Supabase is not configured");
    return;
  }

  supabaseClient = await dqAuth.getClient();
  const session = await dqAuth.getSession();
  if (!supabaseClient || !session) {
    redirectToLogin("No session found");
    return;
  }

  const profile = await dqAuth.getCurrentProfile();
  if (!profile) {
    redirectToLogin("No profile found");
    return;
  }

  if (profile.role !== "admin" || profile.is_active === false) {
    redirectToLogin("Access denied");
    return;
  }

  currentUser = profile;

  document.getElementById("authCheck").style.display = "none";
  document.getElementById("adminPanel").style.display = "grid";
  document.getElementById("userName").textContent = profile.full_name || "Admin";
  document.getElementById("userEmail").textContent = profile.email || "";
  document.getElementById("userAvatar").src = profile.profile_photo || buildAvatarFallback(profile.full_name || "Admin");
  applyAdminTheme(getStoredAdminTheme());

  setupEventListeners();

  await Promise.all([loadDashboardData(), loadUsers(), loadProjects(), loadCoupons(), loadOrders()]);
  refreshProjectOwnerOptions();
  startNotificationsPolling();
}

function redirectToLogin(reason) {
  console.warn("Redirect reason:", reason);
  window.location.href = "login.html";
}

function setupEventListeners() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      const sidebar = document.getElementById("adminSidebar");
      setSidebarState(!sidebar?.classList.contains("active"));
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      setSidebarState(false);
    });
  }

  window.addEventListener("resize", () => {
    if (!isCompactAdminViewport()) {
      setSidebarState(false);
    }

    syncResponsiveTableLabels();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebarState(false);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("refreshDashboardBtn").addEventListener("click", refreshAdminData);
  document.getElementById("addUserBtn").addEventListener("click", () => openModal("addUserModal"));
  document.getElementById("addProjectBtn").addEventListener("click", () => {
    refreshProjectOwnerOptions();
    openModal("addProjectModal");
  });
  document.getElementById("createCouponBtn").addEventListener("click", () => openModal("createCouponModal"));
  document.getElementById("notificationsBell").addEventListener("click", () => openModal("notificationsModal"));
  document.getElementById("markNotificationsReadBtn").addEventListener("click", markAllNotificationsRead);
  document.getElementById("themeToggle").addEventListener("click", () => {
    applyAdminTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
  });

  setupModalControls();

  document.getElementById("addUserForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAddUser();
  });
  document.getElementById("submitAddUserBtn").addEventListener("click", () => {
    document.getElementById("addUserForm").requestSubmit();
  });

  document.getElementById("addProjectForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAddProject();
  });
  document.getElementById("submitAddProjectBtn").addEventListener("click", () => {
    document.getElementById("addProjectForm").requestSubmit();
  });

  document.getElementById("createCouponForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitCreateCoupon();
  });
  document.getElementById("submitCouponBtn").addEventListener("click", () => {
    document.getElementById("createCouponForm").requestSubmit();
  });
  document.getElementById("couponDiscountType").addEventListener("change", toggleCouponDiscountInputState);
  toggleCouponDiscountInputState();

  document.getElementById("saveConfigBtn").addEventListener("click", saveConfig);
  document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCSV);

  document.getElementById("userFilter").addEventListener("input", filterUsers);
  document.getElementById("roleFilter").addEventListener("change", filterUsers);
  document.getElementById("statusFilter").addEventListener("change", filterUsers);
  document.getElementById("projectFilter").addEventListener("input", filterProjects);
  document.getElementById("templateFilter").addEventListener("change", filterProjects);
  document.getElementById("projectStatusFilter").addEventListener("change", filterProjects);
  document.getElementById("couponFilter").addEventListener("input", filterCoupons);
  document.getElementById("couponStatusFilter").addEventListener("change", filterCoupons);
  document.getElementById("couponsTableBody").addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const deleteButton = event.target.closest("[data-action='delete-coupon']");
    if (!(deleteButton instanceof HTMLElement)) {
      return;
    }

    const { couponId = "" } = deleteButton.dataset;
    if (!couponId) {
      return;
    }

    await deleteCoupon(couponId, deleteButton);
  });
  document.getElementById("orderFilter").addEventListener("input", filterOrders);
  document.getElementById("orderStatusFilter").addEventListener("change", filterOrders);

  setSidebarState(false);
  syncResponsiveTableLabels();
  renderOrderNotifications();
}

function setupModalControls() {
  document.querySelectorAll(".close-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.target.closest(".modal").classList.remove("show");
    });
  });

  document.querySelectorAll(".close-modal-btn").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".modal").classList.remove("show");
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("show");
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
  }
}

function switchSection(sectionId) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add("active");
  }

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionId);
  });

  setSidebarState(false);
}

async function logout() {
  try {
    await dqAuth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    window.location.href = "index.html";
  }
}

async function loadDashboardData() {
  try {
    const [ordersResponse, usersResponse, projectsResponse, couponsResponse, recentOrdersResponse] = await Promise.all([
      supabaseClient
        .from("orders")
        .select("id, final_amount, status, payment_status, created_at")
        .order("created_at", { ascending: false }),
      supabaseClient.from("profiles").select("id").eq("is_active", true),
      supabaseClient.from("projects").select("id, is_active, site_config"),
      supabaseClient.from("coupons").select("id").eq("is_active", true),
      supabaseClient
        .from("orders")
        .select("id, user_id, final_amount, status, payment_status, created_at, profiles(full_name, email, phone), projects(project_name, template_id, site_config)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (ordersResponse.error) {
      throw ordersResponse.error;
    }
    if (usersResponse.error) {
      throw usersResponse.error;
    }
    if (projectsResponse.error) {
      throw projectsResponse.error;
    }
    if (couponsResponse.error) {
      throw couponsResponse.error;
    }
    if (recentOrdersResponse.error) {
      throw recentOrdersResponse.error;
    }

    const totalRevenue = (ordersResponse.data || []).reduce((sum, order) => {
      if (!isRevenueOrder(order)) {
        return sum;
      }

      return sum + Number(order.final_amount || 0);
    }, 0);

    rebuildOrderSequenceMap(ordersResponse.data || []);
    const activeSitesCount = (projectsResponse.data || []).filter((project) => {
      if (project.is_active === false) {
        return false;
      }

      return String(project.site_config?.project_status || "").trim().toLowerCase() !== "terminated";
    }).length;
    document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue);
    document.getElementById("activeUsers").textContent = String((usersResponse.data || []).length);
    document.getElementById("activeSites").textContent = String(activeSitesCount);
    document.getElementById("couponCount").textContent = String((couponsResponse.data || []).length);
    renderRevenueChart(ordersResponse.data || []);
    document.getElementById("recentOrders").innerHTML =
      buildRecentOrdersMarkup(recentOrdersResponse.data || []) || '<p class="empty-state">No recent orders</p>';
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    const chartRoot = document.getElementById("revenueChart");
    if (chartRoot) {
      chartRoot.classList.remove("chart-ready");
      chartRoot.innerHTML = '<p>Chart could not be loaded.</p>';
    }
    document.getElementById("recentOrders").innerHTML =
      '<p class="empty-state">Dashboard data could not be loaded.</p>';
  }
}

async function refreshAdminData() {
  const refreshButton = document.getElementById("refreshDashboardBtn");

  try {
    refreshButton.disabled = true;
    refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing';
    await Promise.all([loadDashboardData(), loadUsers(), loadProjects(), loadCoupons(), loadOrders()]);
  } catch (error) {
    console.error("Error refreshing admin data:", error);
    alert("Dashboard refresh failed.");
  } finally {
    refreshButton.disabled = false;
    refreshButton.innerHTML = '<i class="fas fa-rotate-right"></i> Refresh';
  }
}

async function loadUsers() {
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .neq("id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    allUsers = data || [];
    displayUsers(allUsers);
    refreshProjectOwnerOptions();
  } catch (error) {
    console.error("Error loading users:", error);
    displayUsers([]);
  }
}

function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
    syncResponsiveTableLabels();
    return;
  }

  tbody.innerHTML = users
    .map((user) => {
      const fullName = escapeHtml(user.full_name || "Unknown");
      const email = escapeHtml(user.email || "");
      const role = escapeHtml(user.role || "customer");
      const plan = escapeHtml(user.subscription_plan || "free");
      const suspensionReason = String(user.suspension_reason || "").trim();
      const reasonInputId = `suspension-reason-${String(user.id || "").replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const joined = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown date";
      const roleStyle =
        user.role === "admin"
          ? "background: rgba(239, 68, 68, 0.1); color: var(--danger);"
          : "background: rgba(99, 102, 241, 0.1); color: var(--primary);";
      const statusStyle = user.is_active
        ? "background: rgba(16, 185, 129, 0.1); color: var(--success);"
        : "background: rgba(107, 114, 128, 0.1); color: var(--gray);";
      const actionLabel = user.is_active ? "Suspend" : "Unsuspend";
      const actionClass = user.is_active ? "btn btn-danger" : "btn btn-success";
      const nextStatus = user.is_active ? "false" : "true";

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
                ${escapeHtml((user.full_name || "U").charAt(0).toUpperCase())}
              </div>
              <span>${fullName}</span>
            </div>
          </td>
          <td>${email}</td>
          <td><span style="${roleStyle} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${role}</span></td>
          <td>${plan}</td>
          <td><span style="${statusStyle} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${user.is_active ? "Active" : "Inactive"}</span></td>
          <td>${escapeHtml(joined)}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <button class="${actionClass}" onclick="setUserStatus('${escapeHtml(user.id)}', ${nextStatus}, '${reasonInputId}')">${actionLabel}</button>
              <input
                id="${reasonInputId}"
                type="text"
                placeholder="Reason"
                value="${escapeHtml(suspensionReason)}"
                style="min-width: 190px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px;"
              />
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  syncResponsiveTableLabels();
}

function filterUsers() {
  const searchTerm = document.getElementById("userFilter").value.toLowerCase();
  const roleFilter = document.getElementById("roleFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const filtered = allUsers.filter((user) => {
    const matchesSearch =
      String(user.email || "").toLowerCase().includes(searchTerm) ||
      String(user.full_name || "").toLowerCase().includes(searchTerm);
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === "active" ? user.is_active : !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  displayUsers(filtered);
}

async function submitAddUser() {
  const fullName = document.getElementById("newUserName").value.trim();
  const email = document.getElementById("newUserEmail").value.trim();
  const phone = document.getElementById("newUserPhone").value.trim();
  const password = document.getElementById("newUserPassword").value;
  const role = document.getElementById("newUserRole").value;
  const subscriptionPlan = document.getElementById("newUserPlan").value;
  const submitButton = document.getElementById("submitAddUserBtn");

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Creating...";

    const session = await dqAuth.getSession();
    if (!session?.access_token) {
      throw new Error("Admin session expired. Please log in again.");
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        password,
        role,
        subscriptionPlan,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not create user.");
    }

    alert("User created successfully");
    document.getElementById("addUserForm").reset();
    closeModal("addUserModal");
    await Promise.all([loadUsers(), loadDashboardData()]);
  } catch (error) {
    console.error("Error creating user:", error);
    alert(`Error creating user: ${error.message || "Unknown error"}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create User";
  }
}

async function submitAddProject() {
  const ownerId = document.getElementById("projectOwner").value;
  const projectName = document.getElementById("newProjectName").value.trim();
  const domainName = document.getElementById("newProjectDomain").value.trim().toLowerCase();
  const planKey = document.getElementById("newProjectPlan").value;
  const priceValue = document.getElementById("newProjectPrice").value;
  const workflowStatus = document.getElementById("newProjectStatus").value;
  const summary = document.getElementById("newProjectSummary").value.trim();
  const submitButton = document.getElementById("submitAddProjectBtn");
  const ownerProfile = allUsers.find((user) => user.id === ownerId);

  if (!ownerId || !ownerProfile) {
    alert("Select a valid customer for the project.");
    return;
  }

  if (!projectName) {
    alert("Project name is required.");
    return;
  }

  if (!["pending", "ongoing", "completed", "terminated"].includes(workflowStatus)) {
    alert("Select a valid project status.");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Creating...";

    const planPrice = priceValue ? Number(priceValue) : 0;
    const { error } = await supabaseClient.from("projects").insert({
      user_id: ownerId,
      project_name: projectName,
      domain_name: domainName || null,
      template_id: planKey,
      site_config: {
        source: "admin_panel",
        created_by_admin: true,
        submitted_at: new Date().toISOString(),
        contact: {
          full_name: ownerProfile.full_name || "",
          email: ownerProfile.email || "",
          phone: ownerProfile.phone || "",
        },
        plan: {
          key: planKey,
          name: getPlanLabelFromKey(planKey),
          price: planPrice,
        },
        summary: {
          idea: summary || "Project created from admin panel.",
        },
        project_status: workflowStatus,
      },
      is_active: true,
    });

    if (error) {
      throw error;
    }

    alert("Project created successfully");
    document.getElementById("addProjectForm").reset();
    closeModal("addProjectModal");
    await Promise.all([loadProjects(), loadDashboardData()]);
  } catch (error) {
    console.error("Error creating project:", error);
    alert(`Error creating project: ${error.message || "Unknown error"}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create Project";
  }
}

async function setUserStatus(userId, shouldActivate, reasonInputId) {
  const action = shouldActivate ? "unsuspend" : "suspend";
  const reasonInput = reasonInputId ? document.getElementById(reasonInputId) : null;
  const suspensionReason = shouldActivate ? "" : String(reasonInput?.value || "").trim();

  if (!shouldActivate && !suspensionReason) {
    alert("Enter a suspension reason first.");
    reasonInput?.focus();
    return;
  }

  if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  try {
    const session = await dqAuth.getSession();
    if (!session?.access_token) {
      throw new Error("Admin session expired. Please log in again.");
    }

    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        isActive: shouldActivate,
        suspensionReason,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Could not ${action} this user.`);
    }

    alert(`User ${shouldActivate ? "unsuspended" : "suspended"} successfully`);
    if (shouldActivate && reasonInput instanceof HTMLInputElement) {
      reasonInput.value = "";
    }
    await Promise.all([loadUsers(), loadDashboardData()]);
  } catch (error) {
    console.error(`Error trying to ${action} user:`, error);
    alert(`Error trying to ${action} user: ${error.message || "Unknown error"}`);
  }
}

async function loadProjects() {
  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*, profiles(full_name, email, phone), orders(id, status, payment_status, final_amount, created_at)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }
    allProjects = (data || [])
      .filter(isManagedProject)
      .map((project) => {
        const syncedStatus = getProjectWorkflowStatus(project);

        return {
          ...project,
          site_config: {
            ...(project.site_config || {}),
            project_status: syncedStatus,
          },
        };
      });
    displayProjects(allProjects);
  } catch (error) {
    console.error("Error loading projects:", error);
    displayProjects([]);
  }
}

function formatProjectValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map((entry) => escapeHtml(entry)).join("\n") : "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return escapeHtml(String(value));
}

function buildProjectDetailSection(title, fields) {
  const rows = fields
    .map(
      (field) => `
        <div class="project-detail-row">
          <span>${escapeHtml(field.label)}</span>
          <strong>${formatProjectValue(field.value)}</strong>
        </div>
      `
    )
    .join("");

  if (!fields.length) {
    return "";
  }

  return `
    <section class="project-detail-section">
      <h4>${escapeHtml(title)}</h4>
      ${rows}
    </section>
  `;
}

function isProjectDetailValueEmpty(value) {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isProjectDetailValueEmpty);
  }

  if (typeof value === "object") {
    return Object.values(value).every(isProjectDetailValueEmpty);
  }

  return false;
}

function toProjectDetailLabel(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildProjectDetailTree(value, label = "") {
  if (isProjectDetailValueEmpty(value)) {
    return "";
  }

  if (Array.isArray(value)) {
    const items = value
      .map((entry) => buildProjectDetailTree(entry))
      .filter(Boolean)
      .map((entry) => `<div class="project-detail-subitem">${entry}</div>`)
      .join("");

    if (!items) {
      return "";
    }

    return `
      <div class="project-detail-block">
        ${label ? `<h5>${escapeHtml(label)}</h5>` : ""}
        <div class="project-detail-subgrid">${items}</div>
      </div>
    `;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, entryValue]) => buildProjectDetailTree(entryValue, toProjectDetailLabel(key)))
      .filter(Boolean)
      .join("");

    if (!entries) {
      return "";
    }

    return `
      <div class="project-detail-block">
        ${label ? `<h5>${escapeHtml(label)}</h5>` : ""}
        <div class="project-detail-subgrid">${entries}</div>
      </div>
    `;
  }

  return `
    <div class="project-detail-row">
      ${label ? `<span>${escapeHtml(label)}</span>` : ""}
      <strong>${formatProjectValue(value)}</strong>
    </div>
  `;
}

function displayProjects(projects) {
  const activeContainer = document.getElementById("projectsList");
  const completedContainer = document.getElementById("completedProjectsList");
  const terminatedContainer = document.getElementById("terminatedProjectsList");

  if (!activeContainer || !completedContainer || !terminatedContainer) {
    return;
  }

  if (!projects.length) {
    activeContainer.innerHTML = '<p class="empty-state" style="padding: 40px;">No projects found</p>';
    completedContainer.innerHTML = '<p class="empty-state" style="padding: 40px;">No completed projects found</p>';
    terminatedContainer.innerHTML = '<p class="empty-state" style="padding: 40px;">No terminated projects found</p>';
    return;
  }

  const renderProjectCard = (project) => {
      const projectName = escapeHtml(project.project_name || "Untitled Project");
      const ownerName = escapeHtml(project.profiles?.full_name || project.site_config?.contact?.full_name || "Unknown");
      const ownerEmail = escapeHtml(project.profiles?.email || project.site_config?.contact?.email || "Unknown");
      const ownerPhone = escapeHtml(project.profiles?.phone || project.site_config?.contact?.phone || "Not provided");
      const domain = escapeHtml(project.domain_name || "Not assigned");
      const templateId = escapeHtml(project.site_config?.plan?.name || project.template_id || "basic");
      const workflowStatus = getProjectWorkflowStatus(project);
      const latestOrder = getLatestProjectOrder(project);
      const paymentStatus = getPaymentStatusLabel(latestOrder?.payment_status);
      const summaryIdea = escapeHtml(
        project.site_config?.summary?.idea ||
          project.site_config?.requirements?.basic?.websiteIdea ||
          project.site_config?.requirements?.ecommerce?.storeIdea ||
          "Project details submitted by customer."
      );

      return `
        <div class="project-card">
          <div class="project-card-top">
            <h4>${projectName}</h4>
            <span class="${getProjectWorkflowStatusClass(workflowStatus)}">${getProjectWorkflowStatusLabel(workflowStatus)}</span>
          </div>
          <p class="project-meta"><strong>Customer:</strong> ${ownerName}</p>
          <p class="project-meta"><strong>Email:</strong> ${ownerEmail}</p>
          <p class="project-meta"><strong>Phone:</strong> ${ownerPhone}</p>
          <p class="project-meta"><strong>Domain:</strong> ${domain}</p>
          <p class="project-meta"><strong>Plan:</strong> ${templateId}</p>
          <p class="project-meta"><strong>Payment:</strong> <span class="${getPaymentStatusClass(latestOrder?.payment_status)}">${paymentStatus}</span></p>
          <p class="project-meta">${summaryIdea}</p>
          <div class="project-card-controls">
            <select class="filter-input project-status-select" onchange="updateProjectWorkflowStatus('${escapeHtml(project.id)}', this.value)">
              <option value="pending" ${workflowStatus === "pending" ? "selected" : ""}>Pending</option>
              <option value="ongoing" ${workflowStatus === "ongoing" ? "selected" : ""}>Ongoing</option>
              <option value="completed" ${workflowStatus === "completed" ? "selected" : ""}>Completed</option>
              <option value="terminated" ${workflowStatus === "terminated" ? "selected" : ""}>Terminated</option>
            </select>
          </div>
          <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="viewProjectDetails('${escapeHtml(project.id)}')">See Project Details</button>
            ${
              latestOrder?.id
                ? `<button class="btn ${latestOrder?.payment_status === "paid" ? "btn-secondary" : "btn-success"}" onclick="toggleOrderPaymentStatus('${escapeHtml(latestOrder.id)}', '${escapeHtml(latestOrder.payment_status || "unpaid")}', '${escapeHtml(project.id)}')">${latestOrder?.payment_status === "paid" ? "Mark Unpaid" : "Mark Paid"}</button>`
                : ""
            }
          </div>
        </div>
      `;
  };

  const activeProjects = projects.filter((project) => {
    const status = getProjectWorkflowStatus(project);
    return status !== "completed" && status !== "terminated";
  });
  const completedProjects = projects.filter((project) => getProjectWorkflowStatus(project) === "completed");
  const terminatedProjects = projects.filter((project) => getProjectWorkflowStatus(project) === "terminated");

  activeContainer.innerHTML = activeProjects.length
    ? activeProjects.map(renderProjectCard).join("")
    : '<p class="empty-state" style="padding: 40px;">No active projects found</p>';

  completedContainer.innerHTML = completedProjects.length
    ? completedProjects.map(renderProjectCard).join("")
    : '<p class="empty-state" style="padding: 40px;">No completed projects found</p>';

  terminatedContainer.innerHTML = terminatedProjects.length
    ? terminatedProjects.map(renderProjectCard).join("")
    : '<p class="empty-state" style="padding: 40px;">No terminated projects found</p>';
}

function viewProjectDetails(projectId) {
  const project = allProjects.find((entry) => entry.id === projectId);
  const content = document.getElementById("projectDetailsContent");

  if (!project || !content) {
    return;
  }

  const contact = project.site_config?.contact || {};
  const requirements = project.site_config?.requirements || {};
  const professional = requirements.professional || {};
  const ecommerce = requirements.ecommerce || {};
  const advancedEcommerce = requirements.advancedEcommerce || {};
  const latestOrder = getLatestProjectOrder(project);
  const planKey = String(project.site_config?.plan?.key || project.template_id || "").trim().toLowerCase();
  const showBasicRequirements =
    ["basic", "business", "professional"].includes(planKey) && !isProjectDetailValueEmpty(requirements.basic);
  const showBusinessRequirements =
    ["business", "professional"].includes(planKey) && !isProjectDetailValueEmpty(requirements.business);
  const showProfessionalRequirements =
    planKey === "professional" && !isProjectDetailValueEmpty(requirements.professional);
  const showEcommerceRequirements =
    planKey === "ecommerce" && !isProjectDetailValueEmpty(requirements.ecommerce);
  const showAdvancedEcommerceRequirements =
    planKey === "advanced-ecommerce" &&
    (!isProjectDetailValueEmpty(requirements.ecommerce) || !isProjectDetailValueEmpty(requirements.advancedEcommerce));

  content.innerHTML = `
    <div class="project-detail-grid">
      ${buildProjectDetailSection("Customer", [
        { label: "Name", value: project.profiles?.full_name || contact.full_name },
        { label: "Email", value: project.profiles?.email || contact.email },
        { label: "Phone", value: project.profiles?.phone || contact.phone },
        { label: "Submitted", value: project.created_at ? new Date(project.created_at).toLocaleString() : "" },
      ])}
      ${buildProjectDetailSection("Plan", [
        { label: "Plan", value: project.site_config?.plan?.name || project.template_id },
        { label: "Quoted Price", value: project.site_config?.plan?.price ? formatCurrency(project.site_config.plan.price) : "" },
        { label: "Project Name", value: project.project_name },
        { label: "Project Status", value: getProjectWorkflowStatusLabel(getProjectWorkflowStatus(project)) },
        { label: "Payment", value: getPaymentStatusLabel(latestOrder?.payment_status) },
        { label: "Order Amount", value: latestOrder?.final_amount ? formatCurrency(latestOrder.final_amount) : "" },
      ])}
      ${
        latestOrder?.id
          ? `
            <section class="project-detail-section">
              <h4>Payment Control</h4>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <span class="${getPaymentStatusClass(latestOrder.payment_status)}">${escapeHtml(getPaymentStatusLabel(latestOrder.payment_status))}</span>
                <button class="btn ${latestOrder.payment_status === "paid" ? "btn-secondary" : "btn-success"}" onclick="toggleOrderPaymentStatus('${escapeHtml(latestOrder.id)}', '${escapeHtml(latestOrder.payment_status || "unpaid")}', '${escapeHtml(project.id)}')">${latestOrder.payment_status === "paid" ? "Mark Unpaid" : "Mark Paid"}</button>
              </div>
            </section>
          `
          : ""
      }
      <section class="project-detail-section">
        <h4>Project Workflow</h4>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <span class="${getProjectWorkflowStatusClass(getProjectWorkflowStatus(project))}">${getProjectWorkflowStatusLabel(getProjectWorkflowStatus(project))}</span>
          <select class="filter-input project-status-select" onchange="updateProjectWorkflowStatus('${escapeHtml(project.id)}', this.value)">
            <option value="pending" ${getProjectWorkflowStatus(project) === "pending" ? "selected" : ""}>Pending</option>
            <option value="ongoing" ${getProjectWorkflowStatus(project) === "ongoing" ? "selected" : ""}>Ongoing</option>
            <option value="completed" ${getProjectWorkflowStatus(project) === "completed" ? "selected" : ""}>Completed</option>
            <option value="terminated" ${getProjectWorkflowStatus(project) === "terminated" ? "selected" : ""}>Terminated</option>
          </select>
        </div>
      </section>
      ${
        showBasicRequirements
          ? buildProjectDetailSection("The Starter Requirements", [
              { label: "Describe your website idea", value: requirements.basic?.websiteIdea },
              { label: "Business details to show (About / Services / Contact)", value: requirements.basic?.businessDetails },
              { label: "Number of pages required (Up to 5)", value: requirements.basic?.pageCount },
            ])
          : ""
      }
      ${
        showBusinessRequirements
          ? buildProjectDetailSection("The Professional Requirements", [
              { label: "Additional pages or sections required (Gallery / Testimonials / FAQ / Team / Offers etc.)", value: requirements.business?.additionalSections },
              { label: "Do you need Blog setup?", value: requirements.business?.needsBlog },
              { label: "Do you need Google Map integration?", value: requirements.business?.needsGoogleMap },
              { label: "Do you need Basic SEO setup?", value: requirements.business?.needsBasicSeo },
            ])
          : ""
      }
      ${
        showProfessionalRequirements
          ? buildProjectDetailSection("Professional Plus Requirements", [
              { label: "Do you need custom UI/UX design or reference websites?", value: professional.designReference },
              { label: "Advanced features required", value: professional.features },
              { label: "Other", value: professional.otherFeature },
              { label: "Approx total pages / modules required", value: professional.approxPagesModules },
            ])
          : ""
      }
      ${
        showEcommerceRequirements
          ? buildProjectDetailSection("Enterprise Requirements", [
              { label: "Describe your online store idea", value: ecommerce.storeIdea },
              { label: "Number of products to upload initially", value: ecommerce.initialProducts },
              { label: "Product categories required", value: ecommerce.categories },
              { label: "Required ecommerce features", value: ecommerce.features },
              { label: "Other", value: ecommerce.otherFeature },
            ])
          : ""
      }
      ${
        showAdvancedEcommerceRequirements
          ? buildProjectDetailSection("Enterprise Plus Requirements", [
              { label: "Describe your online store idea", value: ecommerce.storeIdea },
              { label: "Number of products to upload initially", value: ecommerce.initialProducts },
              { label: "Product categories required", value: ecommerce.categories },
              { label: "Expected number of products in future scaling", value: advancedEcommerce.futureScaling },
              { label: "Advanced ecommerce features required", value: advancedEcommerce.features },
              { label: "Other", value: advancedEcommerce.otherFeature },
            ])
          : ""
      }
    </div>
  `;

  openModal("projectDetailsModal");
}

function filterProjects() {
  const searchTerm = document.getElementById("projectFilter").value.toLowerCase();
  const templateFilter = document.getElementById("templateFilter").value;
  const statusFilter = document.getElementById("projectStatusFilter").value;

  const filtered = allProjects.filter((project) => {
    const matchesSearch =
      String(project.project_name || "").toLowerCase().includes(searchTerm) ||
      String(project.domain_name || "").toLowerCase().includes(searchTerm);
    const matchesTemplate = !templateFilter || project.template_id === templateFilter;
    const matchesStatus = !statusFilter || getProjectWorkflowStatus(project) === statusFilter;

    return matchesSearch && matchesTemplate && matchesStatus;
  });

  displayProjects(filtered);
}

async function updateProjectWorkflowStatus(projectId, status) {
  if (!["pending", "ongoing", "completed", "terminated"].includes(status)) {
    return;
  }

  const project = allProjects.find((entry) => entry.id === projectId);
  if (!project) {
    return;
  }

  try {
    const nextSiteConfig = {
      ...(project.site_config || {}),
      project_status: status,
    };

    const latestOrder = getLatestProjectOrder(project);
    const projectUpdate = supabaseClient.from("projects").update({ site_config: nextSiteConfig }).eq("id", projectId);
    const updates = [projectUpdate];

    if (latestOrder?.id) {
      updates.push(
        supabaseClient
          .from("orders")
          .update({ status: getProjectOrderStatusForWorkflow(status) })
          .eq("id", latestOrder.id)
      );
    }

    const results = await Promise.all(updates);
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) {
      throw firstError;
    }

    await Promise.all([loadProjects(), loadOrders(), loadDashboardData()]);

    if (document.getElementById("projectDetailsModal")?.classList.contains("show")) {
      viewProjectDetails(projectId);
    }
  } catch (error) {
    console.error("Error updating project status:", error);
    alert(`Error updating project status: ${error.message || "Unknown error"}`);
  }
}

async function loadCoupons() {
  try {
    const { data, error } = await supabaseClient.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) {
      throw error;
    }

    allCoupons = data || [];
    displayCoupons(allCoupons);
  } catch (error) {
    console.error("Error loading coupons:", error);
    displayCoupons([]);
  }
}

function displayCoupons(coupons) {
  const tbody = document.getElementById("couponsTableBody");

  if (!coupons.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No coupons found</td></tr>';
    syncResponsiveTableLabels();
    return;
  }

  tbody.innerHTML = coupons
    .map((coupon) => {
      const usage = coupon.max_uses ? `${coupon.current_uses || 0} / ${coupon.max_uses}` : `${coupon.current_uses || 0} / Unlimited`;
      const expiryDate = coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : "Never";
      const statusStyle = coupon.is_active
        ? "background: rgba(16, 185, 129, 0.1); color: var(--success);"
        : "background: rgba(107, 114, 128, 0.1); color: var(--gray);";

      return `
        <tr>
          <td><strong>${escapeHtml(coupon.coupon_code)}</strong></td>
          <td>${formatCouponDiscount(coupon)}</td>
          <td>${escapeHtml(usage)}</td>
          <td>${escapeHtml(expiryDate)}</td>
          <td><span style="${statusStyle} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${coupon.is_active ? "Active" : "Inactive"}</span></td>
          <td>${escapeHtml(coupon.created_at ? new Date(coupon.created_at).toLocaleDateString() : "Unknown date")}</td>
          <td><button class="btn btn-danger" type="button" data-action="delete-coupon" data-coupon-id="${escapeHtml(coupon.id)}">Delete</button></td>
        </tr>
      `;
    })
    .join("");

  syncResponsiveTableLabels();
}

function filterCoupons() {
  const searchTerm = document.getElementById("couponFilter").value.toLowerCase();
  const statusFilter = document.getElementById("couponStatusFilter").value;

  const filtered = allCoupons.filter((coupon) => {
    const matchesSearch = String(coupon.coupon_code || "").toLowerCase().includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = coupon.is_active && (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date());
    } else if (statusFilter === "expired") {
      matchesStatus = Boolean(coupon.expiry_date) && new Date(coupon.expiry_date) <= new Date();
    } else if (statusFilter === "inactive") {
      matchesStatus = !coupon.is_active;
    }

    return matchesSearch && matchesStatus;
  });

  displayCoupons(filtered);
}

async function submitCreateCoupon() {
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  const discountType = String(document.getElementById("couponDiscountType").value || "percentage").trim().toLowerCase();
  const discount = Number.parseFloat(document.getElementById("couponDiscount").value);
  const maxUsesRaw = document.getElementById("couponMaxUses").value;
  const expiryRaw = document.getElementById("couponExpiry").value;
  const isFixedDiscount = discountType === "fixed";

  if (!code) {
    alert("Please enter a coupon code.");
    return;
  }

  if (!Number.isFinite(discount) || discount <= 0) {
    alert(`Please enter a valid ${isFixedDiscount ? "amount" : "percentage"} discount.`);
    return;
  }

  if (!isFixedDiscount && discount > 100) {
    alert("Percentage discount cannot be more than 100.");
    return;
  }

  try {
    const payload = {
      coupon_code: code,
      discount_percentage: isFixedDiscount ? null : discount,
      discount_type: isFixedDiscount ? "fixed" : "percentage",
      discount_value: discount,
      max_uses: maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null,
      expiry_date: expiryRaw ? new Date(expiryRaw).toISOString() : null,
      is_active: true,
      created_by: currentUser.id,
    };

    let { error } = await supabaseClient.from("coupons").insert(payload);
    if (
      error &&
      !isFixedDiscount &&
      /discount_(type|value)|column .* does not exist|schema cache/i.test(String(error.message || ""))
    ) {
      ({ error } = await supabaseClient.from("coupons").insert({
        coupon_code: code,
        discount_percentage: discount,
        max_uses: maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null,
        expiry_date: expiryRaw ? new Date(expiryRaw).toISOString() : null,
        is_active: true,
        created_by: currentUser.id,
      }));
    }

    if (error) {
      throw error;
    }

    alert("Coupon created successfully");
    document.getElementById("createCouponForm").reset();
    toggleCouponDiscountInputState();
    closeModal("createCouponModal");
    await Promise.all([loadCoupons(), loadDashboardData()]);
  } catch (error) {
    console.error("Error creating coupon:", error);
    alert(`Error creating coupon: ${error.message || "Unknown error"}`);
  }
}

async function deleteCoupon(couponId, button = null) {
  if (!window.confirm("Are you sure you want to delete this coupon?")) {
    return;
  }

  const originalLabel = button?.textContent;

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Deleting...";
    }

    const { error } = await supabaseClient.from("coupons").delete().eq("id", couponId);
    if (error) {
      throw error;
    }

    alert("Coupon deleted successfully");
    await Promise.all([loadCoupons(), loadDashboardData()]);
  } catch (error) {
    console.error("Error deleting coupon:", error);
    alert(`Error deleting coupon: ${error.message || "Unknown error"}`);
  } finally {
    if (button && button.isConnected) {
      button.disabled = false;
      button.textContent = originalLabel || "Delete";
    }
  }
}

async function loadOrders() {
  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*, profiles(full_name, email, phone), projects(project_name, template_id, site_config)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    allOrders = data || [];
    rebuildOrderSequenceMap(allOrders);
    displayOrders(allOrders);
    syncOrderNotifications(allOrders);
  } catch (error) {
    console.error("Error loading orders:", error);
    displayOrders([]);
  }
}

function getStatusColor(status) {
  const colors = {
    completed: { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)" },
    ongoing: { bg: "rgba(99, 102, 241, 0.1)", color: "var(--primary)" },
    pending: { bg: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" },
    failed: { bg: "rgba(239, 68, 68, 0.1)", color: "var(--danger)" },
    refunded: { bg: "rgba(107, 114, 128, 0.1)", color: "var(--gray)" },
  };

  return colors[status] || colors.pending;
}

function displayOrders(orders) {
  const tbody = document.getElementById("ordersTableBody");

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No orders found</td></tr>';
    syncResponsiveTableLabels();
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusColors = getStatusColor(order.status);
      const orderId = getOrderSequenceNumber(order.id);
      const userEmail = escapeHtml(order.profiles?.email || "Unknown");
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown date";

      return `
        <tr>
          <td><code style="background: var(--gray-light); padding: 2px 6px; border-radius: 4px;">${escapeHtml(String(orderId || ""))}</code></td>
          <td>${userEmail}</td>
          <td>${escapeHtml(formatCurrency(order.amount || 0))}</td>
          <td>${escapeHtml(formatCurrency(order.discount_amount || 0))}</td>
          <td><strong>${escapeHtml(formatCurrency(order.final_amount || 0))}</strong></td>
          <td><span class="${getPaymentStatusClass(order.payment_status)}">${escapeHtml(getPaymentStatusLabel(order.payment_status))}</span></td>
          <td><span style="background: ${statusColors.bg}; color: ${statusColors.color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${escapeHtml(order.status || "pending")}</span></td>
          <td>${escapeHtml(orderDate)}</td>
          <td>
            <div class="table-actions-wrap">
              <button class="btn ${order.payment_status === "paid" ? "btn-secondary" : "btn-success"}" onclick="toggleOrderPaymentStatus('${escapeHtml(order.id)}', '${escapeHtml(order.payment_status || "unpaid")}')">${order.payment_status === "paid" ? "Mark Unpaid" : "Mark Paid"}</button>
              <button class="btn btn-secondary" onclick="viewOrderDetails('${escapeHtml(order.id)}')">View</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  syncResponsiveTableLabels();
}

async function toggleOrderPaymentStatus(orderId, currentPaymentStatus, projectId) {
  const nextPaymentStatus = currentPaymentStatus === "paid" ? "unpaid" : "paid";
  const nextPaymentLabel = nextPaymentStatus === "paid" ? "paid" : "unpaid";

  if (!window.confirm(`Change payment status to ${nextPaymentLabel}?`)) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("orders").update({ payment_status: nextPaymentStatus }).eq("id", orderId);
    if (error) {
      throw error;
    }

    await Promise.all([loadOrders(), loadProjects(), loadDashboardData()]);

    if (projectId) {
      viewProjectDetails(projectId);
    }
  } catch (error) {
    console.error("Error updating payment status:", error);
    alert(`Error updating payment status: ${error.message || "Unknown error"}`);
  }
}

function filterOrders() {
  const searchTerm = document.getElementById("orderFilter").value.toLowerCase();
  const statusFilter = document.getElementById("orderStatusFilter").value;

  const filtered = allOrders.filter((order) => {
    const customer = getOrderCustomerDetails(order);
    const orderNumber = getOrderSequenceNumber(order.id);
    const matchesSearch =
      String(customer.name || "").toLowerCase().includes(searchTerm) ||
      String(customer.email || "").toLowerCase().includes(searchTerm) ||
      String(orderNumber || "").toLowerCase().includes(searchTerm) ||
      String(order.id || "").toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  displayOrders(filtered);
}

async function fetchOrderDetails(orderId) {
  const cachedOrder = allOrders.find((order) => order.id === orderId);
  if (cachedOrder) {
    return cachedOrder;
  }

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*, profiles(full_name, email, phone), projects(project_name, template_id, site_config)")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function viewOrderDetails(orderId) {
  const content = document.getElementById("orderDetailsContent");
  if (!content || !orderId) {
    return;
  }

  content.innerHTML = '<p class="empty-state">Loading order details...</p>';
  openModal("orderDetailsModal");

  try {
    const order = await fetchOrderDetails(orderId);
    if (!order) {
      content.innerHTML = '<p class="empty-state">Order details not found.</p>';
      return;
    }

    content.innerHTML = buildOrderDetailsMarkup(order);
  } catch (error) {
    console.error("Error loading order details:", error);
    content.innerHTML = '<p class="empty-state">Could not load order details.</p>';
  }
}

function exportOrdersCSV() {
  if (!allOrders.length) {
    alert("No orders to export");
    return;
  }

  const rows = allOrders.map((order) => {
    return [
      order.id || "",
      order.profiles?.email || "Unknown",
      Number(order.amount || 0),
      Number(order.discount_amount || 0),
      Number(order.final_amount || 0),
      order.status || "",
      order.created_at ? new Date(order.created_at).toLocaleDateString() : "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = ["Order ID,User Email,Amount,Discount,Final Amount,Status,Date", ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function saveConfig() {
  const stripeKey = document.getElementById("stripeKey").value;
  const stripePubKey = document.getElementById("stripePubKey").value;
  const smtpServer = document.getElementById("smtpServer").value;
  const fromEmail = document.getElementById("fromEmail").value;
  const systemStatus = document.getElementById("systemStatus").value;
  const alertMessage = document.getElementById("alertMessage").value;

  alert("Configuration saved. This demo does not persist secure settings yet.");
  console.log({
    stripeKey: stripeKey ? "***" : "Not set",
    stripePubKey,
    smtpServer,
    fromEmail,
    systemStatus,
    alertMessage,
  });
}
