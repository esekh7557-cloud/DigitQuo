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
const reviewToggle = document.getElementById("reviewToggle");
const reviewForm = document.getElementById("reviewForm");
const reviewFeedback = document.getElementById("reviewFeedback");
const reviewRatingInput = document.getElementById("reviewRating");
const reviewStarsInput = document.getElementById("reviewStarsInput");
const testimonialGrid = document.querySelector(".testimonial-grid");
const testimonialSummaryStars = document.getElementById("testimonialSummaryStars");
const testimonialSummaryText = document.getElementById("testimonialSummaryText");
const CART_STORAGE_KEY = "dq_cart_items";
const SELECTED_PLAN_STORAGE_KEY = "dq_selected_plan";
const REVIEWS_STORAGE_KEY = "dq_reviews";
const dqAuth = window.dqAuth;
let activeReviewUser = null;
let activeReviewIsAdmin = false;
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

if ("IntersectionObserver" in window) {
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
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
}
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

function readReviews() {
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    const reviews = JSON.parse(raw || "[]");
    if (!Array.isArray(reviews)) {
      return [];
    }

    const normalizedReviews = reviews.map((review, index) => ({
      ...review,
      id: review?.id || `legacy-review-${index + 1}`,
    }));

    if (JSON.stringify(normalizedReviews) !== JSON.stringify(reviews)) {
      writeReviews(normalizedReviews);
    }

    return normalizedReviews;
  } catch {
    return [];
  }
}

function writeReviews(reviews) {
  window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function renderStarMarkup(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    return `<span class="star ${level <= safeRating ? "full" : "empty"}">&#9733;</span>`;
  }).join("");
}

function createReviewCard(review) {
  const card = document.createElement("article");
  card.className = "card testimonial-card";
  if (review.id) {
    card.dataset.reviewId = review.id;
  }
  if (review.userId) {
    card.dataset.reviewUserId = review.userId;
  }
  if (review.isUserReview) {
    card.classList.add("user-review");
  }
  card.innerHTML = `
    <div class="review-card-menu-wrap">
      <button class="review-card-menu-button" type="button" aria-label="Review options">&#8942;</button>
      <div class="review-card-menu" hidden>
        <button class="review-card-menu-item" type="button" data-review-action="report">Report review</button>
        <button class="review-card-menu-item danger" type="button" data-review-action="delete" hidden>Delete review</button>
      </div>
    </div>
    <div class="stars rating-stars" aria-label="${escapeHtml(review.rating)} out of 5 stars">${renderStarMarkup(review.rating)}</div>
    <p>"${escapeHtml(review.message)}"</p>
    <h3>- ${escapeHtml(review.name)}</h3>
  `;
  syncReviewCardControls(card);
  return card;
}

function closeReviewMenus() {
  if (!testimonialGrid) {
    return;
  }

  testimonialGrid.querySelectorAll(".review-card-menu").forEach((menu) => {
    menu.hidden = true;
  });
}

function syncReviewCardControls(card) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const reportButton = card.querySelector('[data-review-action="report"]');
  const deleteButton = card.querySelector('[data-review-action="delete"]');
  if (!(reportButton instanceof HTMLElement) || !(deleteButton instanceof HTMLElement)) {
    return;
  }

  const isOwner =
    Boolean(activeReviewUser) &&
    Boolean(card.dataset.reviewUserId) &&
    card.dataset.reviewUserId === activeReviewUser.id;
  const canDelete = isOwner || activeReviewIsAdmin;

  reportButton.hidden = isOwner;
  deleteButton.hidden = !canDelete;
  card.classList.toggle("user-review", isOwner || Boolean(card.dataset.reviewUserId));
}

function syncAllReviewCardControls() {
  if (!testimonialGrid) {
    return;
  }

  testimonialGrid.querySelectorAll(".testimonial-card").forEach((card) => {
    syncReviewCardControls(card);
  });
}

function syncReviewAccess(user) {
  activeReviewUser = user || null;

  if (!reviewToggle) {
    return;
  }

  if (!activeReviewUser) {
    reviewToggle.textContent = "Login to Add Review";
    if (reviewForm) {
      reviewForm.hidden = true;
    }
    closeReviewMenus();
    syncAllReviewCardControls();
    return;
  }

  reviewToggle.textContent = reviewForm && !reviewForm.hidden ? "Close Review" : "Add Review";
  const reviewNameInput = reviewForm?.elements?.namedItem("reviewName");
  if (reviewNameInput && "value" in reviewNameInput) {
    reviewNameInput.value = activeReviewUser.fullName || activeReviewUser.email || "";
  }
  syncAllReviewCardControls();
}

function focusUserReviewCard(card) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  testimonialGrid?.querySelectorAll(".testimonial-card.user-review").forEach((entry) => {
    entry.classList.remove("is-focused");
  });
  card.classList.add("is-focused");
  card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

function updateTestimonialSummary() {
  if (!testimonialGrid || !testimonialSummaryStars || !testimonialSummaryText) {
    return;
  }

  const ratings = Array.from(
    testimonialGrid.querySelectorAll(".testimonial-card .rating-stars[aria-label]")
  )
    .map((node) => Number.parseFloat(String(node.getAttribute("aria-label") || "").split(" ")[0]))
    .filter((value) => Number.isFinite(value));

  if (!ratings.length) {
    testimonialSummaryText.textContent = "No reviews yet";
    testimonialSummaryStars.innerHTML = renderStarMarkup(0);
    return;
  }

  const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  const roundedAverage = Math.round(average * 10) / 10;
  testimonialSummaryText.textContent = `${roundedAverage.toFixed(1)}/5 Trusted by clients`;

  const fullStars = Math.floor(average);
  const hasHalfStar = average - fullStars >= 0.25 && average - fullStars < 0.75;
  const extraFullStar = average - fullStars >= 0.75 ? 1 : 0;
  const totalFullStars = Math.min(5, fullStars + extraFullStar);
  const stars = [];

  for (let index = 1; index <= 5; index += 1) {
    if (index <= totalFullStars) {
      stars.push('<span class="star full">&#9733;</span>');
    } else if (hasHalfStar && index === totalFullStars + 1) {
      stars.push('<span class="star half">&#9733;</span>');
    } else {
      stars.push('<span class="star empty">&#9733;</span>');
    }
  }

  testimonialSummaryStars.innerHTML = stars.join("");
}

function renderStoredReviews() {
  if (!testimonialGrid) {
    return;
  }

  readReviews().forEach((review) => {
    testimonialGrid.appendChild(createReviewCard({ ...review, isUserReview: true }));
  });
  updateTestimonialSummary();
  syncAllReviewCardControls();
}

function syncReviewStars(rating) {
  if (!reviewStarsInput) {
    return;
  }

  reviewStarsInput.querySelectorAll(".review-star").forEach((star) => {
    star.classList.toggle("is-active", Number(star.dataset.rating) <= rating);
  });
}

function initReviewForm() {
  if (!reviewForm || !reviewToggle || !reviewStarsInput || !reviewRatingInput) {
    return;
  }

  reviewToggle.addEventListener("click", () => {
    if (!activeReviewUser) {
      window.location.href = "login.html?redirect=index.html";
      return;
    }

    const nextHidden = !reviewForm.hidden;
    reviewForm.hidden = nextHidden;
    reviewToggle.textContent = nextHidden ? "Add Review" : "Close Review";
    if (!nextHidden) {
      reviewForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  reviewStarsInput.querySelectorAll(".review-star").forEach((star) => {
    star.addEventListener("click", () => {
      const rating = Number(star.dataset.rating || 0);
      reviewRatingInput.value = String(rating);
      syncReviewStars(rating);
      if (reviewFeedback) {
        reviewFeedback.textContent = "";
      }
    });
  });

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!activeReviewUser) {
      window.location.href = "login.html?redirect=index.html";
      return;
    }

    const formData = new FormData(reviewForm);
    const name = String(formData.get("reviewName") || activeReviewUser.fullName || activeReviewUser.email || "").trim();
    const message = String(formData.get("reviewMessage") || "").trim();
    const rating = Number(reviewRatingInput.value || 0);

    if (!name || !message || rating < 1 || rating > 5) {
      if (reviewFeedback) {
        reviewFeedback.textContent = "Add your name, review, and star rating.";
      }
      return;
    }

    const review = {
      id: crypto.randomUUID(),
      userId: activeReviewUser.id,
      name,
      message,
      rating,
    };
    const reviews = readReviews();
    reviews.push(review);
    writeReviews(reviews);

    if (testimonialGrid) {
      const reviewCard = createReviewCard({ ...review, isUserReview: true });
      testimonialGrid.appendChild(reviewCard);
      focusUserReviewCard(reviewCard);
    }
    updateTestimonialSummary();
    syncAllReviewCardControls();

    reviewForm.reset();
    reviewRatingInput.value = "";
    syncReviewStars(0);
    if (reviewFeedback) {
      reviewFeedback.textContent = "Review added successfully.";
    }
    reviewForm.hidden = true;
    syncReviewAccess(activeReviewUser);
  });
}

function initReviewMenus() {
  if (!testimonialGrid) {
    return;
  }

  testimonialGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const menuButton = event.target.closest(".review-card-menu-button");
    if (menuButton) {
      const menuWrap = menuButton.closest(".review-card-menu-wrap");
      const menu = menuWrap?.querySelector(".review-card-menu");
      if (!(menu instanceof HTMLElement)) {
        return;
      }

      const shouldOpen = menu.hidden;
      closeReviewMenus();
      menu.hidden = !shouldOpen;
      return;
    }

    const actionButton = event.target.closest(".review-card-menu-item");
    if (!actionButton) {
      return;
    }

    const reviewCard = actionButton.closest(".testimonial-card");
    const action = actionButton.getAttribute("data-review-action");
    closeReviewMenus();

    if (action === "report") {
      showCartToast("Review reported.");
      return;
    }

    if (action === "delete" && reviewCard instanceof HTMLElement) {
      const isOwner =
        Boolean(activeReviewUser) &&
        Boolean(reviewCard.dataset.reviewUserId) &&
        reviewCard.dataset.reviewUserId === activeReviewUser.id;

      if (!isOwner && !activeReviewIsAdmin) {
        return;
      }

      if (reviewCard.dataset.reviewId) {
        const remainingReviews = readReviews().filter((review) => review.id !== reviewCard.dataset.reviewId);
        writeReviews(remainingReviews);
      }
      reviewCard.remove();
      updateTestimonialSummary();
      syncAllReviewCardControls();
      showCartToast("Review deleted.");
    }
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || event.target.closest(".review-card-menu-wrap")) {
      return;
    }

    closeReviewMenus();
  });
}

function getPlanByKey(planKey) {
  return PLAN_DETAILS[String(planKey || "").trim()] || null;
}

function writeCartItems(items) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function saveSelectedPlan(planKey) {
  if (!planKey) {
    return;
  }

  window.localStorage.setItem(SELECTED_PLAN_STORAGE_KEY, planKey);
}

function readSelectedPlan() {
  return window.localStorage.getItem(SELECTED_PLAN_STORAGE_KEY) || "";
}

function buildCartItemFromPlan(planKey) {
  const plan = getPlanByKey(planKey);
  if (!plan) {
    return null;
  }

  return {
    planKey,
    title: plan.name,
    description: `${plan.features.length} included features with domain registration and hosting support.`,
    price: formatInr(plan.subtotal),
    amount: Number(plan.subtotal),
  };
}

function upsertCartItem(item) {
  if (!item) {
    return { items: [], added: false, alreadyExists: false };
  }

  const items = readCartItems();
  const alreadyExists = items.some((entry) => entry.planKey === item.planKey);
  const nextItems = items.filter((entry) => entry.planKey !== item.planKey);
  nextItems.push({
    ...item,
    addedAt: new Date().toISOString(),
  });
  writeCartItems(nextItems);
  return { items: nextItems, added: !alreadyExists, alreadyExists };
}

function removeCartItem(planKey) {
  const nextItems = readCartItems().filter((item) => item.planKey !== planKey);
  writeCartItems(nextItems);
  return nextItems;
}

function clearCart() {
  writeCartItems([]);
}

function ensureCartToast() {
  let toast = document.getElementById("cartToast");
  if (toast) {
    return toast;
  }

  toast = document.createElement("div");
  toast.id = "cartToast";
  toast.className = "cart-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = `
    <button class="cart-toast-close" type="button" aria-label="Close notification">&times;</button>
    <div class="cart-toast-message"></div>
  `;
  document.body.appendChild(toast);

  const closeButton = toast.querySelector(".cart-toast-close");
  closeButton?.addEventListener("click", () => {
    toast.classList.remove("visible");
    window.clearTimeout(showCartToast.timeoutId);
  });

  return toast;
}

function showCartToast(message) {
  const toast = ensureCartToast();
  const messageNode = toast.querySelector(".cart-toast-message");
  if (messageNode) {
    messageNode.textContent = message;
  }
  toast.classList.add("visible");

  window.clearTimeout(showCartToast.timeoutId);
  showCartToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 4200);
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

  const existingUserMenu = navbar.querySelector(".user-menu");
  if (mobileLogin) {
    mobileLogin.classList.add("is-hidden");
  }

  const userMenu = existingUserMenu || document.createElement("div");
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

  if (!existingUserMenu && navCta && navCta.parentNode) {
    navCta.replaceWith(userMenu);
  } else if (!existingUserMenu) {
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

function updateQuoteActionLinks(user) {
  document.querySelectorAll("[data-auth-quote-link]").forEach((link) => {
    link.href = user ? "quote-request.html" : "login.html?redirect=quote-request.html";
  });
}

function renderCartPage(user) {
  if (!cartItems || !cartSummary) {
    return;
  }

  const items = readCartItems();
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

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
        <div class="cart-empty-actions">
          <a href="pricing.html" class="btn btn-primary">Browse Pricing</a>
          <a href="portfolio.html" class="btn btn-secondary">View Portfolio</a>
        </div>
      </article>
    `;
  } else {
    cartItems.innerHTML = items
      .map(
        (item) => `
          <article class="card cart-item">
            <div class="cart-item-copy">
              <h3>${escapeHtml(item.title || "Website Package")}</h3>
              <p>${escapeHtml(item.description || "Saved from your recent visit.")}</p>
            </div>
            <div class="cart-item-actions">
              <div class="cart-price">${escapeHtml(item.price || "Custom")}</div>
              <button class="btn btn-secondary" type="button" data-cart-remove="${escapeHtml(item.planKey || "")}">Remove</button>
            </div>
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
      <p class="cart-total-row"><strong>Total:</strong> <span>${formatInr(totalAmount)}</span></p>
      <a href="quote-request.html" class="btn btn-primary">Request Checkout</a>
      ${
        items.length
          ? '<button class="btn btn-secondary" type="button" data-cart-clear="true">Clear Cart</button>'
          : ""
      }
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
  const planKey = params.get("plan") || readSelectedPlan();
  const plan = getPlanByKey(planKey);

  if (!plan) {
    planDetailsRoot.innerHTML = `
      <article class="card cart-empty">
        <h1 class="section-title">Plan Not Found</h1>
        <p class="section-subtitle">Select a pricing package first to view the website and domain pricing breakdown.</p>
        <a href="pricing.html" class="btn btn-primary">Back to Pricing</a>
      </article>
    `;
    return;
  }

  saveSelectedPlan(planKey);
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
        <p class="plan-feedback" id="planFeedback">Add this package to your cart to keep it saved while you continue browsing.</p>
        <div class="plan-actions">
          <button class="btn btn-primary" type="button" data-plan-add="${escapeHtml(planKey)}">Add to Cart</button>
          <a href="login.html?redirect=quote-request.html" class="btn btn-secondary" data-auth-quote-link>Request Quote</a>
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

function bindPricingActions() {
  document.querySelectorAll("[data-plan-link]").forEach((link) => {
    link.addEventListener("click", () => {
      saveSelectedPlan(link.dataset.planLink);
    });
  });
}

function handlePlanAdd(planKey) {
  const item = buildCartItemFromPlan(planKey);
  if (!item) {
    return;
  }

  const result = upsertCartItem(item);
  saveSelectedPlan(planKey);

  const feedback = document.getElementById("planFeedback");
  if (feedback) {
    feedback.textContent = result.alreadyExists
      ? `${item.title} is already added.`
      : `${item.title} is added.`;
  }

  showCartToast(
    result.alreadyExists
      ? `${item.title} already added`
      : `${item.title} is added`
  );
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
    activeReviewIsAdmin = false;
    syncReviewAccess(null);
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderQuoteRequestPage(null);
    return;
  }

  try {
    const user = await dqAuth.getCurrentUser();
    if (!user) {
      activeReviewIsAdmin = false;
      syncReviewAccess(null);
      bindPortfolioQuoteTrigger(null);
      updateQuoteActionLinks(null);
      renderCartPage(null);
      renderProfilePage(null);
      renderQuoteRequestPage(null);
      return;
    }

    activeReviewIsAdmin = typeof dqAuth.checkAdminAccess === "function"
      ? await dqAuth.checkAdminAccess()
      : false;
    syncReviewAccess(user);
    syncAllReviewCardControls();
    bindPortfolioQuoteTrigger(user);
    updateQuoteActionLinks(user);
    buildProfileMenu(user);
    renderCartPage(user);
    renderProfilePage(user);
    renderQuoteRequestPage(user);
  } catch {
    activeReviewIsAdmin = false;
    syncReviewAccess(null);
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderQuoteRequestPage(null);
  }
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const target = event.target.closest("[data-plan-add], [data-cart-remove], [data-cart-clear]");
  if (!target) {
    return;
  }

  if (target.dataset.planAdd) {
    handlePlanAdd(target.dataset.planAdd);
    return;
  }

  if (target.dataset.cartRemove) {
    removeCartItem(target.dataset.cartRemove);
    initAuthUi();
    return;
  }

  if (target.dataset.cartClear === "true") {
    clearCart();
    initAuthUi();
  }
});

renderPlanDetailsPage();
bindPricingActions();
renderStoredReviews();
initReviewForm();
initReviewMenus();
initAuthUi();
