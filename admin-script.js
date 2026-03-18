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
const MOBILE_ADMIN_BREAKPOINT = 1024;

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
    Boolean(getLatestProjectOrder(project))
  );
}

function getProjectWorkflowStatus(project) {
  const latestOrderStatus = String(getLatestProjectOrder(project)?.status || "").trim().toLowerCase();
  if (latestOrderStatus === "pending" || latestOrderStatus === "ongoing" || latestOrderStatus === "completed") {
    return latestOrderStatus;
  }

  const projectStatus = String(project?.site_config?.project_status || "pending").trim().toLowerCase();
  if (projectStatus === "ongoing" || projectStatus === "completed") {
    return projectStatus;
  }

  return "pending";
}

function getProjectWorkflowStatusLabel(status) {
  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
  };

  return labels[String(status || "").trim()] || "Pending";
}

function getProjectWorkflowStatusClass(status) {
  const classes = {
    pending: "project-status project-status-pending",
    ongoing: "project-status project-status-ongoing",
    completed: "project-status project-status-completed",
  };

  return classes[String(status || "").trim()] || "project-status project-status-pending";
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
  document.getElementById("projectStatusFilter").addEventListener("change", filterProjects);
  document.getElementById("couponFilter").addEventListener("input", filterCoupons);
  document.getElementById("couponStatusFilter").addEventListener("change", filterCoupons);
  document.getElementById("orderFilter").addEventListener("input", filterOrders);
  document.getElementById("orderStatusFilter").addEventListener("change", filterOrders);

  setSidebarState(false);
  syncResponsiveTableLabels();
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
          <td><button class="${actionClass}" onclick="setUserStatus('${escapeHtml(user.id)}', ${nextStatus})">${actionLabel}</button></td>
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
    await loadUsers();
  } catch (error) {
    console.error("Error creating user:", error);
    alert(`Error creating user: ${error.message || "Unknown error"}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create User";
  }
}

async function setUserStatus(userId, shouldActivate) {
  const action = shouldActivate ? "unsuspend" : "suspend";
  if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  try {
    const { error } = await supabaseClient.from("profiles").update({ is_active: shouldActivate }).eq("id", userId);
    if (error) {
      throw error;
    }

    alert(`User ${shouldActivate ? "unsuspended" : "suspended"} successfully`);
    await loadUsers();
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

  if (!activeContainer || !completedContainer) {
    return;
  }

  if (!projects.length) {
    activeContainer.innerHTML = '<p class="empty-state" style="padding: 40px;">No projects found</p>';
    completedContainer.innerHTML = '<p class="empty-state" style="padding: 40px;">No completed projects found</p>';
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

  const activeProjects = projects.filter((project) => getProjectWorkflowStatus(project) !== "completed");
  const completedProjects = projects.filter((project) => getProjectWorkflowStatus(project) === "completed");

  activeContainer.innerHTML = activeProjects.length
    ? activeProjects.map(renderProjectCard).join("")
    : '<p class="empty-state" style="padding: 40px;">No active projects found</p>';

  completedContainer.innerHTML = completedProjects.length
    ? completedProjects.map(renderProjectCard).join("")
    : '<p class="empty-state" style="padding: 40px;">No completed projects found</p>';
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
          </select>
        </div>
      </section>
      ${
        showBasicRequirements
          ? buildProjectDetailSection("Basic Plan Requirements", [
              { label: "Describe your website idea", value: requirements.basic?.websiteIdea },
              { label: "Business details to show (About / Services / Contact)", value: requirements.basic?.businessDetails },
              { label: "Number of pages required (Up to 5)", value: requirements.basic?.pageCount },
            ])
          : ""
      }
      ${
        showBusinessRequirements
          ? buildProjectDetailSection("Business Plan Requirements", [
              { label: "Additional pages or sections required (Gallery / Testimonials / FAQ / Team / Offers etc.)", value: requirements.business?.additionalSections },
              { label: "Do you need Blog setup?", value: requirements.business?.needsBlog },
              { label: "Do you need Google Map integration?", value: requirements.business?.needsGoogleMap },
              { label: "Do you need Basic SEO setup?", value: requirements.business?.needsBasicSeo },
            ])
          : ""
      }
      ${
        showProfessionalRequirements
          ? buildProjectDetailSection("Professional Plan Requirements", [
              { label: "Do you need custom UI/UX design or reference websites?", value: professional.designReference },
              { label: "Advanced features required", value: professional.features },
              { label: "Other", value: professional.otherFeature },
              { label: "Approx total pages / modules required", value: professional.approxPagesModules },
            ])
          : ""
      }
      ${
        showEcommerceRequirements
          ? buildProjectDetailSection("Ecommerce Plan Requirements", [
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
          ? buildProjectDetailSection("Advanced Ecommerce Plan Requirements", [
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
  if (!["pending", "ongoing", "completed"].includes(status)) {
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
      updates.push(supabaseClient.from("orders").update({ status }).eq("id", latestOrder.id));
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
