const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const mobileLogin = document.querySelector(".mobile-login");
const navCta = document.querySelector(".nav-cta");
const navbar = document.querySelector(".navbar");
const contactForm = document.getElementById("contactForm");
const portfolioQuoteLink = document.getElementById("portfolioQuoteLink");
const quoteRequestForm = document.getElementById("quoteRequestForm");
const cartItems = document.getElementById("cartItems");
const cartSummary = document.getElementById("cartSummary");
const planDetailsRoot = document.getElementById("planDetailsRoot");
const quoteRequestRoot = document.getElementById("quoteRequestRoot");
const CART_STORAGE_KEY = "dq_cart_items";
const dqAuth = window.dqAuth;
const PLAN_DETAILS = {
  basic: {
    name: "Basic Plan",
    oldPrice: 13999,
    subtotal: 11999,
    domainPrice: 999,
    features: [
      "1-3 Pages Website",
      "Mobile Responsive",
      "Contact Form",
      "Free SSL",
      ".in Domain",
      "Hosting",
    ],
  },
  business: {
    name: "Business Plan",
    oldPrice: 15999,
    subtotal: 12999,
    domainPrice: 999,
    features: [
      "5-7 Pages Website",
      "Professional Design",
      "Contact Forms",
      "Google Map",
      "Basic SEO",
      "Domain + Hosting",
    ],
  },
  professional: {
    name: "Professional Plan",
    oldPrice: 17999,
    subtotal: 13999,
    domainPrice: 999,
    features: [
      "8-12 Pages Website",
      "Premium UI Design",
      "Blog System",
      "SEO Setup",
      "Social Media Integration",
      "Domain + Hosting",
    ],
  },
  ecommerce: {
    name: "E-Commerce Plan",
    oldPrice: 41000,
    subtotal: 32999,
    domainPrice: 999,
    features: [
      "Online Store",
      "Up to 50 Products",
      "Payment Gateway",
      "Cart & Checkout",
      "Admin Panel",
      "VPS Hosting",
      "Domain",
    ],
  },
  "advanced-ecommerce": {
    name: "Advanced E-Commerce Plan",
    oldPrice: 50000,
    subtotal: 39999,
    domainPrice: 999,
    features: [
      "Unlimited Products",
      "Advanced Admin Panel",
      "Payment Gateway",
      "Coupons",
      "Shipping Integration",
      "VPS Hosting",
      "Domain",
    ],
  },
};

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
applyImageFallbacks();

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name") || "";
    const email = formData.get("email") || "";
    const company = formData.get("company") || "";
    const phone = formData.get("phone") || "";
    const service = formData.get("service") || "";
    const message = formData.get("message") || "";

    const subject = encodeURIComponent(`New Website Inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nPhone: ${phone}\nInterested In: ${service}\n\nProject Goals:\n${message}`
    );

    window.location.href = `mailto:digitquo@gmail.com?subject=${subject}&body=${body}`;
  });
}

if (quoteRequestForm) {
  quoteRequestForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(quoteRequestForm);
    const fullName = formData.get("fullName") || "";
    const email = formData.get("email") || "";
    const phone = formData.get("phone") || "";
    const businessName = formData.get("businessName") || "";
    const websiteType = formData.get("websiteType") || "";
    const pageCount = formData.get("pageCount") || "";
    const budget = formData.get("budget") || "";
    const timeline = formData.get("timeline") || "";
    const features = formData.get("features") || "";
    const message = formData.get("message") || "";

    const subject = encodeURIComponent(`Website Quote Request from ${fullName || "DigitQuo Client"}`);
    const body = encodeURIComponent(
      `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nBusiness Name: ${businessName}\nWebsite Type: ${websiteType}\nEstimated Pages: ${pageCount}\nBudget Range: ${budget}\nPreferred Timeline: ${timeline}\nKey Features: ${features}\n\nProject Details:\n${message}`
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

function formatInr(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function createImageFallbackDataUrl(label) {
  const safeLabel = String(label || "DigitQuo")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${safeLabel}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5f3ff" />
          <stop offset="100%" stop-color="#ede9fe" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#bg)" />
      <circle cx="950" cy="180" r="140" fill="#ddd6fe" opacity="0.65" />
      <circle cx="240" cy="620" r="170" fill="#c4b5fd" opacity="0.35" />
      <rect x="150" y="170" width="900" height="460" rx="36" fill="#ffffff" stroke="#d8b4fe" stroke-width="3" />
      <text x="600" y="360" text-anchor="middle" fill="#5b21b6" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700">DigitQuo</text>
      <text x="600" y="425" text-anchor="middle" fill="#7c3aed" font-family="Inter, Arial, sans-serif" font-size="26">${safeLabel}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function applyImageFallbacks(root = document) {
  root.querySelectorAll("img").forEach((img) => {
    if (img.dataset.fallbackBound === "true") {
      return;
    }

    img.dataset.fallbackBound = "true";

    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") {
        return;
      }

      img.dataset.fallbackApplied = "true";
      img.src = createImageFallbackDataUrl(img.alt || "Website preview");
    });
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

  if (navCta && navCta.parentNode) {
    navCta.replaceWith(userMenu);
  } else {
    navbar.appendChild(userMenu);
  }
  applyImageFallbacks(userMenu);

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
  applyImageFallbacks(profileRoot);
}

function renderPlanDetailsPage() {
  if (!planDetailsRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const planKey = params.get("plan") || "";
  const plan = PLAN_DETAILS[planKey];

  if (!plan) {
    planDetailsRoot.innerHTML = `
      <article class="card cart-empty">
        <h1 class="section-title">Plan Not Found</h1>
        <p class="section-subtitle">Select a pricing package first to view the website, domain, and GST breakdown.</p>
        <a href="pricing.html" class="btn btn-primary">Back to Pricing</a>
      </article>
    `;
    return;
  }

  const websitePrice = plan.subtotal - plan.domainPrice;
  const savings = plan.oldPrice - plan.subtotal;

  planDetailsRoot.innerHTML = `
    <div class="plan-layout">
      <article class="card plan-overview">
        <span class="eyebrow">Selected Package</span>
        <h1 class="section-title">${escapeHtml(plan.name)}</h1>
        <p class="section-subtitle">This pricing includes website development and domain registration for the selected package.</p>
        <div class="plan-price-strip">
          <span class="old-price">${formatInr(plan.oldPrice)}</span>
          <strong>${formatInr(plan.subtotal)}</strong>
          <span class="plan-savings">You save ${formatInr(savings)}</span>
        </div>
        <ul class="plan-feature-list">
          ${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
      </article>
      <article class="card plan-summary-card">
        <h2>Price Breakdown</h2>
        <div class="plan-summary-row">
          <span>Website Development</span>
          <strong>${formatInr(websitePrice)}</strong>
        </div>
        <div class="plan-summary-row">
          <span>Domain Registration</span>
          <strong>${formatInr(plan.domainPrice)}</strong>
        </div>
        <div class="plan-summary-row total">
          <span>Total Pricing</span>
          <strong>${formatInr(plan.subtotal)}</strong>
        </div>
        <p class="plan-note">Hosting and listed package features remain included in the selected plan.</p>
        <div class="plan-actions">
          <a href="contact.html" class="btn btn-primary">Proceed to Contact</a>
          <a href="pricing.html" class="btn btn-secondary">Back to Pricing</a>
        </div>
      </article>
    </div>
  `;
}

function bindPortfolioQuoteTrigger(user) {
  if (!portfolioQuoteLink) {
    return;
  }

  portfolioQuoteLink.href = user ? "quote-request.html" : "login.html?redirect=quote-request.html";
}

function renderQuoteRequestPage(user) {
  if (!quoteRequestRoot) {
    return;
  }

  if (!user) {
    window.location.href = "login.html?redirect=quote-request.html";
    return;
  }

  const quoteName = quoteRequestForm?.elements?.namedItem("fullName");
  const quoteEmail = quoteRequestForm?.elements?.namedItem("email");
  const quotePhone = quoteRequestForm?.elements?.namedItem("phone");

  if (quoteName) {
    quoteName.value = user.fullName || "";
  }

  if (quoteEmail) {
    quoteEmail.value = user.email || "";
  }

  if (quotePhone) {
    quotePhone.value = user.phone || "";
  }
}

async function initAuthUi() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    bindPortfolioQuoteTrigger(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderQuoteRequestPage(null);
    return;
  }

  try {
    const user = await dqAuth.getCurrentUser();
    if (!user) {
      bindPortfolioQuoteTrigger(null);
      renderCartPage(null);
      renderProfilePage(null);
      renderQuoteRequestPage(null);
      return;
    }

    bindPortfolioQuoteTrigger(user);
    buildProfileMenu(user);
    renderCartPage(user);
    renderProfilePage(user);
    renderQuoteRequestPage(user);
  } catch {
    bindPortfolioQuoteTrigger(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderQuoteRequestPage(null);
  }
}

renderPlanDetailsPage();
initAuthUi();
