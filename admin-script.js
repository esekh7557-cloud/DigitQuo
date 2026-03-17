/* ========== ADMIN SCRIPT - Role-Based Access Control ========== */

const supabase = window.supabase;
let currentUser = null;
let allUsers = [];
let allProjects = [];
let allCoupons = [];
let allOrders = [];

// ========== INITIALIZATION & AUTH CHECK ==========
document.addEventListener("DOMContentLoaded", async () => {
  await initializeAdmin();
});

async function initializeAdmin() {
  try {
    // Check if user is logged in and get their profile
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session) {
      redirectToLogin("No session found");
      return;
    }

    const user = sessionData.session.user;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      redirectToLogin("No profile found");
      return;
    }

    // CRUCIAL CHECK: Only allow if role is "admin"
    if (profile.role !== "admin") {
      redirectToLogin("Access Denied: Admin privileges required");
      return;
    }

    currentUser = profile;

    // Hide auth check and show admin panel
    document.getElementById("authCheck").style.display = "none";
    document.getElementById("adminPanel").style.display = "grid";

    // Populate user info in sidebar
    document.getElementById("userName").textContent = profile.full_name || "Admin";
    document.getElementById("userEmail").textContent = profile.email;

    // Setup event listeners
    setupEventListeners();

    // Load initial data
    await loadDashboardData();
    await loadUsers();
    await loadProjects();
    await loadCoupons();
    await loadOrders();
  } catch (error) {
    console.error("Admin initialization error:", error);
    redirectToLogin("Error checking admin status");
  }
}

function redirectToLogin(reason) {
  console.warn("Redirect reason:", reason);
  window.location.href = "login.html";
}

// ========== EVENT LISTENERS SETUP ==========
function setupEventListeners() {
  // Navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      switchSection(section);
    });
  });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Dashboard buttons
  document.getElementById("addUserBtn").addEventListener("click", () => {
    openModal("addUserModal");
  });

  document.getElementById("addProjectBtn").addEventListener("click", () => {
    alert("Create Project feature coming soon");
  });

  document.getElementById("createCouponBtn").addEventListener("click", () => {
    openModal("createCouponModal");
  });

  // Modal controls
  setupModalControls();

  // Forms
  document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitAddUser();
  });

  document.getElementById("submitAddUserBtn").addEventListener("click", async () => {
    document.getElementById("addUserForm").dispatchEvent(new Event("submit"));
  });

  document.getElementById("createCouponForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitCreateCoupon();
  });

  document.getElementById("submitCouponBtn").addEventListener("click", async () => {
    document.getElementById("createCouponForm").dispatchEvent(new Event("submit"));
  });

  // Save config button
  document.getElementById("saveConfigBtn").addEventListener("click", saveConfig);

  // Export orders
  document.getElementById("exportOrdersBtn").addEventListener("click", exportOrdersCSV);

  // Filters
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

// ========== MODAL MANAGEMENT ==========
function setupModalControls() {
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.target.closest(".modal").classList.remove("show");
    });
  });

  document.querySelectorAll(".close-modal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest(".modal").classList.remove("show");
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
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

// ========== SECTION SWITCHING ==========
function switchSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show selected section
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.classList.add("active");
  }

  // Update nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.dataset.section === sectionId) {
      link.classList.add("active");
    }
  });
}

// ========== LOGOUT ==========
async function logout() {
  try {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ========== DASHBOARD DATA ==========
async function loadDashboardData() {
  try {
    // Get total revenue
    const { data: orders } = await supabase.from("orders").select("final_amount").eq("status", "completed");

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.final_amount || 0), 0) || 0;
    document.getElementById("totalRevenue").textContent = `₹${totalRevenue.toLocaleString("en-IN")}`;

    // Get active users
    const { data: users } = await supabase.from("profiles").select("id").eq("is_active", true);

    document.getElementById("activeUsers").textContent = users?.length || 0;

    // Get active sites
    const { data: projects } = await supabase.from("projects").select("id").eq("is_active", true);

    document.getElementById("activeSites").textContent = projects?.length || 0;

    // Recent orders
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, user_id, final_amount, status, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentOrdersHtml = recentOrders?.map((order) => `
      <div class="recent-item" style="padding: 12px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="font-weight: 600; margin: 0; font-size: 13px;">${order.profiles?.email || "Unknown"}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: var(--gray);">${new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <span style="font-weight: 600; color: var(--primary);">₹${(order.final_amount || 0).toLocaleString("en-IN")}</span>
      </div>
    `).join("");

    document.getElementById("recentOrders").innerHTML = recentOrdersHtml || '<p class="empty-state">No recent orders</p>';
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// ========== USER MANAGEMENT ==========
async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    allUsers = data || [];
    displayUsers(allUsers);
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
            ${(user.full_name || "U").charAt(0)}
          </div>
          <span>${user.full_name || "Unknown"}</span>
        </div>
      </td>
      <td>${user.email}</td>
      <td><span style="background: ${user.role === "admin" ? "rgba(239, 68, 68, 0.1); color: var(--danger);" : "rgba(99, 102, 241, 0.1); color: var(--primary);"} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${user.role}</span></td>
      <td>${user.subscription_plan}</td>
      <td><span style="background: ${user.is_active ? "rgba(16, 185, 129, 0.1); color: var(--success);" : "rgba(107, 114, 128, 0.1); color: var(--gray);"} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${user.is_active ? "Active" : "Inactive"}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" onclick="suspendUser('${user.id}')">Suspend</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function filterUsers() {
  const searchTerm = document.getElementById("userFilter").value.toLowerCase();
  const roleFilter = document.getElementById("roleFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const filtered = allUsers.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm) || (user.full_name || "").toLowerCase().includes(searchTerm);

    const matchesRole = !roleFilter || user.role === roleFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" ? user.is_active : !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  displayUsers(filtered);
}

async function submitAddUser() {
  const name = document.getElementById("newUserName").value;
  const email = document.getElementById("newUserEmail").value;
  const role = document.getElementById("newUserRole").value;
  const plan = document.getElementById("newUserPlan").value;

  // Note: In production, this should be handled by backend via Supabase Edge Function
  // to create auth user and profile simultaneously
  alert("Add user feature requires backend integration (Supabase Edge Function)");
  closeModal("addUserModal");
}

async function suspendUser(userId) {
  if (!confirm("Are you sure you want to suspend this user?")) return;

  try {
    await supabase.from("profiles").update({ is_active: false }).eq("id", userId);

    alert("User suspended successfully");
    await loadUsers();
  } catch (error) {
    console.error("Error suspending user:", error);
    alert("Error suspending user");
  }
}

// ========== PROJECT MANAGEMENT ==========
async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allProjects = data || [];
    displayProjects(allProjects);
  } catch (error) {
    console.error("Error loading projects:", error);
  }
}

function displayProjects(projects) {
  const container = document.getElementById("projectsList");

  if (projects.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 40px;">No projects found</p>';
    return;
  }

  container.innerHTML = projects
    .map(
      (project) => `
    <div class="project-card">
      <h4>${project.project_name}</h4>
      <p class="project-meta"><strong>Owner:</strong> ${project.profiles?.email || "Unknown"}</p>
      <p class="project-meta"><strong>Domain:</strong> ${project.domain_name || "Not assigned"}</p>
      <p class="project-meta"><strong>Template:</strong> ${project.template_id}</p>
      <span class="project-status">${project.is_active ? "Active" : "Inactive"}</span>
    </div>
  `
    )
    .join("");
}

function filterProjects() {
  const searchTerm = document.getElementById("projectFilter").value.toLowerCase();
  const templateFilter = document.getElementById("templateFilter").value;

  const filtered = allProjects.filter((project) => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(searchTerm) ||
      (project.domain_name || "").toLowerCase().includes(searchTerm);

    const matchesTemplate = !templateFilter || project.template_id === templateFilter;

    return matchesSearch && matchesTemplate;
  });

  displayProjects(filtered);
}

// ========== COUPON MANAGEMENT ==========
async function loadCoupons() {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allCoupons = data || [];
    displayCoupons(allCoupons);
  } catch (error) {
    console.error("Error loading coupons:", error);
  }
}

function displayCoupons(coupons) {
  const tbody = document.getElementById("couponsTableBody");

  if (coupons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No coupons found</td></tr>';
    return;
  }

  tbody.innerHTML = coupons
    .map(
      (coupon) => `
    <tr>
      <td><strong>${coupon.coupon_code}</strong></td>
      <td>${coupon.discount_percentage}%</td>
      <td>${coupon.current_uses || 0}${coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}</td>
      <td>${coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : "Never"}</td>
      <td><span style="background: ${coupon.is_active ? "rgba(16, 185, 129, 0.1); color: var(--success);" : "rgba(107, 114, 128, 0.1); color: var(--gray);"} padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${coupon.is_active ? "Active" : "Inactive"}</span></td>
      <td>${new Date(coupon.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" onclick="deleteCoupon('${coupon.id}')">Delete</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function filterCoupons() {
  const searchTerm = document.getElementById("couponFilter").value.toLowerCase();
  const statusFilter = document.getElementById("couponStatusFilter").value;

  const filtered = allCoupons.filter((coupon) => {
    const matchesSearch = coupon.coupon_code.toLowerCase().includes(searchTerm);

    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = coupon.is_active && (!coupon.expiry_date || new Date(coupon.expiry_date) > new Date());
    } else if (statusFilter === "expired") {
      matchesStatus = !coupon.is_active || (coupon.expiry_date && new Date(coupon.expiry_date) <= new Date());
    } else if (statusFilter === "inactive") {
      matchesStatus = !coupon.is_active;
    }

    return matchesSearch && matchesStatus;
  });

  displayCoupons(filtered);
}

async function submitCreateCoupon() {
  const code = document.getElementById("couponCode").value;
  const discount = parseFloat(document.getElementById("couponDiscount").value);
  const maxUses = document.getElementById("couponMaxUses").value ? parseInt(document.getElementById("couponMaxUses").value) : null;
  const expiry = document.getElementById("couponExpiry").value ? new Date(document.getElementById("couponExpiry").value) : null;

  try {
    await supabase.from("coupons").insert({
      coupon_code: code.toUpperCase(),
      discount_percentage: discount,
      max_uses: maxUses,
      expiry_date: expiry,
      is_active: true,
      created_by: currentUser.id,
    });

    alert("Coupon created successfully!");
    closeModal("createCouponModal");
    document.getElementById("createCouponForm").reset();
    await loadCoupons();
  } catch (error) {
    console.error("Error creating coupon:", error);
    alert("Error creating coupon: " + error.message);
  }
}

async function deleteCoupon(couponId) {
  if (!confirm("Are you sure you want to delete this coupon?")) return;

  try {
    await supabase.from("coupons").delete().eq("id", couponId);

    alert("Coupon deleted successfully!");
    await loadCoupons();
  } catch (error) {
    console.error("Error deleting coupon:", error);
    alert("Error deleting coupon");
  }
}

// ========== ORDER MANAGEMENT ==========
async function loadOrders() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    allOrders = data || [];
    displayOrders(allOrders);
  } catch (error) {
    console.error("Error loading orders:", error);
  }
}

function displayOrders(orders) {
  const tbody = document.getElementById("ordersTableBody");

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = orders
    .map(
      (order) => `
    <tr>
      <td><code style="background: var(--gray-light); padding: 2px 6px; border-radius: 4px;">${order.id.substring(0, 8)}</code></td>
      <td>${order.profiles?.email || "Unknown"}</td>
      <td>₹${(order.amount || 0).toLocaleString("en-IN")}</td>
      <td>₹${(order.discount_amount || 0).toLocaleString("en-IN")}</td>
      <td><strong>₹${(order.final_amount || 0).toLocaleString("en-IN")}</strong></td>
      <td><span style="background: ${getStatusColor(order.status).bg}; color: ${getStatusColor(order.status).color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${order.status}</span></td>
      <td>${new Date(order.created_at).toLocaleDateString()}</td>
      <td><button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">View</button></td>
    </tr>
  `
    )
    .join("");
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

function filterOrders() {
  const searchTerm = document.getElementById("orderFilter").value.toLowerCase();
  const statusFilter = document.getElementById("orderStatusFilter").value;

  const filtered = allOrders.filter((order) => {
    const matchesSearch =
      (order.profiles?.email || "").toLowerCase().includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm);

    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  displayOrders(filtered);
}

function viewOrderDetails(orderId) {
  alert("Order details view coming soon");
}

function exportOrdersCSV() {
  if (allOrders.length === 0) {
    alert("No orders to export");
    return;
  }

  let csv = "Order ID,User Email,Amount,Discount,Final Amount,Status,Date\n";
  allOrders.forEach((order) => {
    csv += `"${order.id}","${order.profiles?.email || "Unknown"}","${order.amount || 0}","${order.discount_amount || 0}","${order.final_amount || 0}","${order.status}","${new Date(order.created_at).toLocaleDateString()}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ========== CONFIGURATION ==========
async function saveConfig() {
  const stripeKey = document.getElementById("stripeKey").value;
  const stripePubKey = document.getElementById("stripePubKey").value;
  const smtpServer = document.getElementById("smtpServer").value;
  const fromEmail = document.getElementById("fromEmail").value;
  const systemStatus = document.getElementById("systemStatus").value;
  const alertMessage = document.getElementById("alertMessage").value;

  // In production, these should be saved to a secure config table or Supabase Vault
  alert("Configuration saved! (Demo - not persisted in this example)");
  console.log({
    stripeKey: stripeKey ? "***" : "Not set",
    stripePubKey,
    smtpServer,
    fromEmail,
    systemStatus,
    alertMessage,
  });
}

// ========== UTILITY FUNCTIONS ==========
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
  }
}

// Load initial data on page load
document.addEventListener("DOMContentLoaded", () => {
  // Additional setup if needed
});
