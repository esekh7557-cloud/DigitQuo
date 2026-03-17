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

  setupEventListeners();

  await Promise.all([loadDashboardData(), loadUsers(), loadProjects(), loadCoupons(), loadOrders()]);
}

function redirectToLogin(reason) {
  console.warn("Redirect reason:", reason);
  window.location.href = "login.html";
}

function setupEventListeners() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("addUserBtn").addEventListener("click", () => openModal("addUserModal"));
  document.getElementById("addProjectBtn").addEventListener("click", () => {
    alert("Create Project feature requires a dedicated backend workflow.");
  });
  document.getElementById("createCouponBtn").addEventListener("click", () => openModal("createCouponModal"));

  setupModalControls();

  document.getElementById("addUserForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitAddUser();
  });
  document.getElementById("submitAddUserBtn").addEventListener("click", () => {
    document.getElementById("addUserForm").requestSubmit();
  });

  document.getElementById("createCouponForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitCreateCoupon();
  });
  document.getElementById("submitCouponBtn").addEventListener("click", () => {
    document.getElementById("createCouponForm").requestSubmit();
  });

  document.getElementById("saveConfigBtn").addEventListener("click", saveConfig);
  document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCSV);

  document.getElementById("userFilter").addEventListener("input", filterUsers);
  document.getElementById("roleFilter").addEventListener("change", filterUsers);
  document.getElementById("statusFilter").addEventListener("change", filterUsers);
  document.getElementById("projectFilter").addEventListener("input", filterProjects);
  document.getElementById("templateFilter").addEventListener("change", filterProjects);
  document.getElementById("couponFilter").addEventListener("input", filterCoupons);
  document.getElementById("couponStatusFilter").addEventListener("change", filterCoupons);
  document.getElementById("orderFilter").addEventListener("input", filterOrders);
  document.getElementById("orderStatusFilter").addEventListener("change", filterOrders);
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
    const [ordersResponse, usersResponse, projectsResponse, recentOrdersResponse] = await Promise.all([
      supabaseClient.from("orders").select("final_amount").eq("status", "completed"),
      supabaseClient.from("profiles").select("id").eq("is_active", true),
      supabaseClient.from("projects").select("id").eq("is_active", true),
      supabaseClient
        .from("orders")
        .select("id, user_id, final_amount, status, created_at, profiles(email)")
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
    if (recentOrdersResponse.error) {
      throw recentOrdersResponse.error;
    }

    const totalRevenue = (ordersResponse.data || []).reduce((sum, order) => {
      return sum + Number(order.final_amount || 0);
    }, 0);

    document.getElementById("totalRevenue").textContent = formatCurrency(totalRevenue);
    document.getElementById("activeUsers").textContent = String((usersResponse.data || []).length);
    document.getElementById("activeSites").textContent = String((projectsResponse.data || []).length);

    const recentOrdersHtml = (recentOrdersResponse.data || [])
      .map((order) => {
        const email = escapeHtml(order.profiles?.email || "Unknown");
        const createdAt = order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown date";
        return `
          <div class="recent-item" style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-weight: 600; margin: 0; font-size: 13px;">${email}</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: var(--gray);">${escapeHtml(createdAt)}</p>
            </div>
            <span style="font-weight: 600; color: var(--primary);">${escapeHtml(formatCurrency(order.final_amount || 0))}</span>
          </div>
        `;
      })
      .join("");

    document.getElementById("recentOrders").innerHTML =
      recentOrdersHtml || '<p class="empty-state">No recent orders</p>';
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    document.getElementById("recentOrders").innerHTML =
      '<p class="empty-state">Dashboard data could not be loaded.</p>';
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
  } catch (error) {
    console.error("Error loading users:", error);
    displayUsers([]);
  }
}

function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map((user) => {
      const fullName = escapeHtml(user.full_name || "Unknown");
      const email = escapeHtml(user.email || "");
      const role = escapeHtml(user.role || "customer");
      const plan = escapeHtml(user.subscription_plan || "free");
      const joined = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown date";
      const roleStyle =
        user.role === "admin"
          ? "background: rgba(239, 68, 68, 0.1); color: var(--danger);"
          : "background: rgba(99, 102, 241, 0.1); color: var(--primary);";
      const statusStyle = user.is_active
        ? "background: rgba(16, 185, 129, 0.1); color: var(--success);"
        : "background: rgba(107, 114, 128, 0.1); color: var(--gray);";

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
          <td><button class="btn btn-danger" onclick="suspendUser('${escapeHtml(user.id)}')">Suspend</button></td>
        </tr>
      `;
    })
    .join("");
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
  alert("Add user requires a secure backend or Supabase Edge Function. Public-browser creation is disabled for safety.");
  closeModal("addUserModal");
}

async function suspendUser(userId) {
  if (!window.confirm("Are you sure you want to suspend this user?")) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("profiles").update({ is_active: false }).eq("id", userId);
    if (error) {
      throw error;
    }

    alert("User suspended successfully");
    await loadUsers();
  } catch (error) {
    console.error("Error suspending user:", error);
    alert(`Error suspending user: ${error.message || "Unknown error"}`);
  }
}

async function loadProjects() {
  try {
    const { data, error } = await supabaseClient
      .from("projects")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    allProjects = data || [];
    displayProjects(allProjects);
  } catch (error) {
    console.error("Error loading projects:", error);
    displayProjects([]);
  }
}

function displayProjects(projects) {
  const container = document.getElementById("projectsList");

  if (!projects.length) {
    container.innerHTML = '<p class="empty-state" style="padding: 40px;">No projects found</p>';
    return;
  }

  container.innerHTML = projects
    .map((project) => {
      const projectName = escapeHtml(project.project_name || "Untitled Project");
      const owner = escapeHtml(project.profiles?.email || "Unknown");
      const domain = escapeHtml(project.domain_name || "Not assigned");
      const templateId = escapeHtml(project.template_id || "basic");
      const statusClass = project.is_active ? "Active" : "Inactive";

      return `
        <div class="project-card">
          <h4>${projectName}</h4>
          <p class="project-meta"><strong>Owner:</strong> ${owner}</p>
          <p class="project-meta"><strong>Domain:</strong> ${domain}</p>
          <p class="project-meta"><strong>Template:</strong> ${templateId}</p>
          <span class="project-status">${statusClass}</span>
        </div>
      `;
    })
    .join("");
}

function filterProjects() {
  const searchTerm = document.getElementById("projectFilter").value.toLowerCase();
  const templateFilter = document.getElementById("templateFilter").value;

  const filtered = allProjects.filter((project) => {
    const matchesSearch =
      String(project.project_name || "").toLowerCase().includes(searchTerm) ||
      String(project.domain_name || "").toLowerCase().includes(searchTerm);
    const matchesTemplate = !templateFilter || project.template_id === templateFilter;

    return matchesSearch && matchesTemplate;
  });

  displayProjects(filtered);
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
          <td>${escapeHtml(String(coupon.discount_percentage || 0))}%</td>
          <td>${escapeHtml(usage)}</td>
          <td>${escapeHtml(expiryDate)}</td>
          <td><span style="${statusStyle} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${coupon.is_active ? "Active" : "Inactive"}</span></td>
          <td>${escapeHtml(coupon.created_at ? new Date(coupon.created_at).toLocaleDateString() : "Unknown date")}</td>
          <td><button class="btn btn-danger" onclick="deleteCoupon('${escapeHtml(coupon.id)}')">Delete</button></td>
        </tr>
      `;
    })
    .join("");
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
  const discount = Number.parseFloat(document.getElementById("couponDiscount").value);
  const maxUsesRaw = document.getElementById("couponMaxUses").value;
  const expiryRaw = document.getElementById("couponExpiry").value;

  try {
    const { error } = await supabaseClient.from("coupons").insert({
      coupon_code: code,
      discount_percentage: discount,
      max_uses: maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null,
      expiry_date: expiryRaw ? new Date(expiryRaw).toISOString() : null,
      is_active: true,
      created_by: currentUser.id,
    });

    if (error) {
      throw error;
    }

    alert("Coupon created successfully");
    document.getElementById("createCouponForm").reset();
    closeModal("createCouponModal");
    await loadCoupons();
  } catch (error) {
    console.error("Error creating coupon:", error);
    alert(`Error creating coupon: ${error.message || "Unknown error"}`);
  }
}

async function deleteCoupon(couponId) {
  if (!window.confirm("Are you sure you want to delete this coupon?")) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("coupons").delete().eq("id", couponId);
    if (error) {
      throw error;
    }

    alert("Coupon deleted successfully");
    await loadCoupons();
  } catch (error) {
    console.error("Error deleting coupon:", error);
    alert(`Error deleting coupon: ${error.message || "Unknown error"}`);
  }
}

async function loadOrders() {
  try {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    allOrders = data || [];
    displayOrders(allOrders);
  } catch (error) {
    console.error("Error loading orders:", error);
    displayOrders([]);
  }
}

function getStatusColor(status) {
  const colors = {
    completed: { bg: "rgba(16, 185, 129, 0.1)", color: "var(--success)" },
    pending: { bg: "rgba(245, 158, 11, 0.1)", color: "var(--warning)" },
    failed: { bg: "rgba(239, 68, 68, 0.1)", color: "var(--danger)" },
    refunded: { bg: "rgba(107, 114, 128, 0.1)", color: "var(--gray)" },
  };

  return colors[status] || colors.pending;
}

function displayOrders(orders) {
  const tbody = document.getElementById("ordersTableBody");

  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusColors = getStatusColor(order.status);
      const orderId = escapeHtml(String(order.id || "").slice(0, 8));
      const userEmail = escapeHtml(order.profiles?.email || "Unknown");
      const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown date";

      return `
        <tr>
          <td><code style="background: var(--gray-light); padding: 2px 6px; border-radius: 4px;">${orderId}</code></td>
          <td>${userEmail}</td>
          <td>${escapeHtml(formatCurrency(order.amount || 0))}</td>
          <td>${escapeHtml(formatCurrency(order.discount_amount || 0))}</td>
          <td><strong>${escapeHtml(formatCurrency(order.final_amount || 0))}</strong></td>
          <td><span style="background: ${statusColors.bg}; color: ${statusColors.color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${escapeHtml(order.status || "pending")}</span></td>
          <td>${escapeHtml(orderDate)}</td>
          <td><button class="btn btn-secondary" onclick="viewOrderDetails('${escapeHtml(order.id)}')">View</button></td>
        </tr>
      `;
    })
    .join("");
}

function filterOrders() {
  const searchTerm = document.getElementById("orderFilter").value.toLowerCase();
  const statusFilter = document.getElementById("orderStatusFilter").value;

  const filtered = allOrders.filter((order) => {
    const matchesSearch =
      String(order.profiles?.email || "").toLowerCase().includes(searchTerm) ||
      String(order.id || "").toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  displayOrders(filtered);
}

function viewOrderDetails() {
  alert("Order details view is not implemented yet.");
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
