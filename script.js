const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const mobileLogin = document.querySelector(".mobile-login");
const navCta = document.querySelector(".nav-cta");
const navbar = document.querySelector(".navbar");
const contactForm = document.getElementById("contactForm");
const cartItems = document.getElementById("cartItems");
const cartSummary = document.getElementById("cartSummary");
const CART_STORAGE_KEY = "dq_cart_items";
const dqAuth = window.dqAuth;

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name") || "";
    const email = formData.get("email") || "";
    const phone = formData.get("phone") || "";
    const message = formData.get("message") || "";

    const subject = encodeURIComponent(`New Website Inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:digitquo@gmail.com?subject=${subject}&body=${body}`;
  });
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";
}

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

function renderAvatar(name, profilePhoto, className = "avatar-photo") {
  if (profilePhoto) {
    return `<img src="${escapeHtml(profilePhoto)}" alt="${escapeHtml(name)}" class="${className}" />`;
  }

  return escapeHtml(getInitials(name));
}

function getPhotoSourceLabel(profilePhoto) {
  if (!profilePhoto) {
    return "";
  }

  return profilePhoto.startsWith("data:image/")
    ? "Uploaded from device"
    : "Linked from image URL";
}

function buildProfileMenu(user) {
  if (!navbar) {
    return;
  }

  if (mobileLogin) {
    mobileLogin.classList.add("is-hidden");
  }

  if (navCta) {
    navCta.classList.add("is-hidden");
  }

  const userMenu = document.createElement("div");
  userMenu.className = "user-menu";
  userMenu.innerHTML = `
    <button class="btn user-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Open profile menu">
      ${renderAvatar(user.fullName, user.profilePhoto)}
    </button>
    <div class="user-panel">
      <div class="user-panel-header">
        <div class="user-avatar">${renderAvatar(user.fullName, user.profilePhoto)}</div>
        <div>
          <h3>${escapeHtml(user.fullName)}</h3>
          <p>${escapeHtml(user.email)}</p>
        </div>
      </div>
      <div class="user-panel-body">
        <div class="profile-item">
          <span>Name</span>
          <strong>${escapeHtml(user.fullName)}</strong>
        </div>
        <div class="profile-item">
          <span>Phone</span>
          <strong>${escapeHtml(user.phone || "Not added yet")}</strong>
        </div>
      </div>
      <div class="user-panel-actions">
        <a class="btn btn-secondary" href="profile.html">Profile</a>
        <a class="btn btn-secondary" href="cart.html">Cart</a>
        <button class="btn btn-primary" type="button" id="logoutBtn">Logout</button>
      </div>
    </div>
  `;

  navbar.appendChild(userMenu);

  const trigger = userMenu.querySelector(".user-trigger");
  const logoutBtn = userMenu.querySelector("#logoutBtn");

  trigger.addEventListener("click", () => {
    const isOpen = userMenu.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!userMenu.contains(event.target)) {
      userMenu.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      if (dqAuth && dqAuth.isConfigured()) {
        await dqAuth.signOut();
      }
    } finally {
      window.location.href = "login.html";
    }
  });
}

function readCartItems() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const items = JSON.parse(raw || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function renderCartPage(user) {
  if (!cartItems || !cartSummary) {
    return;
  }

  const items = readCartItems();

  if (!user) {
    cartItems.innerHTML = `
      <article class="card cart-empty">
        <h2>Please log in</h2>
        <p>You need to sign in before viewing your cart and saved profile details.</p>
        <a href="login.html" class="btn btn-primary">Go to Login</a>
      </article>
    `;
    cartSummary.innerHTML = `
      <article class="card">
        <h3>Cart Summary</h3>
        <p>Sign in to manage your cart.</p>
      </article>
    `;
    return;
  }

  if (!items.length) {
    cartItems.innerHTML = `
      <article class="card cart-empty">
        <h2>Your cart is empty</h2>
        <p>${escapeHtml(user.fullName)}, you have no saved website packages in your cart yet.</p>
        <a href="pricing.html" class="btn btn-primary">Browse Pricing</a>
      </article>
    `;
  } else {
    cartItems.innerHTML = items
      .map(
        (item) => `
          <article class="card cart-item">
            <div>
              <h3>${escapeHtml(item.title || "Website Package")}</h3>
              <p>${escapeHtml(item.description || "Saved from your recent visit.")}</p>
            </div>
            <div class="cart-price">${escapeHtml(item.price || "Custom")}</div>
          </article>
        `
      )
      .join("");
  }

  cartSummary.innerHTML = `
    <article class="card cart-meta">
      <h3>Profile Snapshot</h3>
      <p><strong>Name:</strong> ${escapeHtml(user.fullName)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(user.phone || "Not added yet")}</p>
      <p><strong>Items:</strong> ${items.length}</p>
      <a href="contact.html" class="btn btn-primary">Request Checkout</a>
    </article>
  `;
}

function renderProfilePage(user) {
  const profileRoot = document.getElementById("profileContent");
  if (!profileRoot) {
    return;
  }

  if (!user) {
    profileRoot.innerHTML = `
      <article class="card cart-empty">
        <h2>Please log in</h2>
        <p>You need to sign in before opening your profile.</p>
        <a href="login.html" class="btn btn-primary">Go to Login</a>
      </article>
    `;
    return;
  }

  profileRoot.innerHTML = `
    <div class="profile-grid">
      <aside class="profile-sidebar">
        <article class="card profile-card-head">
          <div class="profile-photo-frame">${renderAvatar(user.fullName, user.profilePhoto)}</div>
          <div>
            <h2>${escapeHtml(user.fullName)}</h2>
            <p>${escapeHtml(user.email)}</p>
          </div>
          <a href="cart.html" class="btn btn-secondary">Open Cart</a>
        </article>
      </aside>
      <div class="profile-main">
        <article class="card profile-section">
          <h3>Account Details</h3>
          <div class="profile-item">
            <span>Full Name</span>
            <strong>${escapeHtml(user.fullName)}</strong>
          </div>
          <div class="profile-item">
            <span>Email</span>
            <strong>${escapeHtml(user.email)}</strong>
          </div>
          <div class="profile-item">
            <span>Phone</span>
            <strong>${escapeHtml(user.phone || "Not added yet")}</strong>
          </div>
        </article>
        <article class="card profile-section">
          <h3>Profile Photo</h3>
          <p>${user.profilePhoto ? "This image is shown in your site header and profile card." : "No profile photo was added during registration yet."}</p>
          ${
            user.profilePhoto
              ? `<div class="profile-item"><span>Photo Source</span><strong>${escapeHtml(getPhotoSourceLabel(user.profilePhoto))}</strong></div>`
              : ""
          }
        </article>
      </div>
    </div>
  `;
}

async function initAuthUi() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    renderCartPage(null);
    renderProfilePage(null);
    return;
  }

  try {
    const user = await dqAuth.getCurrentUser();
    if (!user) {
      renderCartPage(null);
      renderProfilePage(null);
      return;
    }

    buildProfileMenu(user);
    renderCartPage(user);
    renderProfilePage(user);
  } catch {
    renderCartPage(null);
    renderProfilePage(null);
  }
}

initAuthUi();
