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
const planRequirementsRoot = document.getElementById("planRequirementsRoot");
const quoteRequestRoot = document.getElementById("quoteRequestRoot");
const reviewForm = document.getElementById("reviewForm");
const reviewFeedback = document.getElementById("reviewFeedback");
const reviewRatingInput = document.getElementById("reviewRating");
const reviewStarsInput = document.getElementById("reviewStarsInput");
const testimonialGrid = document.querySelector(".testimonial-grid");
const testimonialSummaryStars = document.getElementById("testimonialSummaryStars");
const testimonialSummaryText = document.getElementById("testimonialSummaryText");
const CART_STORAGE_KEY = "dq_cart_items";
const SELECTED_PLAN_STORAGE_KEY = "dq_selected_plan";
const PLAN_COUPONS_STORAGE_KEY = "dq_plan_coupons";
const REVIEWS_STORAGE_KEY = "dq_reviews";
const dqAuth = window.dqAuth;
let activeReviewUser = null;
let activeReviewIsAdmin = false;
const FOOTER_FAQ_ITEMS = [
  {
    question: "1. What services do you provide?",
    answer:
      "<p>We provide complete website development services including website design, development, domain setup, hosting guidance, deployment, maintenance, and basic SEO setup.</p>",
  },
  {
    question: "2. How much time does it take to build a website?",
    answer:
      "<p>The timeline depends on the project scope. Most standard websites take around 10-15 days. Complex or custom projects may take longer.</p>",
  },
  {
    question: "3. What information do you need from the client to start?",
    answer:
      "<p>We require:</p><ul><li>Business details and logo</li><li>Website content such as text, images, and product details</li><li>Required features and pages</li><li>Domain and hosting details if already purchased</li></ul>",
  },
  {
    question: "4. Do you provide domain and hosting?",
    answer:
      "<p>Yes. Our plans include complete website development with domain and hosting included.</p>",
  },
  {
    question: "5. Will my website be mobile friendly?",
    answer:
      "<p>Yes. All websites are built with responsive design, meaning they will work smoothly on mobile, tablet, and desktop devices.</p>",
  },
  {
    question: "6. Do you provide SEO services?",
    answer:
      "<p>Basic SEO setup such as meta tags, page speed optimization, sitemap, and indexing setup is included. Advanced SEO can be provided as an additional service.</p>",
  },
  {
    question: "8. Do you provide e-commerce functionality?",
    answer:
      "<p>Yes. We can build fully functional online stores with payment gateway integration, product management, order tracking, and email notifications.</p>",
  },
  {
    question: "9. What happens after the project is completed?",
    answer:
      "<p>We perform final deployment and testing. After handover:</p><ul><li>Domain ownership is transferred if purchased via us</li><li>Client must follow deployment and hosting guidelines</li><li>Optional maintenance support can be continued</li></ul>",
  },
  {
    question: "10. Do you offer revisions?",
    answer:
      "<p>Yes. Limited revisions are included depending on the selected plan. Additional revisions or major changes may involve extra cost.</p>",
  },
  {
    question: "11. What are your payment terms?",
    answer:
      "<p>Typically, an advance payment is required to start the project and the remaining payment is due before final deployment or handover.</p>",
  },
  {
    question: "12. Do you provide website maintenance?",
    answer:
      "<p>Yes. We offer monthly or yearly maintenance plans including updates, backups, security monitoring, and minor content changes.</p>",
  },
];

function ensureFooterFaqAccordion() {
  const allowedFaqPages = new Set(["/", "/index.html", "/about.html", "/contact.html"]);
  const currentPath = String(window.location.pathname || "").toLowerCase();
  if (!allowedFaqPages.has(currentPath)) {
    return;
  }

  document.querySelectorAll("footer").forEach((footer) => {
    if (footer.previousElementSibling?.classList?.contains("footer-faq-shell")) {
      return;
    }

    const shell = document.createElement("div");
    shell.className = "container footer-faq-shell";
    shell.innerHTML = `
      <section class="footer-faq-card" aria-label="Frequently asked questions">
        <div class="footer-faq-header">
          <span class="eyebrow">FAQ</span>
          <h2>Frequently Asked Questions</h2>
        </div>
        <div class="footer-faq-list">
          ${FOOTER_FAQ_ITEMS.map(
            (item, index) => `
              <article class="footer-faq-item">
                <button class="footer-faq-toggle" type="button" aria-expanded="false" aria-controls="footerFaqAnswer${index}">
                  <span>${escapeHtml(item.question)}</span>
                  <span class="footer-faq-icon" aria-hidden="true">+</span>
                </button>
                <div class="footer-faq-answer" id="footerFaqAnswer${index}" hidden>
                  ${item.answer}
                </div>
              </article>
            `
          ).join("")}
        </div>
      </section>
    `;

    footer.parentNode?.insertBefore(shell, footer);

    shell.querySelectorAll(".footer-faq-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.nextElementSibling;
        const icon = button.querySelector(".footer-faq-icon");
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        if (answer) {
          answer.hidden = isExpanded;
        }
        if (icon) {
          icon.textContent = isExpanded ? "+" : "-";
        }
      });
    });
  });
}

const PLAN_DETAILS = {
  basic: {
    name: "The Starter",
    oldPrice: 15000,
    subtotal: 12999,
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
    name: "The Professional",
    oldPrice: 18000,
    subtotal: 14599,
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
    name: "Professional Plus",
    oldPrice: 22000,
    subtotal: 16999,
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
    name: "Enterprise",
    oldPrice: 50000,
    subtotal: 39999,
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
    name: "Enterprise Plus",
    oldPrice: 70000,
    subtotal: 49999,
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

ensureFooterFaqAccordion();

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

function initAutoTechRows() {
  document.querySelectorAll(".home-tech-grid-scroll").forEach((scroller) => {
    if (!(scroller instanceof HTMLElement)) {
      return;
    }

    const track = scroller.querySelector(".home-tech-grid");
    if (!(track instanceof HTMLElement) || scroller.dataset.autoScrollReady === "true") {
      return;
    }

    const originalWidth = track.scrollWidth;
    if (originalWidth <= scroller.clientWidth) {
      return;
    }

    const clones = Array.from(track.children).map((child) => child.cloneNode(true));
    clones.forEach((clone) => {
      if (clone instanceof HTMLElement) {
        clone.setAttribute("aria-hidden", "true");
      }
      track.appendChild(clone);
    });

    scroller.dataset.autoScrollReady = "true";

    const rowIndex = Array.from(scroller.parentElement?.children || []).indexOf(scroller);
    const speed = [0.7, 0.95, 0.8][rowIndex] || 0.8;
    let paused = false;
    let position = 0;

    scroller.addEventListener("mouseenter", () => {
      paused = true;
    });

    scroller.addEventListener("mouseleave", () => {
      paused = false;
    });

    const animate = () => {
      if (!paused) {
        position += speed;
        if (position >= originalWidth) {
          position -= originalWidth;
        }
        scroller.scrollLeft = position;
      }

      window.requestAnimationFrame(animate);
    };

    window.requestAnimationFrame(animate);
  });
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

function createReviewId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeReview(review, index = 0) {
  return {
    id: review?.id || `legacy-review-${index + 1}`,
    userId: review?.userId || review?.user_id || "",
    name: String(review?.name || "").trim(),
    message: String(review?.message || "").trim(),
    rating: Number(review?.rating || 0),
    createdAt: review?.createdAt || review?.created_at || "",
  };
}

async function getReviewClient() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    return null;
  }

  try {
    return await dqAuth.getClient();
  } catch (error) {
    console.error("Could not create Supabase review client:", error);
    return null;
  }
}

async function fetchPersistedReviews() {
  const client = await getReviewClient();
  if (!client) {
    return readReviews().map((review, index) => normalizeReview(review, index));
  }

  const { data, error } = await client
    .from("reviews")
    .select("id, user_id, name, message, rating, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load reviews from backend:", error);
    return [];
  }

  return (data || []).map((review, index) => normalizeReview(review, index));
}

async function createPersistedReview(review) {
  const client = await getReviewClient();
  if (!client) {
    const normalizedReview = normalizeReview({
      ...review,
      id: createReviewId(),
      createdAt: new Date().toISOString(),
    });
    const reviews = readReviews();
    reviews.push(normalizedReview);
    writeReviews(reviews);
    return normalizedReview;
  }

  const { data, error } = await client
    .from("reviews")
    .insert({
      user_id: review.userId,
      name: review.name,
      message: review.message,
      rating: review.rating,
    })
    .select("id, user_id, name, message, rating, created_at")
    .single();

  if (error) {
    throw new Error(error.message || "Could not save review to backend.");
  }

  return normalizeReview(data);
}

async function deletePersistedReview(reviewId) {
  const client = await getReviewClient();
  if (!client) {
    const remainingReviews = readReviews().filter((review) => review.id !== reviewId);
    writeReviews(remainingReviews);
    return;
  }

  const { error } = await client.from("reviews").delete().eq("id", reviewId);
  if (error) {
    throw new Error(error.message || "Could not delete review from backend.");
  }
}

function renderStarMarkup(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    return `<span class="star ${level <= safeRating ? "full" : "empty"}">&#9733;</span>`;
  }).join("");
}

function getReviewInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "DQ";
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
  const initials = getReviewInitials(review.name);
  const reviewLabel = review.isUserReview ? "Your review" : "Verified client";
  card.innerHTML = `
    <div class="review-card-menu-wrap">
      <button class="review-card-menu-button" type="button" aria-label="Review options">&#8942;</button>
      <div class="review-card-menu" hidden>
        <button class="review-card-menu-item" type="button" data-review-action="report">Report review</button>
        <button class="review-card-menu-item danger" type="button" data-review-action="delete" hidden>Delete review</button>
      </div>
    </div>
    <div class="testimonial-card-top">
      <div class="testimonial-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
      <div class="testimonial-author">
        <h3>${escapeHtml(review.name)}</h3>
        <span>${escapeHtml(reviewLabel)}</span>
      </div>
    </div>
    <p class="testimonial-copy">${escapeHtml(review.message)}</p>
    <div class="stars rating-stars" aria-label="${escapeHtml(review.rating)} out of 5 stars">${renderStarMarkup(review.rating)}</div>
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
  card.classList.toggle("user-review", isOwner);
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

  if (!reviewForm) {
    return;
  }

  const reviewNameInput = reviewForm.elements?.namedItem("reviewName");

  if (!activeReviewUser) {
    if (reviewFeedback) {
      reviewFeedback.textContent = "Log in to submit your review.";
    }
    if (reviewNameInput && "value" in reviewNameInput) {
      reviewNameInput.value = "";
    }
    closeReviewMenus();
    syncAllReviewCardControls();
    return;
  }

  if (reviewNameInput && "value" in reviewNameInput) {
    reviewNameInput.value = activeReviewUser.fullName || activeReviewUser.email || "";
  }
  if (reviewFeedback && reviewFeedback.textContent === "Log in to submit your review.") {
    reviewFeedback.textContent = "";
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

async function renderStoredReviews() {
  if (!testimonialGrid) {
    return;
  }

  try {
    testimonialGrid.querySelectorAll(".testimonial-card[data-review-id]").forEach((card) => {
      card.remove();
    });

    const reviews = await fetchPersistedReviews();
    reviews.forEach((review) => {
      testimonialGrid.appendChild(createReviewCard(review));
    });

    updateTestimonialSummary();
    syncAllReviewCardControls();
  } catch (error) {
    console.error("Could not render reviews:", error);
  }
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
  if (!reviewForm || !reviewStarsInput || !reviewRatingInput) {
    return;
  }

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

  reviewForm.addEventListener("submit", async (event) => {
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
      userId: activeReviewUser.id,
      name,
      message,
      rating,
    };

    try {
      const savedReview = await createPersistedReview(review);

      if (testimonialGrid) {
        const reviewCard = createReviewCard({ ...savedReview, isUserReview: true });
        testimonialGrid.appendChild(reviewCard);
        focusUserReviewCard(reviewCard);
      }
      updateTestimonialSummary();
      syncAllReviewCardControls();

      reviewForm.reset();
      reviewRatingInput.value = "";
      syncReviewStars(0);
      const reviewNameInput = reviewForm.elements?.namedItem("reviewName");
      if (reviewNameInput && "value" in reviewNameInput) {
        reviewNameInput.value = activeReviewUser.fullName || activeReviewUser.email || "";
      }
      if (reviewFeedback) {
        reviewFeedback.textContent = "Review added successfully.";
      }
    } catch (error) {
      if (reviewFeedback) {
        reviewFeedback.textContent = error.message || "Could not save review.";
      }
    }
  });
}

function initReviewMenus() {
  if (!testimonialGrid) {
    return;
  }

  testimonialGrid.addEventListener("click", async (event) => {
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
        try {
          await deletePersistedReview(reviewCard.dataset.reviewId);
        } catch (error) {
          showCartToast(error.message || "Could not delete review.");
          return;
        }
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

function getPlanRequirementsPagePath(planKey) {
  const pages = {
    basic: "the-starter-form.html",
    business: "the-professional-form.html",
    professional: "professional-plus-form.html",
    ecommerce: "enterprise-form.html",
    "advanced-ecommerce": "enterprise-plus-form.html",
  };

  return pages[String(planKey || "").trim()] || "";
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

function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase();
}

function readStoredPlanCoupons() {
  try {
    const raw = window.localStorage.getItem(PLAN_COUPONS_STORAGE_KEY);
    const coupons = JSON.parse(raw || "{}");
    return coupons && typeof coupons === "object" && !Array.isArray(coupons) ? coupons : {};
  } catch {
    return {};
  }
}

function writeStoredPlanCoupons(coupons) {
  window.localStorage.setItem(PLAN_COUPONS_STORAGE_KEY, JSON.stringify(coupons || {}));
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

function serializeCoupon(coupon) {
  const couponCode = normalizeCouponCode(coupon?.coupon_code);
  if (!couponCode) {
    return null;
  }

  return {
    id: String(coupon?.id || ""),
    coupon_code: couponCode,
    discount_percentage:
      coupon?.discount_percentage === null || typeof coupon?.discount_percentage === "undefined"
        ? null
        : Number(coupon.discount_percentage),
    discount_type: getCouponDiscountType(coupon),
    discount_value: getCouponDiscountValue(coupon),
    max_uses: coupon?.max_uses ?? null,
    current_uses: Number(coupon?.current_uses || 0),
    expiry_date: coupon?.expiry_date || null,
    is_active: coupon?.is_active !== false,
  };
}

function getStoredPlanCoupon(planKey) {
  const coupons = readStoredPlanCoupons();
  return coupons[String(planKey || "").trim()] || null;
}

function setStoredPlanCoupon(planKey, coupon) {
  const key = String(planKey || "").trim();
  if (!key) {
    return;
  }

  const coupons = readStoredPlanCoupons();
  const serializedCoupon = serializeCoupon(coupon);
  if (!serializedCoupon) {
    delete coupons[key];
  } else {
    coupons[key] = serializedCoupon;
  }
  writeStoredPlanCoupons(coupons);
}

function clearStoredPlanCoupon(planKey) {
  const key = String(planKey || "").trim();
  if (!key) {
    return;
  }

  const coupons = readStoredPlanCoupons();
  delete coupons[key];
  writeStoredPlanCoupons(coupons);
}

function getCouponValidationError(coupon) {
  if (!coupon) {
    return "Coupon code was not found.";
  }

  if (coupon.is_active === false) {
    return "This coupon is inactive.";
  }

  if (coupon.expiry_date) {
    const expiryDate = new Date(coupon.expiry_date);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
      return "This coupon has expired.";
    }
  }

  if (coupon.max_uses && Number(coupon.current_uses || 0) >= Number(coupon.max_uses)) {
    return "This coupon has reached its usage limit.";
  }

  const discountValue = getCouponDiscountValue(coupon);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return "This coupon has an invalid discount value.";
  }

  if (getCouponDiscountType(coupon) === "percentage" && discountValue > 100) {
    return "This coupon has an invalid percentage discount.";
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

function getPlanPricingWithCoupon(plan, coupon) {
  const baseAmount = Number(plan?.subtotal || 0);
  const discountAmount = calculateCouponDiscount(baseAmount, coupon);
  const finalAmount = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);

  return {
    baseAmount,
    discountAmount,
    finalAmount,
  };
}

async function fetchCouponByCode(code) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode || !dqAuth || !dqAuth.isConfigured()) {
    return null;
  }

  const client = await dqAuth.getClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("coupons")
    .select("*")
    .eq("coupon_code", normalizedCode)
    .limit(1);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data[0] || null : null;
}

function setPlanCouponFeedback(message, state = "info") {
  const feedback = document.getElementById("planCouponFeedback");
  if (!feedback) {
    return;
  }

  feedback.textContent = message || "";
  feedback.dataset.state = state;
}

function syncPlanCouponUi(planKey) {
  const plan = getPlanByKey(planKey);
  if (!plan) {
    return;
  }

  const coupon = getStoredPlanCoupon(planKey);
  const pricing = getPlanPricingWithCoupon(plan, coupon);
  const couponInput = document.getElementById("planCouponCode");
  const clearButton = document.getElementById("clearPlanCouponBtn");
  const couponLabel = document.getElementById("planCouponLabel");
  const couponValue = document.getElementById("planCouponDiscountValue");
  const finalTotal = document.getElementById("planFinalTotal");
  const requirementBaseAmount = document.getElementById("planRequirementBaseAmount");
  const requirementCouponRow = document.getElementById("planRequirementCouponRow");
  const requirementCouponLabel = document.getElementById("planRequirementCouponLabel");
  const requirementCouponValue = document.getElementById("planRequirementCouponValue");
  const requirementFinalAmount = document.getElementById("planRequirementFinalAmount");
  const requirementCouponNote = document.getElementById("planRequirementCouponNote");

  if (couponInput && !couponInput.matches(":focus")) {
    couponInput.value = coupon?.coupon_code || "";
  }

  if (clearButton) {
    clearButton.hidden = !coupon;
  }

  if (couponLabel) {
    couponLabel.textContent = coupon ? `Coupon (${coupon.coupon_code})` : "Coupon Discount";
  }

  if (couponValue) {
    couponValue.textContent = pricing.discountAmount ? `- ${formatInr(pricing.discountAmount)}` : formatInr(0);
  }

  if (finalTotal) {
    finalTotal.textContent = formatInr(pricing.finalAmount);
  }

  if (requirementBaseAmount) {
    requirementBaseAmount.textContent = formatInr(pricing.baseAmount);
  }

  if (requirementCouponRow) {
    requirementCouponRow.hidden = !coupon;
  }

  if (requirementCouponLabel) {
    requirementCouponLabel.textContent = coupon ? `Coupon (${coupon.coupon_code})` : "Coupon Discount";
  }

  if (requirementCouponValue) {
    requirementCouponValue.textContent = pricing.discountAmount ? `- ${formatInr(pricing.discountAmount)}` : formatInr(0);
  }

  if (requirementFinalAmount) {
    requirementFinalAmount.textContent = formatInr(pricing.finalAmount);
  }

  if (requirementCouponNote) {
    requirementCouponNote.textContent = coupon
      ? `${coupon.coupon_code} will be revalidated before payment is created.`
      : "Apply a coupon on the plan details page to see the discount here.";
  }
}

async function revalidateStoredPlanCoupon(planKey, options = {}) {
  const storedCoupon = getStoredPlanCoupon(planKey);
  if (!storedCoupon?.coupon_code) {
    syncPlanCouponUi(planKey);
    return null;
  }

  try {
    const coupon = await fetchCouponByCode(storedCoupon.coupon_code);
    const validationError = getCouponValidationError(coupon);
    if (validationError) {
      throw new Error(validationError);
    }

    setStoredPlanCoupon(planKey, coupon);
    syncPlanCouponUi(planKey);

    if (!options.silent) {
      setPlanCouponFeedback(`Coupon ${normalizeCouponCode(coupon.coupon_code)} applied successfully.`, "success");
    }
    return coupon;
  } catch (error) {
    clearStoredPlanCoupon(planKey);
    syncPlanCouponUi(planKey);
    if (!options.silent) {
      setPlanCouponFeedback(error.message || "This coupon is no longer available.", "error");
    }
    return null;
  }
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

function getOrderStatusLabel(status) {
  const labels = {
    pending: "Pending",
    ongoing: "Ongoing",
    completed: "Completed",
    failed: "Failed",
    refunded: "Refunded",
  };

  return labels[String(status || "").trim()] || "Pending";
}

function getOrderStatusClass(status) {
  const classes = {
    pending: "order-status pending",
    ongoing: "order-status ongoing",
    completed: "order-status completed",
    failed: "order-status failed",
    refunded: "order-status refunded",
  };

  return classes[String(status || "").trim()] || "order-status pending";
}

function getPaymentStatusLabel(paymentStatus) {
  return String(paymentStatus || "").trim() === "paid" ? "Paid" : "Unpaid";
}

function getPaymentStatusClass(paymentStatus) {
  return String(paymentStatus || "").trim() === "paid"
    ? "payment-status paid"
    : "payment-status unpaid";
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

function renderUserMenuIcon(iconName) {
  const icons = {
    account: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
        <path d="M5 19.25a7 7 0 0 1 14 0" />
      </svg>
    `,
    security: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.75 6.75 6v4.35c0 4.11 2.34 7.94 6 9.9 3.66-1.96 6-5.79 6-9.9V6L12 3.75Z" />
        <path d="M9.75 11.75 11.3 13.3l3.2-3.2" />
      </svg>
    `,
    activity: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 12a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
        <path d="M4.75 18.25a7.25 7.25 0 0 1 14.5 0" />
        <path d="M18.5 9.5h2.75v6h-2.75" />
        <path d="M20 12.5h-2" />
      </svg>
    `,
    notifications: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 4.75a4.5 4.5 0 0 0-4.5 4.5v2.11c0 .72-.23 1.43-.66 2.01l-1.22 1.68a1 1 0 0 0 .81 1.59h11.14a1 1 0 0 0 .81-1.59l-1.22-1.68a3.5 3.5 0 0 1-.66-2.01V9.25a4.5 4.5 0 0 0-4.5-4.5Z" />
        <path d="M10.25 18.25a1.75 1.75 0 0 0 3.5 0" />
      </svg>
    `,
    language: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 6.75h9.5" />
        <path d="M9.5 6.75c0 4.25-1.9 7.67-5 9.5" />
        <path d="M7 10.75c.74 1.63 1.93 3.1 3.5 4.25" />
        <path d="M15.25 9.75h4" />
        <path d="m17.25 9.75 2.75 7.5" />
        <path d="m17.25 9.75-2.75 7.5" />
        <path d="M15.75 14.75h3" />
      </svg>
    `,
    api: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.75" y="6.75" width="16.5" height="10.5" rx="2.25" />
        <path d="M7.5 10.5h1.5" />
        <path d="M7.5 13.5h3" />
        <path d="M12.5 13.5h4" />
        <path d="M12.5 10.5h4.5" />
      </svg>
    `,
    home: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 10.25 12 4.75l7.25 5.5" />
        <path d="M7.75 9.75v8.5h8.5v-8.5" />
      </svg>
    `,
    settings: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="M4.75 13.25v-2.5l2.11-.55a5.72 5.72 0 0 1 .74-1.8L6.5 6.5l1.77-1.77 1.9 1.1c.57-.3 1.18-.54 1.83-.7l.5-2.13h2.5l.5 2.13c.65.16 1.26.4 1.83.7l1.9-1.1L19.5 6.5l-1.1 1.9c.31.57.56 1.18.72 1.82l2.13.53v2.5l-2.13.53a5.9 5.9 0 0 1-.72 1.82l1.1 1.9-1.77 1.77-1.9-1.1a5.8 5.8 0 0 1-1.83.7l-.5 2.13h-2.5l-.5-2.13a5.8 5.8 0 0 1-1.83-.7l-1.9 1.1L6.5 17.5l1.1-1.9a5.72 5.72 0 0 1-.74-1.8l-2.11-.55Z" />
      </svg>
    `,
    eye: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M2.75 12s3.25-5.25 9.25-5.25S21.25 12 21.25 12s-3.25 5.25-9.25 5.25S2.75 12 2.75 12Z" />
        <circle cx="12" cy="12" r="2.75" />
      </svg>
    `,
    eyeOff: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9.9 4.95A10.74 10.74 0 0 1 12 4.75c6 0 9.25 5.25 9.25 5.25a15.7 15.7 0 0 1-3.18 3.69" />
        <path d="M6.62 6.62A15.43 15.43 0 0 0 2.75 12s3.25 5.25 9.25 5.25a10.8 10.8 0 0 0 5.38-1.45" />
        <path d="m3.75 3.75 16.5 16.5" />
      </svg>
    `,
    logout: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10.25 5.75H8A2.25 2.25 0 0 0 5.75 8v8A2.25 2.25 0 0 0 8 18.25h2.25" />
        <path d="M13 8.75 17.25 12 13 15.25" />
        <path d="M17.25 12H9.75" />
      </svg>
    `,
  };

  return icons[iconName] || "";
}

function isValidEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isValidPhoneNumber(value) {
  return /^[0-9+\-\s()]{7,20}$/.test(String(value || "").trim());
}

function setAccountSettingsFeedback(node, message, state = "") {
  if (!node) {
    return;
  }

  node.textContent = message || "";
  node.dataset.state = state || "";
}

function syncAccountPasswordToggle(button, input) {
  if (!(button instanceof HTMLButtonElement) || !(input instanceof HTMLInputElement)) {
    return;
  }

  const isVisible = input.type === "text";
  button.innerHTML = renderUserMenuIcon(isVisible ? "eyeOff" : "eye");
  button.setAttribute("aria-label", isVisible ? "Hide password" : "Show password");
  button.setAttribute("aria-pressed", isVisible ? "true" : "false");
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
      <div class="user-panel-header user-panel-header--stack">
        <h3>${escapeHtml(user.fullName)}</h3>
        <p>${escapeHtml(user.email)}</p>
      </div>
      <div class="user-panel-menu">
        <a class="user-menu-link" href="profile.html#accountMain">
          <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
          <span class="user-menu-link__label">Account Information</span>
        </a>
        <a class="user-menu-link user-menu-link--accent" href="profile.html#accountMain">
          <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
          <span class="user-menu-link__label">Security</span>
        </a>
        <a class="user-menu-link" href="orders.html#ordersMain">
          <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
          <span class="user-menu-link__label">Account Activity</span>
        </a>
        <div class="user-menu-link user-menu-link--static">
          <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
          <span class="user-menu-link__label">Notification settings</span>
        </div>
        <div class="user-menu-link user-menu-link--static">
          <span class="user-menu-link__icon">${renderUserMenuIcon("language")}</span>
          <span class="user-menu-link__label">Language</span>
          <span class="user-menu-link__meta">English</span>
        </div>
      </div>
      <div class="user-panel-footer">
        <button class="user-menu-link user-menu-link--logout" type="button" id="logoutBtn">
          <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
          <span class="user-menu-link__label">Log out</span>
        </button>
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

function updatePlanBuyLinks(user) {
  document.querySelectorAll("[data-plan-buy-link]").forEach((link) => {
    const planKey = link.getAttribute("data-plan-buy-link") || readSelectedPlan();
    const requirementsPage = getPlanRequirementsPagePath(planKey);
    link.href = requirementsPage || "pricing.html";
  });
}

function renderCartPage(user) {
  if (!cartItems || !cartSummary) {
    return;
  }

  const items = readCartItems();
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const primaryPlanKey = items[items.length - 1]?.planKey || readSelectedPlan();

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
      <a href="${primaryPlanKey ? getPlanRequirementsPagePath(primaryPlanKey) || "pricing.html" : "pricing.html"}" class="btn btn-primary">${primaryPlanKey ? "Proceed to Buy" : "Browse Pricing"}</a>
      <a href="orders.html" class="btn btn-secondary">View Orders</a>
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
    <div class="profile-grid account-page-grid">
      <aside class="profile-sidebar">
        <article class="card profile-account-nav profile-account-nav--compact">
          <nav class="profile-account-nav__menu" aria-label="Account menu">
            <a class="user-menu-link user-menu-link--active" href="profile.html#accountMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
              <span class="user-menu-link__label">Account Information</span>
            </a>
            <div class="user-menu-link user-menu-link--static user-menu-link--accent">
              <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
              <span class="user-menu-link__label">Security</span>
            </div>
            <a class="user-menu-link" href="orders.html#ordersMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
              <span class="user-menu-link__label">Account Activity</span>
            </a>
            <div class="user-menu-link user-menu-link--static">
              <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
              <span class="user-menu-link__label">Notification settings</span>
            </div>
            <div class="user-menu-link user-menu-link--static">
              <span class="user-menu-link__icon">${renderUserMenuIcon("api")}</span>
              <span class="user-menu-link__label">API</span>
            </div>
          </nav>
          <div class="profile-account-nav__footer">
            <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
              <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
              <span class="user-menu-link__label">Log out</span>
            </button>
          </div>
        </article>
      </aside>
      <div class="profile-main" id="accountMain">
        <div class="account-page-header">
          <h2>Account Information</h2>
        </div>
        <article class="card account-panel">
          <div class="account-panel__header">
            <span class="account-panel__icon">${renderUserMenuIcon("account")}</span>
            <h3>Personal information</h3>
          </div>
          <div class="account-panel__intro">The information provided below will reflect on your invoices.</div>
          <div class="account-panel__body">
            <button class="account-row account-row--action" type="button" data-account-settings-target="name" aria-expanded="false">
              <span class="account-row__label">Name</span>
              <strong class="account-row__value">${escapeHtml(user.fullName)}</strong>
              <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
            </button>
            <button class="account-row account-row--action" type="button" data-account-settings-target="country" aria-expanded="false">
              <span class="account-row__label">Country</span>
              <strong class="account-row__value">${escapeHtml(user.country || "IN")}</strong>
              <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
            </button>
            <button class="account-row account-row--action" type="button" data-account-settings-target="phone" aria-expanded="false">
              <span class="account-row__label">Phone number</span>
              <strong class="account-row__value">${escapeHtml(user.phone || "-")}</strong>
              <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
            </button>
            <div class="account-row">
              <span class="account-row__label">Company</span>
              <strong class="account-row__value">-</strong>
              <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
            </div>
            <div class="account-row account-row--static">
              <span class="account-row__label">Account currency <span class="account-row__hint">i</span></span>
              <strong class="account-row__value">INR</strong>
            </div>
          </div>
        </article>
        <article class="card account-panel">
          <div class="account-panel__header">
            <span class="account-panel__icon">${renderUserMenuIcon("settings")}</span>
            <h3>Account settings</h3>
          </div>
          <div class="account-panel__body account-panel__body--stack">
            <div class="account-settings-list" role="list">
              <button class="account-row account-row--action" type="button" data-account-settings-target="email" aria-expanded="false">
                <span class="account-row__label">Email</span>
                <strong class="account-row__value">${escapeHtml(user.email)}</strong>
                <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
              </button>
              <button class="account-row account-row--action" type="button" data-account-settings-target="password" aria-expanded="false">
                <span class="account-row__label">Manage password</span>
                <strong class="account-row__value">Change password</strong>
                <span class="account-row__chevron" aria-hidden="true">&#8250;</span>
              </button>
            </div>
          </div>
        </article>
        <div class="account-modal" id="accountNameModal" hidden>
          <div class="account-modal__backdrop" data-account-modal-close="name"></div>
          <div class="account-modal__dialog">
            <form class="account-settings-form account-settings-form--modal" id="accountNameForm">
              <div class="account-settings-form__head account-settings-form__head--modal">
                <h4>Change name</h4>
                <p>Update the name shown across your DigitQuo account and billing details.</p>
              </div>
              <label class="account-settings-field account-settings-field--modal" for="accountNameInput">
                <span>Full name</span>
                <input
                  id="accountNameInput"
                  name="fullName"
                  type="text"
                  value="${escapeHtml(user.fullName)}"
                  autocomplete="name"
                  required
                />
              </label>
              <p class="account-settings-feedback" id="accountNameFeedback"></p>
              <div class="account-settings-actions account-settings-actions--modal">
                <button class="btn account-settings-cancel" type="button" data-account-modal-close="name">Cancel</button>
                <button class="btn btn-primary" type="submit">Continue</button>
              </div>
            </form>
          </div>
        </div>
        <div class="account-modal" id="accountCountryModal" hidden>
          <div class="account-modal__backdrop" data-account-modal-close="country"></div>
          <div class="account-modal__dialog">
            <form class="account-settings-form account-settings-form--modal" id="accountCountryForm">
              <div class="account-settings-form__head account-settings-form__head--modal">
                <h4>Change country</h4>
                <p>Update the country value shown in your personal information and account details.</p>
              </div>
              <label class="account-settings-field account-settings-field--modal" for="accountCountryInput">
                <span>Country</span>
                <input
                  id="accountCountryInput"
                  name="country"
                  type="text"
                  value="${escapeHtml(user.country || "IN")}"
                  autocomplete="country-name"
                  required
                />
              </label>
              <p class="account-settings-feedback" id="accountCountryFeedback"></p>
              <div class="account-settings-actions account-settings-actions--modal">
                <button class="btn account-settings-cancel" type="button" data-account-modal-close="country">Cancel</button>
                <button class="btn btn-primary" type="submit">Continue</button>
              </div>
            </form>
          </div>
        </div>
        <div class="account-modal" id="accountPhoneModal" hidden>
          <div class="account-modal__backdrop" data-account-modal-close="phone"></div>
          <div class="account-modal__dialog">
            <form class="account-settings-form account-settings-form--modal" id="accountPhoneForm">
              <div class="account-settings-form__head account-settings-form__head--modal">
                <h4>Change phone number</h4>
                <p>Update the phone number used for account communication and project contact.</p>
              </div>
              <label class="account-settings-field account-settings-field--modal" for="accountPhoneInput">
                <span>Phone number</span>
                <input
                  id="accountPhoneInput"
                  name="phone"
                  type="tel"
                  value="${escapeHtml(user.phone || "")}"
                  autocomplete="tel"
                  required
                />
              </label>
              <p class="account-settings-feedback" id="accountPhoneFeedback"></p>
              <div class="account-settings-actions account-settings-actions--modal">
                <button class="btn account-settings-cancel" type="button" data-account-modal-close="phone">Cancel</button>
                <button class="btn btn-primary" type="submit">Continue</button>
              </div>
            </form>
          </div>
        </div>
        <div class="account-modal" id="accountEmailModal" hidden>
          <div class="account-modal__backdrop" data-account-modal-close="email"></div>
          <div class="account-modal__dialog">
            <form class="account-settings-form account-settings-form--modal" id="accountEmailForm">
              <div class="account-settings-form__head account-settings-form__head--modal">
                <h4>Change email address</h4>
                <p>Enter a new email address for your account. You may receive a verification email to finalize the change.</p>
              </div>
              <label class="account-settings-field account-settings-field--modal" for="accountEmailInput">
                <span>New email</span>
                <input
                  id="accountEmailInput"
                  name="accountEmail"
                  type="email"
                  value="${escapeHtml(user.email)}"
                  autocomplete="email"
                  required
                />
              </label>
              <p class="account-settings-feedback" id="accountEmailFeedback"></p>
              <div class="account-settings-actions account-settings-actions--modal">
                <button class="btn account-settings-cancel" type="button" data-account-modal-close="email">Cancel</button>
                <button class="btn btn-primary" type="submit">Continue</button>
              </div>
            </form>
          </div>
        </div>
        <div class="account-modal" id="accountPasswordModal" hidden>
          <div class="account-modal__backdrop" data-account-modal-close="password"></div>
          <div class="account-modal__dialog">
            <form class="account-settings-form account-settings-form--modal" id="accountPasswordForm">
              <div class="account-settings-form__head account-settings-form__head--modal">
                <h4>Set New Password</h4>
                <p>To ensure maximum security for your account, set a new password for your login.</p>
              </div>
              <label class="account-settings-field account-settings-field--modal" for="accountPasswordEmail">
                <span>Email</span>
                <input
                  id="accountPasswordEmail"
                  type="email"
                  value="${escapeHtml(user.email)}"
                  autocomplete="email"
                  readonly
                />
              </label>
              <label class="account-settings-field account-settings-field--modal" for="accountPasswordInput">
                <span>New password</span>
                <span class="account-password-field">
                  <input
                    id="accountPasswordInput"
                    name="newPassword"
                    type="password"
                    minlength="8"
                    autocomplete="new-password"
                    required
                  />
                  <button class="account-password-toggle" type="button" data-account-password-toggle="accountPasswordInput" aria-label="Show password" aria-pressed="false"></button>
                </span>
              </label>
              <label class="account-settings-field account-settings-field--modal" for="accountPasswordConfirmInput">
                <span>Confirm password</span>
                <span class="account-password-field">
                  <input
                    id="accountPasswordConfirmInput"
                    name="confirmPassword"
                    type="password"
                    minlength="8"
                    autocomplete="new-password"
                    required
                  />
                  <button class="account-password-toggle" type="button" data-account-password-toggle="accountPasswordConfirmInput" aria-label="Show password" aria-pressed="false"></button>
                </span>
              </label>
              <p class="account-settings-feedback account-settings-feedback--modal" id="accountPasswordFeedback"></p>
              <div class="account-settings-actions account-settings-actions--modal">
                <button class="btn account-settings-cancel" type="button" data-account-modal-close="password">Cancel</button>
                <button class="btn btn-primary" type="submit">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  applyImageFallbacks(profileRoot);

  const logoutButton = profileRoot.querySelector("[data-profile-logout='true']");
  logoutButton?.addEventListener("click", async () => {
    try {
      if (dqAuth && dqAuth.isConfigured()) {
        await dqAuth.signOut();
      }
    } finally {
      window.location.href = "login.html";
    }
  });

  const emailForm = profileRoot.querySelector("#accountEmailForm");
  const nameForm = profileRoot.querySelector("#accountNameForm");
  const countryForm = profileRoot.querySelector("#accountCountryForm");
  const phoneForm = profileRoot.querySelector("#accountPhoneForm");
  const nameFeedback = profileRoot.querySelector("#accountNameFeedback");
  const countryFeedback = profileRoot.querySelector("#accountCountryFeedback");
  const phoneFeedback = profileRoot.querySelector("#accountPhoneFeedback");
  const emailFeedback = profileRoot.querySelector("#accountEmailFeedback");
  const settingsTriggers = Array.from(profileRoot.querySelectorAll("[data-account-settings-target]"));
  const nameModal = profileRoot.querySelector("#accountNameModal");
  const countryModal = profileRoot.querySelector("#accountCountryModal");
  const phoneModal = profileRoot.querySelector("#accountPhoneModal");
  const emailModal = profileRoot.querySelector("#accountEmailModal");
  const passwordModal = profileRoot.querySelector("#accountPasswordModal");
  const closeButtons = Array.from(profileRoot.querySelectorAll("[data-account-modal-close]"));
  const passwordToggles = Array.from(profileRoot.querySelectorAll("[data-account-password-toggle]"));

  function getAccountModalByTarget(target) {
    if (target === "name") {
      return nameModal;
    }
    if (target === "country") {
      return countryModal;
    }
    if (target === "phone") {
      return phoneModal;
    }
    if (target === "password") {
      return passwordModal;
    }
    return emailModal;
  }

  function closeAccountModal(target) {
    const modal = getAccountModalByTarget(target);
    if (modal instanceof HTMLElement) {
      modal.hidden = true;
    }
    const trigger = profileRoot.querySelector(`[data-account-settings-target="${target}"]`);
    if (trigger instanceof HTMLElement) {
      trigger.classList.remove("is-active");
      trigger.setAttribute("aria-expanded", "false");
    }
  }

  function openAccountModal(target) {
    closeAccountModal("name");
    closeAccountModal("country");
    closeAccountModal("phone");
    closeAccountModal("email");
    closeAccountModal("password");
    const modal = getAccountModalByTarget(target);
    const trigger = profileRoot.querySelector(`[data-account-settings-target="${target}"]`);
    if (modal instanceof HTMLElement) {
      modal.hidden = false;
    }
    if (trigger instanceof HTMLElement) {
      trigger.classList.add("is-active");
      trigger.setAttribute("aria-expanded", "true");
    }
  }

  settingsTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const target = trigger.getAttribute("data-account-settings-target") || "";
      if (!target) {
        return;
      }
      openAccountModal(target);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-account-modal-close") || "email";
      closeAccountModal(target);
    });
  });

  passwordToggles.forEach((button) => {
    const targetId = button.getAttribute("data-account-password-toggle");
    const input = targetId ? profileRoot.querySelector(`#${targetId}`) : null;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    syncAccountPasswordToggle(button, input);
    button.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      syncAccountPasswordToggle(button, input);
    });
  });

  nameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameInput = nameForm.elements.namedItem("fullName");
    const nextName = String(nameInput?.value || "").trim();
    setAccountSettingsFeedback(nameFeedback, "");

    if (!nextName) {
      setAccountSettingsFeedback(nameFeedback, "Enter your full name.", "error");
      return;
    }

    const submitButton = nameForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const client = await dqAuth.getClient();
      const { error: authError } = await client.auth.updateUser({
        data: {
          full_name: nextName,
          phone: user.phone || "",
          country: user.country || "",
        },
      });
      if (authError) {
        throw authError;
      }

      setAccountSettingsFeedback(nameFeedback, "Name updated successfully.", "success");
      await initAuthUi();
    } catch (error) {
      setAccountSettingsFeedback(nameFeedback, error.message || "Could not update name.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });

  countryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const countryInput = countryForm.elements.namedItem("country");
    const nextCountry = String(countryInput?.value || "").trim();
    setAccountSettingsFeedback(countryFeedback, "");

    if (!nextCountry) {
      setAccountSettingsFeedback(countryFeedback, "Enter a country.", "error");
      return;
    }

    const submitButton = countryForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const client = await dqAuth.getClient();
      const { error } = await client.auth.updateUser({
        data: {
          full_name: user.fullName || "",
          phone: user.phone || "",
          country: nextCountry,
        },
      });
      if (error) {
        throw error;
      }

      setAccountSettingsFeedback(countryFeedback, "Country updated successfully.", "success");
      await initAuthUi();
    } catch (error) {
      setAccountSettingsFeedback(countryFeedback, error.message || "Could not update country.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });

  phoneForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phoneInput = phoneForm.elements.namedItem("phone");
    const nextPhone = String(phoneInput?.value || "").trim();
    setAccountSettingsFeedback(phoneFeedback, "");

    if (!isValidPhoneNumber(nextPhone)) {
      setAccountSettingsFeedback(phoneFeedback, "Enter a valid phone number.", "error");
      return;
    }

    const submitButton = phoneForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const client = await dqAuth.getClient();
      const { error: authError } = await client.auth.updateUser({
        data: {
          full_name: user.fullName || "",
          phone: nextPhone,
          country: user.country || "",
        },
      });
      if (authError) {
        throw authError;
      }

      setAccountSettingsFeedback(phoneFeedback, "Phone number updated successfully.", "success");
      await initAuthUi();
    } catch (error) {
      setAccountSettingsFeedback(phoneFeedback, error.message || "Could not update phone number.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });

  emailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = emailForm.elements.namedItem("accountEmail");
    const nextEmail = String(emailInput?.value || "").trim().toLowerCase();
    setAccountSettingsFeedback(emailFeedback, "");

    if (!isValidEmailAddress(nextEmail)) {
      setAccountSettingsFeedback(emailFeedback, "Enter a valid email address.", "error");
      return;
    }

    if (nextEmail === String(user.email || "").trim().toLowerCase()) {
      setAccountSettingsFeedback(emailFeedback, "Enter a different email address to update it.", "error");
      return;
    }

    const submitButton = emailForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const client = await dqAuth.getClient();
      const { error } = await client.auth.updateUser({ email: nextEmail });
      if (error) {
        throw error;
      }
      setAccountSettingsFeedback(
        emailFeedback,
        "Verification email sent to your new address. Open the email and confirm the change.",
        "success"
      );
    } catch (error) {
      setAccountSettingsFeedback(emailFeedback, error.message || "Could not update email.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });

  const passwordForm = profileRoot.querySelector("#accountPasswordForm");
  const passwordFeedback = profileRoot.querySelector("#accountPasswordFeedback");
  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPasswordInput = passwordForm.elements.namedItem("newPassword");
    const confirmPasswordInput = passwordForm.elements.namedItem("confirmPassword");
    const newPassword = String(newPasswordInput?.value || "");
    const confirmPassword = String(confirmPasswordInput?.value || "");
    setAccountSettingsFeedback(passwordFeedback, "");

    if (newPassword.length < 8) {
      setAccountSettingsFeedback(passwordFeedback, "Use a password with at least 8 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setAccountSettingsFeedback(passwordFeedback, "Passwords do not match.", "error");
      return;
    }

    const submitButton = passwordForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const client = await dqAuth.getClient();
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }

      passwordForm.reset();
      setAccountSettingsFeedback(passwordFeedback, "Password updated successfully.", "success");
      passwordToggles.forEach((button) => {
        const targetId = button.getAttribute("data-account-password-toggle");
        const input = targetId ? profileRoot.querySelector(`#${targetId}`) : null;
        if (input instanceof HTMLInputElement) {
          input.type = "password";
          syncAccountPasswordToggle(button, input);
        }
      });
    } catch (error) {
      setAccountSettingsFeedback(passwordFeedback, error.message || "Could not update password.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });

  if (window.location.hash === "#accountMain") {
    profileRoot.querySelector("#accountMain")?.scrollIntoView({ block: "start" });
  }
}

async function renderOrdersPage(user) {
  const ordersRoot = document.getElementById("ordersContent");
  if (!ordersRoot) {
    return;
  }

  if (!user) {
    ordersRoot.innerHTML = `
      <div class="profile-grid account-page-grid">
        <div class="profile-main">
          <article class="card cart-empty">
            <h2>Please log in</h2>
            <p>You need to sign in before viewing your orders.</p>
            <a href="login.html" class="btn btn-primary">Go to Login</a>
          </article>
        </div>
      </div>
    `;
    return;
  }

  if (!dqAuth || !dqAuth.isConfigured()) {
    ordersRoot.innerHTML = `
      <div class="profile-grid account-page-grid">
        <aside class="profile-sidebar">
          <article class="card profile-account-nav profile-account-nav--compact">
            <nav class="profile-account-nav__menu" aria-label="Account menu">
              <a class="user-menu-link" href="profile.html#accountMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
                <span class="user-menu-link__label">Account Information</span>
              </a>
              <div class="user-menu-link user-menu-link--static user-menu-link--accent">
                <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
                <span class="user-menu-link__label">Security</span>
              </div>
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
                <span class="user-menu-link__label">Notification settings</span>
              </div>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("api")}</span>
                <span class="user-menu-link__label">API</span>
              </div>
            </nav>
            <div class="profile-account-nav__footer">
              <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
                <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
                <span class="user-menu-link__label">Log out</span>
              </button>
            </div>
          </article>
        </aside>
        <div class="profile-main" id="ordersMain">
          <div class="account-page-header">
            <h2>Account Activity</h2>
          </div>
          <article class="card cart-empty">
            <h2>Orders unavailable</h2>
            <p>Supabase is not configured correctly.</p>
          </article>
        </div>
      </div>
    `;
    return;
  }

  try {
    const client = await dqAuth.getClient();
    const { data, error } = await client
      .from("orders")
      .select("id, final_amount, discount_amount, amount, status, payment_status, created_at, projects(project_name, template_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const orders = Array.isArray(data) ? data : [];

    if (!orders.length) {
      ordersRoot.innerHTML = `
        <div class="profile-grid account-page-grid">
          <aside class="profile-sidebar">
            <article class="card profile-account-nav profile-account-nav--compact">
              <nav class="profile-account-nav__menu" aria-label="Account menu">
                <a class="user-menu-link" href="profile.html#accountMain">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
                  <span class="user-menu-link__label">Account Information</span>
                </a>
                <div class="user-menu-link user-menu-link--static user-menu-link--accent">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
                  <span class="user-menu-link__label">Security</span>
                </div>
                <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                  <span class="user-menu-link__label">Account Activity</span>
                </a>
                <div class="user-menu-link user-menu-link--static">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
                  <span class="user-menu-link__label">Notification settings</span>
                </div>
                <div class="user-menu-link user-menu-link--static">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("api")}</span>
                  <span class="user-menu-link__label">API</span>
                </div>
              </nav>
              <div class="profile-account-nav__footer">
                <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
                  <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
                  <span class="user-menu-link__label">Log out</span>
                </button>
              </div>
            </article>
          </aside>
          <div class="profile-main" id="ordersMain">
            <div class="account-page-header">
              <h2>Account Activity</h2>
            </div>
            <article class="card cart-empty">
              <h2>No orders yet</h2>
              <p>${escapeHtml(user.fullName)}, your purchased plans will appear here after checkout.</p>
              <a href="pricing.html" class="btn btn-primary">Browse Pricing</a>
            </article>
          </div>
        </div>
      `;
      const logoutButton = ordersRoot.querySelector("[data-profile-logout='true']");
      logoutButton?.addEventListener("click", async () => {
        try {
          if (dqAuth && dqAuth.isConfigured()) {
            await dqAuth.signOut();
          }
        } finally {
          window.location.href = "login.html";
        }
      });
      if (window.location.hash === "#ordersMain") {
        ordersRoot.querySelector("#ordersMain")?.scrollIntoView({ block: "start" });
      }
      return;
    }

    ordersRoot.innerHTML = `
      <div class="profile-grid account-page-grid">
        <aside class="profile-sidebar">
          <article class="card profile-account-nav profile-account-nav--compact">
            <nav class="profile-account-nav__menu" aria-label="Account menu">
              <a class="user-menu-link" href="profile.html#accountMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
                <span class="user-menu-link__label">Account Information</span>
              </a>
              <div class="user-menu-link user-menu-link--static user-menu-link--accent">
                <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
                <span class="user-menu-link__label">Security</span>
              </div>
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
                <span class="user-menu-link__label">Notification settings</span>
              </div>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("api")}</span>
                <span class="user-menu-link__label">API</span>
              </div>
            </nav>
            <div class="profile-account-nav__footer">
              <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
                <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
                <span class="user-menu-link__label">Log out</span>
              </button>
            </div>
          </article>
        </aside>
        <div class="profile-main" id="ordersMain">
          <div class="account-page-header">
            <h2>Account Activity</h2>
          </div>
          <div class="orders-list">
            ${orders
              .map((order) => {
                const title = order.projects?.project_name || order.projects?.template_id || "Website Plan";
                const createdAt = order.created_at ? new Date(order.created_at).toLocaleString() : "Unknown date";
                return `
                  <article class="card order-card">
                    <div class="order-card-top">
                      <div>
                        <h3>${escapeHtml(title)}</h3>
                        <p class="order-id">Order #${escapeHtml(String(order.id || "").slice(0, 8))}</p>
                      </div>
                      <div class="order-badges">
                        <span class="${getOrderStatusClass(order.status)}">${escapeHtml(getOrderStatusLabel(order.status))}</span>
                        <span class="${getPaymentStatusClass(order.payment_status)}">Payment: ${escapeHtml(getPaymentStatusLabel(order.payment_status))}</span>
                      </div>
                    </div>
                    <div class="order-card-grid">
                      <div class="order-card-item">
                        <span>Total</span>
                        <strong>${formatInr(order.final_amount || 0)}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Original Amount</span>
                        <strong>${formatInr(order.amount || 0)}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Discount</span>
                        <strong>${formatInr(order.discount_amount || 0)}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Purchased On</span>
                        <strong>${escapeHtml(createdAt)}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Payment</span>
                        <strong>${escapeHtml(getPaymentStatusLabel(order.payment_status))}</strong>
                      </div>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
    const logoutButton = ordersRoot.querySelector("[data-profile-logout='true']");
    logoutButton?.addEventListener("click", async () => {
      try {
        if (dqAuth && dqAuth.isConfigured()) {
          await dqAuth.signOut();
        }
      } finally {
        window.location.href = "login.html";
      }
    });
    if (window.location.hash === "#ordersMain") {
      ordersRoot.querySelector("#ordersMain")?.scrollIntoView({ block: "start" });
    }
  } catch (error) {
    ordersRoot.innerHTML = `
      <div class="profile-grid account-page-grid">
        <aside class="profile-sidebar">
          <article class="card profile-account-nav profile-account-nav--compact">
            <nav class="profile-account-nav__menu" aria-label="Account menu">
              <a class="user-menu-link" href="profile.html#accountMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
                <span class="user-menu-link__label">Account Information</span>
              </a>
              <div class="user-menu-link user-menu-link--static user-menu-link--accent">
                <span class="user-menu-link__icon">${renderUserMenuIcon("security")}</span>
                <span class="user-menu-link__label">Security</span>
              </div>
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("notifications")}</span>
                <span class="user-menu-link__label">Notification settings</span>
              </div>
              <div class="user-menu-link user-menu-link--static">
                <span class="user-menu-link__icon">${renderUserMenuIcon("api")}</span>
                <span class="user-menu-link__label">API</span>
              </div>
            </nav>
            <div class="profile-account-nav__footer">
              <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
                <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
                <span class="user-menu-link__label">Log out</span>
              </button>
            </div>
          </article>
        </aside>
        <div class="profile-main" id="ordersMain">
          <div class="account-page-header">
            <h2>Account Activity</h2>
          </div>
          <article class="card cart-empty">
            <h2>Could not load orders</h2>
            <p>${escapeHtml(error.message || "Unknown error")}</p>
          </article>
        </div>
      </div>
    `;
    const logoutButton = ordersRoot.querySelector("[data-profile-logout='true']");
    logoutButton?.addEventListener("click", async () => {
      try {
        if (dqAuth && dqAuth.isConfigured()) {
          await dqAuth.signOut();
        }
      } finally {
        window.location.href = "login.html";
      }
    });
    if (window.location.hash === "#ordersMain") {
      ordersRoot.querySelector("#ordersMain")?.scrollIntoView({ block: "start" });
    }
  }
}

function renderPlanDetailsPage() {
  if (!planDetailsRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const planKey = params.get("plan") || readSelectedPlan();
  const plan = getPlanByKey(planKey);
  const requirementsPage = getPlanRequirementsPagePath(planKey);

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
  const appliedCoupon = getStoredPlanCoupon(planKey);
  const pricing = getPlanPricingWithCoupon(plan, appliedCoupon);

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
        <form id="planCouponForm" class="plan-coupon-panel">
          <label for="planCouponCode">Coupon Code</label>
          <div class="plan-coupon-inline">
            <input
              id="planCouponCode"
              name="planCouponCode"
              type="text"
              class="plan-coupon-input"
              placeholder="Enter coupon code"
              value="${escapeHtml(appliedCoupon?.coupon_code || "")}"
            />
            <button class="btn btn-secondary" type="submit" id="applyPlanCouponBtn">Apply</button>
          </div>
          <button class="btn btn-secondary plan-coupon-clear" type="button" id="clearPlanCouponBtn" ${appliedCoupon ? "" : "hidden"}>Remove Coupon</button>
          <p class="plan-coupon-feedback" id="planCouponFeedback" data-state="info">Enter a valid coupon code to recalculate your total instantly.</p>
        </form>
        <div class="plan-summary-row">
          <span id="planCouponLabel">${escapeHtml(appliedCoupon ? `Coupon (${appliedCoupon.coupon_code})` : "Coupon Discount")}</span>
          <strong id="planCouponDiscountValue">${pricing.discountAmount ? `- ${formatInr(pricing.discountAmount)}` : formatInr(0)}</strong>
        </div>
        <div class="plan-summary-row total">
          <span>Total Pricing</span>
          <strong id="planFinalTotal">${formatInr(pricing.finalAmount)}</strong>
        </div>
        <p class="plan-note">Hosting and listed package features remain included in the selected plan.</p>
        <p class="plan-feedback" id="planFeedback">Add this package to your cart to keep it saved while you continue browsing.</p>
        <div class="plan-actions">
          <button class="btn btn-secondary" type="button" data-plan-add="${escapeHtml(planKey)}">Add to Cart</button>
          <a href="${requirementsPage || "pricing.html"}" class="btn btn-primary" data-plan-buy-link="${escapeHtml(planKey)}">Proceed to Buy</a>
        </div>
      </article>
    </div>
  `;

  const couponForm = document.getElementById("planCouponForm");
  const clearCouponButton = document.getElementById("clearPlanCouponBtn");
  couponForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const couponInput = document.getElementById("planCouponCode");
    const applyButton = document.getElementById("applyPlanCouponBtn");
    const couponCode = normalizeCouponCode(couponInput?.value);
    if (!couponCode) {
      setPlanCouponFeedback("Enter a coupon code first.", "error");
      return;
    }

    try {
      if (applyButton instanceof HTMLButtonElement) {
        applyButton.disabled = true;
        applyButton.textContent = "Checking...";
      }

      const coupon = await fetchCouponByCode(couponCode);
      const validationError = getCouponValidationError(coupon);
      if (validationError) {
        throw new Error(validationError);
      }

      setStoredPlanCoupon(planKey, coupon);
      syncPlanCouponUi(planKey);
      setPlanCouponFeedback(`Coupon ${couponCode} applied successfully.`, "success");
    } catch (error) {
      setPlanCouponFeedback(error.message || "Could not apply coupon right now.", "error");
    } finally {
      if (applyButton instanceof HTMLButtonElement) {
        applyButton.disabled = false;
        applyButton.textContent = "Apply";
      }
    }
  });

  clearCouponButton?.addEventListener("click", () => {
    clearStoredPlanCoupon(planKey);
    syncPlanCouponUi(planKey);
    setPlanCouponFeedback("Coupon removed.", "info");
  });

  syncPlanCouponUi(planKey);
  revalidateStoredPlanCoupon(planKey, { silent: true }).catch((error) => {
    console.error("Could not revalidate stored coupon:", error);
  });
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

function renderCheckboxGroup(name, options, otherFieldName) {
  const checkboxes = options
    .map(
      (option) => `
        <label class="plan-check-option">
          <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(option)}" />
          <span>${escapeHtml(option)}</span>
        </label>
      `
    )
    .join("");

  const otherField = otherFieldName
    ? `
      <div class="field-block">
        <label for="${escapeHtml(otherFieldName)}">Other</label>
        <input id="${escapeHtml(otherFieldName)}" name="${escapeHtml(otherFieldName)}" type="text" placeholder="Add other requirement" />
      </div>
    `
    : "";

  return `
    <div class="plan-check-grid">
      ${checkboxes}
    </div>
    ${otherField}
  `;
}

function readCheckboxValues(formData, fieldName) {
  return formData
    .getAll(fieldName)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function getPlanSuccessModalMessageNodes() {
  const modal = ensurePlanSuccessModal();
  return {
    modal,
    title: modal.querySelector("[data-plan-success-title]"),
    message: modal.querySelector("[data-plan-success-message]"),
  };
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (loadRazorpayCheckout.promise) {
    return loadRazorpayCheckout.promise;
  }

  loadRazorpayCheckout.promise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Razorpay), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
    document.head.appendChild(script);
  });

  return loadRazorpayCheckout.promise;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error((data && data.error) || "Request failed.");
  }

  return data;
}

async function getAuthAccessToken() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    return "";
  }

  const session = typeof dqAuth.getSession === "function" ? await dqAuth.getSession() : null;
  return session?.access_token || "";
}

async function createPlanPaymentOrder(payload) {
  const accessToken = await getAuthAccessToken();
  if (!accessToken) {
    throw new Error("Please sign in again before continuing.");
  }

  return fetchJson("/api/payments/razorpay/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

async function verifyPlanPayment(payload) {
  const accessToken = await getAuthAccessToken();
  if (!accessToken) {
    throw new Error("Please sign in again before verifying payment.");
  }

  return fetchJson("/api/payments/razorpay/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

async function openRazorpayCheckout(checkoutData) {
  await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "function") {
      reject(new Error("Razorpay checkout is unavailable."));
      return;
    }

    let settled = false;

    const finish = (callback) => (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      callback(payload);
    };

    const razorpay = new window.Razorpay({
      key: checkoutData.razorpayKeyId,
      amount: checkoutData.razorpayOrder?.amount,
      currency: checkoutData.razorpayOrder?.currency || "INR",
      name: "DigitQuo",
      description: `${checkoutData.planName || "Website"} Payment`,
      order_id: checkoutData.razorpayOrder?.id,
      prefill: {
        name: checkoutData.customer?.name || "",
        email: checkoutData.customer?.email || "",
        contact: checkoutData.customer?.phone || "",
      },
      notes: {
        site_order_id: checkoutData.siteOrderId || "",
        project_id: checkoutData.projectId || "",
        plan_key: checkoutData.planKey || "",
      },
      theme: {
        color: "#0d2f6f",
      },
      modal: {
        ondismiss: finish(() => reject(new Error("Payment was cancelled."))),
      },
      handler: finish((response) => resolve(response)),
    });

    razorpay.on(
      "payment.failed",
      finish((event) => {
        reject(new Error(event?.error?.description || "Payment failed."));
      })
    );

    razorpay.open();
  });
}

function ensurePlanSuccessModal() {
  let modal = document.getElementById("planSuccessModal");
  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "plan-success-modal";
  modal.id = "planSuccessModal";
  modal.setAttribute("hidden", "");
  modal.innerHTML = `
    <div class="plan-success-dialog">
      <h3 data-plan-success-title>Submission Received</h3>
      <p data-plan-success-message>Our team will contact you soon.</p>
      <a class="btn btn-primary" href="index.html" id="planSuccessHomeBtn">Home</a>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function showPlanSuccessModal(options = {}) {
  const { modal, title, message } = getPlanSuccessModalMessageNodes();
  const homeButton = document.getElementById("planSuccessHomeBtn");

  if (title) {
    title.textContent = options.title || "Submission Received";
  }

  if (message) {
    message.textContent = options.message || "Our team will contact you soon.";
  }

  window.clearTimeout(showPlanSuccessModal.timeoutId);
  modal.removeAttribute("hidden");
  homeButton?.addEventListener(
    "click",
    () => {
      window.clearTimeout(showPlanSuccessModal.timeoutId);
    },
    { once: true }
  );
  showPlanSuccessModal.timeoutId = window.setTimeout(() => {
    window.location.href = "index.html";
  }, 5000);
}

function renderPlanRequirementsPage(user) {
  if (!planRequirementsRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const pagePlanKey = planRequirementsRoot.dataset.planKey || "";
  const planKey = pagePlanKey || params.get("plan") || readSelectedPlan();
  const plan = getPlanByKey(planKey);
  const requirementsPage = getPlanRequirementsPagePath(planKey);

  if (!plan) {
    planRequirementsRoot.innerHTML = `
      <article class="card cart-empty">
        <h1 class="section-title">Plan Not Found</h1>
        <p class="section-subtitle">Choose a package first before filling the project requirement form.</p>
        <a href="pricing.html" class="btn btn-primary">Back to Pricing</a>
      </article>
    `;
    return;
  }

  if (!user) {
    window.location.href = `login.html?redirect=${encodeURIComponent(requirementsPage || "pricing.html")}`;
    return;
  }

  saveSelectedPlan(planKey);
  const appliedCoupon = getStoredPlanCoupon(planKey);
  const pricing = getPlanPricingWithCoupon(plan, appliedCoupon);

  const showBasicSection = planKey === "basic" || planKey === "business" || planKey === "professional";
  const showBusinessSection = planKey === "business" || planKey === "professional";
  const showProfessionalSection = planKey === "professional";
  const showEcommerceSection = planKey === "ecommerce" || planKey === "advanced-ecommerce";
  const showAdvancedEcommerceSection = planKey === "advanced-ecommerce";

  planRequirementsRoot.innerHTML = `
    <div class="plan-form-layout">
      <article class="card plan-form-card">
        <span class="eyebrow">Website Requirements Form</span>
        <h1 class="section-title">${escapeHtml(plan.name)}</h1>
        <p class="section-subtitle">Fill in your project requirements. When you click Continue, the Razorpay payment gateway opens. After successful payment, our team will contact you soon.</p>

        <form id="planRequirementsForm" class="contact-form">
          <div class="field-row">
            <div class="field-block">
              <label for="planCustomerName">Full Name</label>
              <input id="planCustomerName" name="customerName" type="text" value="${escapeHtml(user.fullName || "")}" required />
            </div>
            <div class="field-block">
              <label for="planCustomerEmail">Email</label>
              <input id="planCustomerEmail" name="customerEmail" type="email" value="${escapeHtml(user.email || "")}" readonly required />
            </div>
          </div>

          <div class="field-block">
            <label for="planCustomerPhone">Phone</label>
            <input id="planCustomerPhone" name="customerPhone" type="tel" value="${escapeHtml(user.phone || "")}" placeholder="+91 98765 43210" required />
          </div>

          <div class="field-block">
            <label for="projectName">Project name</label>
            <input id="projectName" name="projectName" type="text" placeholder="Enter your project name" required />
          </div>

          ${
            showBasicSection
              ? `
                <div class="plan-form-section">
                  <h3>The Starter Requirements</h3>
                  <div class="field-block">
                    <label for="websiteIdea">Describe your website idea</label>
                    <textarea id="websiteIdea" name="websiteIdea" required></textarea>
                  </div>
                  <div class="field-block">
                    <label for="businessDetails">Business details to show (About / Services / Contact)</label>
                    <textarea id="businessDetails" name="businessDetails" required></textarea>
                  </div>
                  <div class="field-block">
                    <label for="pageCount">Number of pages required (Up to 5)</label>
                    <input id="pageCount" name="pageCount" type="text" placeholder="Example: 5 pages" required />
                  </div>
                </div>
              `
              : ""
          }

          ${
            showBusinessSection
              ? `
                <div class="plan-form-section">
                  <h3>The Professional Requirements</h3>
                  <div class="field-block">
                    <label for="additionalSections">Additional pages or sections required (Gallery / Testimonials / FAQ / Team / Offers etc.)</label>
                    <textarea id="additionalSections" name="additionalSections" placeholder="Gallery, Testimonials, FAQ, Team, Offers..."></textarea>
                  </div>
                  <div class="field-row">
                    <div class="field-block">
                      <label for="needsBlog">Do you need Blog setup?</label>
                      <select id="needsBlog" name="needsBlog">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div class="field-block">
                      <label for="needsGoogleMap">Do you need Google Map integration?</label>
                      <select id="needsGoogleMap" name="needsGoogleMap">
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                  <div class="field-block">
                    <label for="needsBasicSeo">Do you need Basic SEO setup?</label>
                    <select id="needsBasicSeo" name="needsBasicSeo">
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              `
              : ""
          }

          ${
            showProfessionalSection
              ? `
                <div class="plan-form-section">
                  <h3>Professional Plus Requirements</h3>
                  <div class="field-block">
                    <label for="designReference">Do you need custom UI/UX design or reference websites?</label>
                    <textarea id="designReference" name="designReference"></textarea>
                  </div>
                  <div class="field-block">
                    <label>Advanced features required</label>
                    ${renderCheckboxGroup(
                      "professionalFeatures",
                      [
                        "Login / Signup",
                        "Booking / Appointment System",
                        "Speed Optimization",
                        "Advanced SEO",
                        "Third-party Integrations",
                      ],
                      "professionalOtherFeature"
                    )}
                  </div>
                  <div class="field-block">
                    <label for="approxPagesModules">Approx total pages / modules required</label>
                    <input id="approxPagesModules" name="approxPagesModules" type="text" />
                  </div>
                </div>
              `
              : ""
          }

          ${
            showEcommerceSection
              ? `
                <div class="plan-form-section">
                  <h3>${planKey === "advanced-ecommerce" ? "Enterprise Plus Requirements" : "Enterprise Requirements"}</h3>
                  <div class="field-block">
                    <label for="storeIdea">Describe your online store idea</label>
                    <textarea id="storeIdea" name="storeIdea" required></textarea>
                  </div>
                  <div class="field-row">
                    <div class="field-block">
                      <label for="initialProducts">Number of products to upload initially</label>
                      <input id="initialProducts" name="initialProducts" type="text" required />
                    </div>
                    <div class="field-block">
                      <label for="categories">Product categories required</label>
                      <input id="categories" name="categories" type="text" required />
                    </div>
                  </div>
                  ${
                    showAdvancedEcommerceSection
                      ? `
                        <div class="field-block">
                          <label for="futureScaling">Expected number of products in future scaling</label>
                          <input id="futureScaling" name="futureScaling" type="text" />
                        </div>
                      `
                      : ""
                  }
                  <div class="field-block">
                    <label>${showAdvancedEcommerceSection ? "Advanced ecommerce features required" : "Required ecommerce features"}</label>
                    ${renderCheckboxGroup(
                      showAdvancedEcommerceSection ? "advancedEcommerceFeatures" : "ecommerceFeatures",
                      showAdvancedEcommerceSection
                        ? [
                            "Cart System",
                            "Checkout Page",
                            "Payment Gateway Integration",
                            "Order Confirmation Email",
                            "Customer Login",
                            "Product Search & Filters",
                            "Coupon / Discount System",
                            "Booking / Appointment System",
                            "Admin Panel",
                            "Dashboard",
                            "Speed Optimization",
                            "Advanced SEO",
                            "Third-party Integrations",
                            "Advanced Analytics & Reports",
                            "Abandoned Cart Recovery",
                            "Custom Admin Dashboard",
                          ]
                        : [
                            "Cart System",
                            "Checkout Page",
                            "Payment Gateway Integration",
                            "Order Confirmation Email",
                            "Customer Login",
                            "Product Search & Filters",
                            "Booking / Appointment System",
                            "Admin Panel",
                            "Dashboard",
                            "Speed Optimization",
                            "Advanced SEO",
                            "Third-party Integrations",
                          ],
                      showAdvancedEcommerceSection ? "advancedEcommerceOtherFeature" : "ecommerceOtherFeature"
                    )}
                  </div>
                </div>
              `
              : ""
          }

          <div class="plan-form-actions">
            <button type="submit" class="btn btn-primary">Pay Now</button>
            <a href="plan-details.html?plan=${escapeHtml(planKey)}" class="btn btn-secondary">Back</a>
          </div>
        </form>
      </article>

      <aside class="plan-form-sidebar">
        <article class="card">
          <h2>Selected Plan</h2>
          <p class="plan-form-price" id="planRequirementFinalAmount">${formatInr(pricing.finalAmount)}</p>
          <div class="plan-form-summary-row">
            <span>Original Price</span>
            <strong id="planRequirementBaseAmount">${formatInr(pricing.baseAmount)}</strong>
          </div>
          <div class="plan-form-summary-row" id="planRequirementCouponRow" ${appliedCoupon ? "" : "hidden"}>
            <span id="planRequirementCouponLabel">${escapeHtml(appliedCoupon ? `Coupon (${appliedCoupon.coupon_code})` : "Coupon Discount")}</span>
            <strong id="planRequirementCouponValue">${pricing.discountAmount ? `- ${formatInr(pricing.discountAmount)}` : formatInr(0)}</strong>
          </div>
          <p class="plan-form-coupon-note" id="planRequirementCouponNote">
            ${
              appliedCoupon
                ? `${escapeHtml(appliedCoupon.coupon_code)} will be revalidated before payment is created.`
                : "Apply a coupon on the plan details page to see the discount here."
            }
          </p>
          <ul class="plan-feature-list">
            ${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
          </ul>
        </article>
      </aside>
    </div>
  `;

  const form = document.getElementById("planRequirementsForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!dqAuth || !dqAuth.isConfigured()) {
      window.location.href = "login.html";
      return;
    }

    const client = await dqAuth.getClient();
    const profile = typeof dqAuth.getCurrentProfile === "function" ? await dqAuth.getCurrentProfile() : null;
    if (!client || !profile?.id) {
      window.location.href = "login.html";
      return;
    }

    const formData = new FormData(form);
    const customerName = String(formData.get("customerName") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const customerPhone = String(formData.get("customerPhone") || "").trim();
    const projectName = String(formData.get("projectName") || "").trim();

    const requirements = {
      basic: {
        websiteIdea: String(formData.get("websiteIdea") || "").trim(),
        businessDetails: String(formData.get("businessDetails") || "").trim(),
        pageCount: String(formData.get("pageCount") || "").trim(),
      },
      business: showBusinessSection
        ? {
            additionalSections: String(formData.get("additionalSections") || "").trim(),
            needsBlog: String(formData.get("needsBlog") || "").trim(),
            needsGoogleMap: String(formData.get("needsGoogleMap") || "").trim(),
            needsBasicSeo: String(formData.get("needsBasicSeo") || "").trim(),
          }
        : null,
      professional: showProfessionalSection
        ? {
            designReference: String(formData.get("designReference") || "").trim(),
            features: readCheckboxValues(formData, "professionalFeatures"),
            otherFeature: String(formData.get("professionalOtherFeature") || "").trim(),
            approxPagesModules: String(formData.get("approxPagesModules") || "").trim(),
          }
        : null,
      ecommerce: showEcommerceSection
        ? {
            storeIdea: String(formData.get("storeIdea") || "").trim(),
            initialProducts: String(formData.get("initialProducts") || "").trim(),
            categories: String(formData.get("categories") || "").trim(),
            features: readCheckboxValues(formData, "ecommerceFeatures"),
            otherFeature: String(formData.get("ecommerceOtherFeature") || "").trim(),
          }
        : null,
      advancedEcommerce: showAdvancedEcommerceSection
        ? {
            futureScaling: String(formData.get("futureScaling") || "").trim(),
            features: readCheckboxValues(formData, "advancedEcommerceFeatures"),
            otherFeature: String(formData.get("advancedEcommerceOtherFeature") || "").trim(),
          }
        : null,
    };

      const ideaSummary =
        requirements.ecommerce?.storeIdea ||
        requirements.basic.websiteIdea ||
        `${plan.name} Requirement`;

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = "Opening Payment...";
      }

      const checkoutData = await createPlanPaymentOrder({
        planKey,
        customerName,
        customerEmail,
        customerPhone,
        projectName,
        ideaSummary,
        couponCode: getStoredPlanCoupon(planKey)?.coupon_code || "",
        requirements,
      });

      const paymentResponse = await openRazorpayCheckout(checkoutData);

      if (submitButton instanceof HTMLButtonElement) {
        submitButton.textContent = "Verifying Payment...";
      }

      await verifyPlanPayment({
        siteOrderId: checkoutData.siteOrderId,
        projectId: checkoutData.projectId,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      removeCartItem(planKey);
      clearStoredPlanCoupon(planKey);
      showPlanSuccessModal({
        title: "Payment Received",
        message: "Our team will contact you soon.",
      });
    } catch (error) {
      showCartToast(error.message || "Could not start the payment.");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Pay Now";
      }
    }
  });

  syncPlanCouponUi(planKey);
  revalidateStoredPlanCoupon(planKey, { silent: true }).catch((error) => {
    console.error("Could not revalidate stored coupon:", error);
  });
}

function mergeUserAndProfile(user, profile) {
  if (!user && !profile) {
    return null;
  }

  return {
    id: profile?.id || user?.id || "",
    email: user?.email || profile?.email || "",
    fullName: profile?.full_name || user?.fullName || user?.email || "User",
    phone: profile?.phone || user?.phone || "",
    country: profile?.country || user?.country || user?.address || "",
    profilePhoto: profile?.profile_photo || user?.profilePhoto || "",
    role: profile?.role || "",
    subscriptionPlan: profile?.subscription_plan || "",
  };
}

async function initAuthUi() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    activeReviewIsAdmin = false;
    syncReviewAccess(null);
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    updatePlanBuyLinks(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderOrdersPage(null);
    renderQuoteRequestPage(null);
    renderPlanRequirementsPage(null);
    return;
  }

  try {
    const rawUser = await dqAuth.getCurrentUser();
    const profile = typeof dqAuth.getCurrentProfile === "function" ? await dqAuth.getCurrentProfile() : null;
    const user = mergeUserAndProfile(rawUser, profile);
    if (!user) {
      activeReviewIsAdmin = false;
      syncReviewAccess(null);
      bindPortfolioQuoteTrigger(null);
      updateQuoteActionLinks(null);
      updatePlanBuyLinks(null);
      renderCartPage(null);
      renderProfilePage(null);
      renderOrdersPage(null);
      renderQuoteRequestPage(null);
      renderPlanRequirementsPage(null);
      return;
    }

    activeReviewIsAdmin = typeof dqAuth.checkAdminAccess === "function"
      ? await dqAuth.checkAdminAccess()
      : false;
    syncReviewAccess(user);
    syncAllReviewCardControls();
    bindPortfolioQuoteTrigger(user);
    updateQuoteActionLinks(user);
    updatePlanBuyLinks(user);
    buildProfileMenu(user);
    renderCartPage(user);
    renderProfilePage(user);
    renderOrdersPage(user);
    renderQuoteRequestPage(user);
    renderPlanRequirementsPage(user);
  } catch {
    activeReviewIsAdmin = false;
    syncReviewAccess(null);
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    updatePlanBuyLinks(null);
    renderCartPage(null);
    renderProfilePage(null);
    renderOrdersPage(null);
    renderQuoteRequestPage(null);
    renderPlanRequirementsPage(null);
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
initAutoTechRows();
window.addEventListener("load", initAutoTechRows, { once: true });
window.addEventListener("resize", initAutoTechRows);
