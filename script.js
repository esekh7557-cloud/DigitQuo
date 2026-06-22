const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const mobileLogin = document.querySelector(".mobile-login");
const navCta = document.querySelector(".nav-cta");
const navbar = document.querySelector(".navbar");
const contactForm = document.getElementById("contactForm");
const portfolioQuoteLink = document.getElementById("portfolioQuoteLink");
const quoteRequestForm = document.getElementById("quoteRequestForm");
const cartRoot = document.getElementById("cartContent");
const planDetailsRoot = document.getElementById("planDetailsRoot");
const planRequirementsRoot = document.getElementById("planRequirementsRoot");
const pricingPlansSection = document.getElementById("pricingPlans");
const quoteRequestRoot = document.getElementById("quoteRequestRoot");
const customPlanRoot = document.getElementById("customPlanRoot");
const customPlanForm = document.getElementById("customPlanForm");
const CART_STORAGE_KEY = "dq_cart_items";
const SELECTED_PLAN_STORAGE_KEY = "dq_selected_plan";
const PLAN_COUPONS_STORAGE_KEY = "dq_plan_coupons";
const PLAN_ADDONS_STORAGE_KEY = "dq_plan_addons";
const DISPLAY_CURRENCY_STORAGE_KEY = "dq_display_currency";
const dqAuth = window.dqAuth;
let currentUiUser = null;
let authUiSubscriptionBound = false;
let displayCurrencyRatesCache = null;
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
    question: "7. Do you provide e-commerce functionality?",
    answer:
      "<p>Yes. We can build fully functional online stores with payment gateway integration, product management, order tracking, and email notifications.</p>",
  },
  {
    question: "8. What happens after the project is completed?",
    answer:
      "<p>We perform final deployment and testing. After handover:</p><ul><li>Domain ownership is transferred if purchased via us</li><li>Client must follow deployment and hosting guidelines</li><li>Optional maintenance support can be continued</li></ul>",
  },
  {
    question: "9. Do you offer revisions?",
    answer:
      "<p>Yes. Limited revisions are included depending on the selected plan. Additional revisions or major changes may involve extra cost.</p>",
  },
  {
    question: "10. What are your payment terms?",
    answer:
      "<p>Typically, an advance payment is required to start the project and the remaining payment is due before final deployment or handover.</p>",
  },
  {
    question: "11. Do you provide website maintenance?",
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

function ensureMainPagesWhatsAppFab() {
  const currentPath = String(window.location.pathname || "").toLowerCase();
  const currentPage = currentPath.split("/").filter(Boolean).pop() || "index.html";
  const allowedPages = new Set([
    "index.html",
    "services.html",
    "portfolio.html",
    "about.html",
    "pricing.html",
    "contact.html",
  ]);

  if (!allowedPages.has(currentPage) || document.querySelector(".site-whatsapp-fab")) {
    return;
  }

  const fab = document.createElement("a");
  fab.href = "https://wa.me/918177957990";
  fab.className = "site-whatsapp-fab";
  fab.target = "_blank";
  fab.rel = "noopener noreferrer";
  fab.setAttribute("aria-label", "Chat with DigitQuo on WhatsApp");
  fab.innerHTML = `
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 8.016 0a7.94 7.94 0 0 0-6.728 12.111L0 16l4.044-1.328A7.96 7.96 0 0 0 8.016 16h.003a7.94 7.94 0 0 0 5.582-13.674zM8.019 14.57a6.55 6.55 0 0 1-3.343-.92l-.24-.144-2.398.787.783-2.338-.156-.24a6.57 6.57 0 0 1 1.007-8.283 6.47 6.47 0 0 1 4.35-1.68h.002a6.52 6.52 0 0 1 4.646 1.927 6.45 6.45 0 0 1 1.889 4.61 6.57 6.57 0 0 1-6.54 6.281z"></path>
      <path d="M11.608 9.885c-.196-.098-1.17-.578-1.35-.647-.18-.066-.311-.098-.442.098-.131.197-.508.647-.623.779-.114.131-.229.147-.425.05-.197-.099-.833-.306-1.587-.977-.587-.522-.983-1.166-1.098-1.364-.114-.197-.012-.304.086-.402.088-.114.197-.295.295-.442.098-.147.131-.246.197-.41.066-.164.033-.307-.016-.43-.05-.131-.442-1.058-.606-1.446-.16-.39-.327-.335-.442-.341a4.8 4.8 0 0 0-.377-.006c-.131 0-.344.05-.524.246-.18.197-.688.672-.688 1.64s.704 1.902.802 2.033c.098.131 1.388 2.105 3.36 2.952.47.205.84.328 1.127.42.474.15.904.129 1.246.08.38-.058 1.17-.48 1.334-.943.164-.462.164-.859.115-.943-.05-.082-.18-.131-.377-.229z"></path>
    </svg>
  `;

  document.body.appendChild(fab);
}

const PLAN_DETAILS = {
  basic: {
    name: "The Starter",
    oldPrice: 11000,
    subtotal: 8999,
    usdSubtotal: 99,
    domainPrice: 999,
    addOns: [
      {
        id: "hosting",
        name: "Hosting",
        description: "Launch support with hosting setup, SSL, and deployment assistance.",
        kind: "hosting",
        price: 4000,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "1-3 Pages Website",
      "Delivery in 5-7 days",
      "Mobile Responsive",
      "Contact Form",
      "Free SSL",
      ".in Domain",
    ],
  },
  business: {
    name: "The Professional",
    oldPrice: 14000,
    subtotal: 10599,
    usdSubtotal: 119,
    domainPrice: 999,
    addOns: [
      {
        id: "hosting",
        name: "Hosting",
        description: "Launch support with hosting setup, SSL, and deployment assistance.",
        kind: "hosting",
        price: 4000,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "5-7 Pages Website",
      "Delivery in 6-8 days",
      "Professional Design",
      "Contact Forms",
      "Google Map",
      "Basic SEO",
      "Domain",
    ],
  },
  professional: {
    name: "Professional Plus",
    oldPrice: 18000,
    subtotal: 12999,
    usdSubtotal: 139,
    domainPrice: 999,
    addOns: [
      {
        id: "hosting",
        name: "Hosting",
        description: "Launch support with hosting setup, SSL, and deployment assistance.",
        kind: "hosting",
        price: 4000,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "8-12 Pages Website",
      "Delivery in 6-8 days",
      "Premium UI Design",
      "Blog System",
      "SEO Setup",
      "Social Media Integration",
      "Domain",
    ],
  },
  ecommerce: {
    name: "Enterprise",
    oldPrice: 33000,
    subtotal: 22999,
    usdSubtotal: 249,
    domainPrice: 999,
    addOns: [
      {
        id: "vps-hosting",
        name: "VPS Hosting",
        description: "Higher-performance hosting for stores, portals, and heavier traffic.",
        kind: "hosting",
        price: 17000,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Online Store",
      "Up to 50 Products",
      "Delivery in 10-13 days",
      "Payment Gateway",
      "Cart & Checkout",
      "Admin Panel",
      "Domain",
    ],
  },
  "advanced-ecommerce": {
    name: "Enterprise Plus",
    oldPrice: 53000,
    subtotal: 32999,
    usdSubtotal: 349,
    domainPrice: 999,
    addOns: [
      {
        id: "vps-hosting",
        name: "VPS Hosting",
        description: "Higher-performance hosting for stores, portals, and heavier traffic.",
        kind: "hosting",
        price: 17000,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Unlimited Products",
      "Delivery in 10-13 days",
      "Advanced Admin Panel",
      "Payment Gateway",
      "Coupons",
      "Shipping Integration",
      "Domain",
    ],
  },
  "bot-basic": {
    name: "Basic Bot",
    oldPrice: 699,
    subtotal: 699,
    usdSubtotal: 6.99,
    breakdown: [{ label: "Bot Development", amount: 699 }],
    detailsDescription: "This pricing covers the selected Discord bot build and any optional setup add-ons.",
    requirementsDescription:
      "Fill in your bot requirements. When you click Continue, the Razorpay payment gateway opens. After successful payment, our team will contact you soon.",
    addOns: [
      {
        id: "bot-hosting-basic",
        name: "Bot Hosting Setup",
        description: "Set up the first month of hosting so your bot can go live with basic uptime support.",
        kind: "hosting",
        price: 199,
      },
      {
        id: "bot-maintenance-starter",
        name: "Starter Maintenance Setup",
        description: "Reserve the first month of minor fixes and light tweaks after delivery.",
        kind: "maintenance",
        price: 299,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Basic custom bot",
      "5-10 commands",
      "Delivery in 3-5 days",
      "Welcome system",
      "Auto roles",
      "Basic moderation",
      "Simple embeds",
      "3-5 days support",
    ],
  },
  "bot-standard": {
    name: "Community Bot",
    oldPrice: 1899,
    subtotal: 1899,
    usdSubtotal: 19,
    breakdown: [{ label: "Bot Development", amount: 1899 }],
    detailsDescription: "This pricing covers the selected Discord bot build and any optional setup add-ons.",
    requirementsDescription:
      "Fill in your bot requirements. When you click Continue, the Razorpay payment gateway opens. After successful payment, our team will contact you soon.",
    addOns: [
      {
        id: "bot-hosting-premium",
        name: "Premium Bot Hosting Setup",
        description: "Set up a stronger hosting tier for active Discord communities and higher uptime needs.",
        kind: "hosting",
        price: 499,
      },
      {
        id: "bot-feature-updates",
        name: "Feature Update Retainer",
        description: "Reserve the first month of post-launch feature tuning and smaller iterations.",
        kind: "maintenance",
        price: 599,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Everything in Starter",
      "Ticket system",
      "Delivery in 5-7 days",
      "Leveling or economy system",
      "Logs and automod",
      "Reaction roles",
      "Database support",
      "Custom embeds",
      "7-14 days support",
    ],
  },
  "bot-premium": {
    name: "Professional Custom Bot",
    oldPrice: 5499,
    subtotal: 5499,
    usdSubtotal: 59,
    breakdown: [{ label: "Bot Development", amount: 5499 }],
    detailsDescription: "This pricing covers the selected Discord bot build and any optional setup add-ons.",
    requirementsDescription:
      "Fill in your bot requirements. When you click Continue, the Razorpay payment gateway opens. After successful payment, our team will contact you soon.",
    addOns: [
      {
        id: "bot-hosting-performance",
        name: "High-Performance Hosting Setup",
        description: "Prepare a faster hosting tier for heavier usage, multi-system bots, and reliability needs.",
        kind: "hosting",
        price: 999,
      },
      {
        id: "bot-priority-support",
        name: "Priority Support Retainer",
        description: "Reserve the first month of faster support and deeper post-launch fixes.",
        kind: "maintenance",
        price: 999,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Fully custom bot",
      "API integrations",
      "Delivery in 7-12 days",
      "Payment or crypto features",
      "Basic dashboard",
      "Multi-system bot setup",
      "Database and optimization",
      "Anti-abuse systems",
      "Priority support",
    ],
  },
  "bot-enterprise": {
    name: "Enterprise Bot",
    oldPrice: 9999,
    subtotal: 9999,
    usdSubtotal: 99,
    breakdown: [{ label: "Base Enterprise Bot Scope", amount: 9999 }],
    detailsDescription:
      "This payment covers the starting scope for a larger custom bot build. After requirements review, any expanded enterprise work can be scoped separately.",
    requirementsDescription:
      "Fill in your enterprise bot requirements. When you click Continue, the Razorpay payment gateway opens. This payment secures the base enterprise scope and our team will review the full build with you.",
    addOns: [
      {
        id: "bot-hosting-enterprise",
        name: "Enterprise Hosting Setup",
        description: "Prepare a stronger hosting baseline for product-grade bots, heavier traffic, or monetized systems.",
        kind: "hosting",
        price: 1499,
      },
      {
        id: "bot-enterprise-support",
        name: "Enterprise Support Retainer",
        description: "Reserve the first month of higher-touch support for production bot operations.",
        kind: "maintenance",
        price: 1499,
      },
      {
        id: "connect-bot-website",
        name: "Connect Bot with Website",
        description: "Connect website forms, alerts, or member actions with your Discord bot.",
        kind: "integration",
        price: 1999,
      },
    ],
    features: [
      "Big servers and monetized bots",
      "Marketplace bot architecture",
      "Delivery in 10-16 days",
      "Tip.cc-like systems",
      "Multi-chain crypto systems",
      "SaaS bot platforms",
      "Quoted after requirements review",
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
ensureMainPagesWhatsAppFab();

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

function applyImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    if (img.dataset.fallbackBound === "true") {
      return;
    }
    img.dataset.fallbackBound = "true";
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied === "true") {
        return;
      }
      img.dataset.fallbackApplied = "true";
      img.style.display = "none";
    });
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Accept": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`fetchJson failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(Number(value || 0));
}

function readDisplayCurrencyPreference() {
  try {
    const raw = window.localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const currency =
      parsed?.currency === "usd" || parsed?.mode === "crypto"
        ? "usd"
        : parsed?.mode === "inr"
        ? "inr"
        : "inr";
    return { currency };
  } catch {
    return { currency: "inr" };
  }
}

function writeDisplayCurrencyPreference(value) {
  const safeValue = {
    currency: value?.currency === "usd" ? "usd" : "inr",
  };
  window.localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, JSON.stringify(safeValue));
}

function getSelectedDisplayCurrencyCode() {
  const preference = readDisplayCurrencyPreference();
  return preference.currency === "usd" ? "USD" : "INR";
}

async function fetchDisplayCurrencyRates() {
  if (displayCurrencyRatesCache) {
    return displayCurrencyRatesCache;
  }

  displayCurrencyRatesCache = fetchJson("/api/payments/display/rates")
    .then((payload) => payload?.rates || {})
    .catch((error) => {
      displayCurrencyRatesCache = null;
      console.error("Could not load USD exchange rates, falling back to INR display:", error);
      return {};
    });

  return displayCurrencyRatesCache;
}

async function formatDisplayPrice(value, options = {}) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return options.fallback || "Custom Quote";
  }

  const preference = readDisplayCurrencyPreference();
  if (preference.currency !== "usd") {
    return formatInr(numericValue);
  }

  const rates = await fetchDisplayCurrencyRates();
  const usdRate = Number(rates?.usd);
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    return formatInr(numericValue);
  }

  return formatUsd(numericValue * usdRate);
}

async function formatPriceInCurrency(value, currencyCode) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return "Custom Quote";
  }

  return currencyCode === "usd" ? formatUsd(numericValue) : formatInr(numericValue);
}

async function formatDisplayPriceRange(minValue, maxValue, options = {}) {
  const min = Number(minValue || 0);
  const max = Number(maxValue || 0);
  const plus = options.plus === true;

  if (plus) {
    return `${await formatDisplayPrice(min)}+`;
  }

  if (min === max) {
    return await formatDisplayPrice(min);
  }

  return `${await formatDisplayPrice(min)} - ${await formatDisplayPrice(max)}`;
}

function getDisplayCurrencyControlMarkup(label = "Display Currency") {
  const preference = readDisplayCurrencyPreference();
  return `
    <div class="display-currency-bar" aria-label="${escapeHtml(label)}">
      <span class="pricing-filter-label">${escapeHtml(label)}</span>
      <div class="display-currency-controls">
        <select class="display-currency-select" data-display-currency>
          <option value="inr" ${preference.currency === "inr" ? "selected" : ""}>INR</option>
          <option value="usd" ${preference.currency === "usd" ? "selected" : ""}>USD</option>
        </select>
      </div>
    </div>
  `;
}

function bindDisplayCurrencyControls() {
  const preference = readDisplayCurrencyPreference();
  document.querySelectorAll("[data-display-currency]").forEach((select) => {
    if (select instanceof HTMLSelectElement) {
      select.value = preference.currency;
    }
  });

  document.querySelectorAll("[data-display-currency]").forEach((select) => {
    if (select.dataset.bound === "true") {
      return;
    }
    select.dataset.bound = "true";
    select.addEventListener("change", async (event) => {
      const target = event.currentTarget;
      writeDisplayCurrencyPreference({
        currency: target instanceof HTMLSelectElement && target.value === "usd" ? "usd" : "inr",
      });
      await rerenderDisplayCurrencyViews();
    });
  });
}

async function rerenderDisplayCurrencyViews() {
  const requirementsForm = document.getElementById("planRequirementsForm");
  if (planRequirementsRoot && requirementsForm) {
    const params = new URLSearchParams(window.location.search);
    const planKey =
      planRequirementsRoot.dataset.planKey ||
      params.get("plan") ||
      readSelectedPlan();

    document.querySelectorAll("[data-display-currency]").forEach((select) => {
      if (select instanceof HTMLSelectElement) {
        select.value = readDisplayCurrencyPreference().currency;
      }
    });

    await syncPlanCouponUi(planKey);
    await renderStaticDisplayMoney();
    return;
  }

  await renderPlanDetailsPage();
  await bindPricingActions();
  await renderPlanRequirementsPage(currentUiUser);
  await renderStaticDisplayMoney();
  await initAuthUi();
}

async function renderStaticDisplayMoney() {
  const homePricingNodes = Array.from(document.querySelectorAll("[data-home-pricing-plan]"));
  for (const node of homePricingNodes) {
    const planKey = String(node.getAttribute("data-home-pricing-plan") || "").trim();
    const plan = getPlanByKey(planKey);
    if (!plan) {
      continue;
    }

    const suffix = node.getAttribute("data-price-suffix") || "";
    const preference = readDisplayCurrencyPreference();
    const priceLabel =
      preference.currency === "usd" && Number.isFinite(Number(plan?.usdSubtotal))
        ? await formatPriceInCurrency(Number(plan.usdSubtotal), "usd")
        : await formatDisplayPrice(plan.subtotal ?? plan.amount ?? 0);
    node.innerHTML = `${plan.oldPrice ? `<span class="old-price">${escapeHtml(await formatDisplayPrice(plan.oldPrice))}</span> ` : ""}${escapeHtml(
      priceLabel
    )}${suffix ? ` <small class="home-price-term">${escapeHtml(suffix)}</small>` : ""}`;
  }

  const rangeNodes = Array.from(document.querySelectorAll("[data-bot-range]"));
  for (const node of rangeNodes) {
    const planKey = String(node.getAttribute("data-bot-plan") || "").trim();
    const fixedUsdAmount = planKey ? getFixedBotUsdAmount(planKey) : null;
    const [minValue, maxValue] = String(node.getAttribute("data-bot-range") || "").split("|");
    const suffix = node.getAttribute("data-price-suffix") || "";
    const priceLabel =
      readDisplayCurrencyPreference().currency === "usd" && fixedUsdAmount !== null
        ? formatUsd(fixedUsdAmount)
        : await formatDisplayPriceRange(minValue, maxValue);
    node.innerHTML = `${escapeHtml(priceLabel)}${suffix ? ` <small>${escapeHtml(suffix)}</small>` : ""}`;
  }

  const plusNodes = Array.from(document.querySelectorAll("[data-bot-plus]"));
  for (const node of plusNodes) {
    const planKey = String(node.getAttribute("data-bot-plan") || "").trim();
    const fixedUsdAmount = planKey ? getFixedBotUsdAmount(planKey) : null;
    const minValue = Number(node.getAttribute("data-bot-plus") || 0);
    const suffix = node.getAttribute("data-price-suffix") || "";
    const priceLabel =
      readDisplayCurrencyPreference().currency === "usd" && fixedUsdAmount !== null
        ? `${formatUsd(fixedUsdAmount)}+`
        : await formatDisplayPriceRange(minValue, minValue, { plus: true });
    node.innerHTML = `${escapeHtml(priceLabel)}${suffix ? ` <small>${escapeHtml(suffix)}</small>` : ""}`;
  }

  const singleNodes = Array.from(document.querySelectorAll("[data-bot-addon-price]"));
  for (const node of singleNodes) {
    const planKey = String(node.getAttribute("data-bot-plan") || "").trim();
    const fixedUsdAmount = planKey ? getFixedBotUsdAmount(planKey) : null;
    const value = Number(node.getAttribute("data-bot-addon-price") || 0);
    const suffix = node.getAttribute("data-price-suffix") || "";
    const priceLabel =
      readDisplayCurrencyPreference().currency === "usd" && fixedUsdAmount !== null
        ? formatUsd(fixedUsdAmount)
        : await formatDisplayPrice(value);
    node.textContent = `${priceLabel}${suffix}`;
  }
}

function getPlanByKey(planKey) {
  return PLAN_DETAILS[String(planKey || "").trim()] || null;
}

function getFixedBotUsdAmount(planKey) {
  const plan = getPlanByKey(planKey);
  const amount = Number(plan?.usdSubtotal);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function getPlanPricingForDisplayCurrency(plan, coupon, options = {}, requestedCurrency = "inr") {
  const fallbackPricing = getPlanPricingWithCoupon(plan, coupon, options);
  const currency = String(requestedCurrency || "inr").trim().toLowerCase() === "usd" ? "usd" : "inr";
  const usdPlanAmount = Number(plan?.usdSubtotal);

  if (currency !== "usd" || !Number.isFinite(usdPlanAmount) || usdPlanAmount <= 0) {
    return {
      ...fallbackPricing,
      currencyCode: "inr",
    };
  }

  const rates = await fetchDisplayCurrencyRates();
  const usdRate = Number(rates?.usd);
  if (!Number.isFinite(usdRate) || usdRate <= 0) {
    return {
      ...fallbackPricing,
      currencyCode: "inr",
    };
  }

  const addOnAmount = getPlanAddOnAmount(plan, options.addOnIds) * usdRate;
  const fastDeliveryFee = options.fastDelivery ? usdPlanAmount * 0.1 : 0;
  const baseAmount = usdPlanAmount + addOnAmount + fastDeliveryFee;
  const discountValue = getCouponDiscountValue(coupon);
  let discountAmount =
    getCouponDiscountType(coupon) === "fixed"
      ? discountValue * usdRate
      : (baseAmount * discountValue) / 100;

  if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
    discountAmount = 0;
  }

  discountAmount = Math.min(baseAmount, discountAmount);
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    planAmount: usdPlanAmount,
    addOnAmount,
    fastDeliveryFee,
    baseAmount,
    discountAmount,
    finalAmount,
    currencyCode: "usd",
  };
}

async function getDisplayedPlanPricing(plan, coupon, options = {}) {
  return getPlanPricingForDisplayCurrency(
    plan,
    coupon,
    options,
    readDisplayCurrencyPreference().currency
  );
}

function isBotPlanKey(planKey) {
  return String(planKey || "").trim().toLowerCase().startsWith("bot-");
}

function getPlanCatalogPagePath(planKey) {
  return isBotPlanKey(planKey) ? "bot-pricing.html" : "pricing.html";
}

function getPlanContext(planKey, plan = getPlanByKey(planKey)) {
  const isBot = isBotPlanKey(planKey);

  return {
    isBot,
    browsePage: getPlanCatalogPagePath(planKey),
    browseLabel: isBot ? "Browse Bot Plans" : "Browse Pricing",
    detailsSubtitle:
      plan?.detailsDescription ||
      (isBot
        ? "This pricing covers the selected Discord bot build and any optional setup add-ons."
        : "This pricing includes website development and domain registration for the selected package."),
    requirementsEyebrow: isBot ? "Bot Requirements Form" : "Website Requirements Form",
    requirementsSubtitle:
      plan?.requirementsDescription ||
      "Fill in your project requirements. When you click Continue, the Razorpay payment gateway opens. After successful payment, our team will contact you soon.",
    addOnSubtitle: isBot
      ? "These add-ons stay separate from the main bot build price unless you add them below."
      : "These add-ons stay separate from the main package price unless you add them below.",
    planNote: isBot
      ? "The main bot build total stays unchanged unless you add an optional add-on below."
      : "The main package total stays unchanged unless you add an optional add-on below.",
    feedbackText: isBot
      ? "Add this bot plan to your cart to keep it saved while you continue browsing."
      : "Add this package to your cart to keep it saved while you continue browsing.",
    projectNamePlaceholder: isBot ? "Enter your bot project name" : "Enter your project name",
  };
}

function getPlanBreakdownRows(planKey, plan) {
  if (Array.isArray(plan?.breakdown) && plan.breakdown.length) {
    return plan.breakdown;
  }

  const subtotal = Number((plan?.subtotal ?? plan?.amount) || 0);
  const domainPrice = Number(plan?.domainPrice || 0);
  const websitePrice = Math.max(0, subtotal - domainPrice);

  return [
    { label: "Website Development", amount: websitePrice },
    { label: "Domain Registration", amount: domainPrice },
  ];
}

function readStoredPlanAddOns() {
  try {
    const raw = window.localStorage.getItem(PLAN_ADDONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredPlanAddOns(addOnsByPlan) {
  window.localStorage.setItem(PLAN_ADDONS_STORAGE_KEY, JSON.stringify(addOnsByPlan || {}));
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

function getStoredPlanAddOnIds(planKey) {
  const stored = readStoredPlanAddOns();
  return normalizePlanAddOnIds(stored[String(planKey || "").trim()]);
}

function setStoredPlanAddOnIds(planKey, addOnIds) {
  const key = String(planKey || "").trim();
  if (!key) {
    return;
  }

  const stored = readStoredPlanAddOns();
  const normalized = normalizePlanAddOnIds(addOnIds);
  if (normalized.length) {
    stored[key] = normalized;
  } else {
    delete stored[key];
  }
  writeStoredPlanAddOns(stored);
}

function clearStoredPlanAddOnIds(planKey) {
  const key = String(planKey || "").trim();
  if (!key) {
    return;
  }

  const stored = readStoredPlanAddOns();
  delete stored[key];
  writeStoredPlanAddOns(stored);
}

function toggleStoredPlanAddOn(planKey, addOnId) {
  const normalizedId = String(addOnId || "").trim();
  if (!normalizedId) {
    return false;
  }

  const selectedIds = getStoredPlanAddOnIds(planKey);
  const isSelected = selectedIds.includes(normalizedId);
  const nextIds = isSelected
    ? selectedIds.filter((entry) => entry !== normalizedId)
    : [...selectedIds, normalizedId];

  setStoredPlanAddOnIds(planKey, nextIds);
  return !isSelected;
}

function getPlanAddOnsByIds(plan, addOnIds = []) {
  const catalog = Array.isArray(plan?.addOns) ? plan.addOns : [];
  const selectedIds = new Set(normalizePlanAddOnIds(addOnIds));
  return catalog.filter((addOn) => selectedIds.has(String(addOn?.id || "").trim()));
}

function getPlanAddOnAmount(plan, addOnIds = []) {
  return getPlanAddOnsByIds(plan, addOnIds).reduce((sum, addOn) => sum + Number(addOn?.price || 0), 0);
}

function isHostingPlanAddOn(addOn) {
  const kind = String(addOn?.kind || "").trim().toLowerCase();
  const id = String(addOn?.id || "").trim().toLowerCase();
  const name = String(addOn?.name || "").trim().toLowerCase();

  return kind === "hosting" || id.includes("hosting") || name.includes("hosting");
}

function getPlanHostingAddOnIds(plan) {
  return (Array.isArray(plan?.addOns) ? plan.addOns : [])
    .filter((addOn) => isHostingPlanAddOn(addOn))
    .map((addOn) => String(addOn?.id || "").trim())
    .filter(Boolean);
}

function getPricingPageMode() {
  if (!pricingPlansSection) {
    return "without-hosting";
  }

  return pricingPlansSection.dataset.pricingMode === "with-hosting" ? "with-hosting" : "without-hosting";
}

function getPlanCatalogPricing(plan, options = {}) {
  const includeHosting = options.includeHosting === true;
  const addOnIds = includeHosting ? getPlanHostingAddOnIds(plan) : [];
  const addOnAmount = getPlanAddOnAmount(plan, addOnIds);

  return {
    oldPrice: Math.round((Number(plan?.oldPrice || 0) + addOnAmount) * 100) / 100,
    subtotal: Math.round((Number((plan?.subtotal ?? plan?.amount) || 0) + addOnAmount) * 100) / 100,
    addOnIds,
  };
}

async function renderPricingPageFilter(mode = "without-hosting") {
  if (!pricingPlansSection) {
    return;
  }

  const normalizedMode = mode === "with-hosting" ? "with-hosting" : "without-hosting";
  pricingPlansSection.dataset.pricingMode = normalizedMode;

  pricingPlansSection.querySelectorAll("[data-pricing-mode]").forEach((button) => {
    const isActive = button.getAttribute("data-pricing-mode") === normalizedMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  const filterNote = document.getElementById("pricingFilterNote");
  if (filterNote) {
    const currencyCode = getSelectedDisplayCurrencyCode();
    filterNote.textContent =
      normalizedMode === "with-hosting"
        ? `Showing package prices with hosting add-ons included in ${currencyCode}.`
        : `Showing base package prices without hosting add-ons in ${currencyCode}.`;
  }

  const pricingTasks = Array.from(pricingPlansSection.querySelectorAll("[data-pricing-plan]")).map(async (card) => {
    const planKey = card.getAttribute("data-pricing-plan") || "";
    const plan = getPlanByKey(planKey);
    const priceNode = card.querySelector("[data-pricing-price]");
    if (!plan || !(priceNode instanceof HTMLElement)) {
      return;
    }

    const pricing = getPlanCatalogPricing(plan, { includeHosting: normalizedMode === "with-hosting" });
    const displayedPricing = await getDisplayedPlanPricing(plan, null, {
      addOnIds: normalizedMode === "with-hosting" ? pricing.addOnIds : [],
    });
    priceNode.innerHTML = `<span class="old-price">${escapeHtml(await formatDisplayPrice(pricing.oldPrice))}</span> ${escapeHtml(
      await formatPriceInCurrency(displayedPricing.finalAmount, displayedPricing.currencyCode)
    )} <small>${escapeHtml(card.getAttribute("data-price-suffix") || "/ project")}</small>`;
  });

  await Promise.all(pricingTasks);
}

async function renderPlanAddOnsMarkup(plan, planKey) {
  const addOns = Array.isArray(plan?.addOns) ? plan.addOns : [];
  if (!addOns.length) {
    return "";
  }

  const selectedIds = new Set(getStoredPlanAddOnIds(planKey));
  const planContext = getPlanContext(planKey, plan);

  return `
    <article class="card plan-addon-card">
      <div class="plan-addon-head">
        <span class="eyebrow">Available Add-ons</span>
        <h2>Add extra services if needed</h2>
        <p class="section-subtitle">${escapeHtml(planContext.addOnSubtitle)}</p>
      </div>
      <div class="plan-addon-list">
        ${(
          await Promise.all(
            addOns.map(async (addOn) => `
              <div class="plan-addon-item ${selectedIds.has(String(addOn.id || "").trim()) ? "is-selected" : ""}">
                <div>
                  <h3>${escapeHtml(addOn.name || "Add-on")}</h3>
                  <p>${escapeHtml(addOn.description || "Optional add-on for this package.")}</p>
                </div>
                <div class="plan-addon-actions">
                  <strong>${escapeHtml(await formatDisplayPrice(addOn.price))}</strong>
                  <button
                    class="btn ${selectedIds.has(String(addOn.id || "").trim()) ? "btn-secondary" : "btn-primary"}"
                    type="button"
                    data-plan-addon-toggle="${escapeHtml(addOn.id || "")}"
                  >
                    ${selectedIds.has(String(addOn.id || "").trim()) ? "Remove Add-on" : "Add Add-on"}
                  </button>
                </div>
              </div>
            `)
          )
        ).join("")}
      </div>
    </article>
  `;
}

function getPlanRequirementsPagePath(planKey) {
  const pages = {
    basic: "the-starter-form.html",
    business: "the-professional-form.html",
    professional: "professional-plus-form.html",
    ecommerce: "enterprise-form.html",
    "advanced-ecommerce": "enterprise-plus-form.html",
    "bot-basic": "plan-requirements.html?plan=bot-basic",
    "bot-standard": "plan-requirements.html?plan=bot-standard",
    "bot-premium": "plan-requirements.html?plan=bot-premium",
    "bot-enterprise": "plan-requirements.html?plan=bot-enterprise",
    custom: "custom-plan-form.html",
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
  return discountAmount;
}

function getPlanDeliveryRange(planKey, options = {}) {
  const normalizedPlanKey = String(planKey || "").trim().toLowerCase();
  if (options.fastDelivery) {
    const fastRanges = {
      basic: "3-5 days",
      business: "4-6 days",
      professional: "4-6 days",
      ecommerce: "7-9 days",
      "advanced-ecommerce": "7-9 days",
      "bot-basic": "2-4 days",
      "bot-standard": "4-6 days",
      "bot-premium": "5-9 days",
      "bot-enterprise": "7-12 days",
    };

    return fastRanges[normalizedPlanKey] || "";
  }

  const standardRanges = {
    basic: "5-7 days",
      business: "6-8 days",
      professional: "6-8 days",
      ecommerce: "10-13 days",
      "advanced-ecommerce": "10-13 days",
      "bot-basic": "3-5 days",
      "bot-standard": "5-7 days",
      "bot-premium": "7-12 days",
      "bot-enterprise": "10-16 days",
    };

  return standardRanges[normalizedPlanKey] || "";
}

function getPlanFeaturesForDisplay(planKey, options = {}) {
  const plan = getPlanByKey(planKey);
  if (!plan) {
    return [];
  }

  const deliveryRange = getPlanDeliveryRange(planKey, options);
  return plan.features.map((feature) =>
    /^Delivery in /i.test(String(feature || "")) && deliveryRange ? `Delivery in ${deliveryRange}` : feature
  );
}

function renderPlanFeatureListMarkup(planKey, options = {}) {
  return getPlanFeaturesForDisplay(planKey, options)
    .map((feature) => `<li>${escapeHtml(feature)}</li>`)
    .join("");
}

function getPlanPricingWithCoupon(plan, coupon, options = {}) {
  const planAmount = Number((plan?.subtotal ?? plan?.amount) || 0);
  const addOnAmount = getPlanAddOnAmount(plan, options.addOnIds);
  const fastDeliveryFee = options.fastDelivery ? planAmount * 0.1 : 0;
  const baseAmount = planAmount + addOnAmount + fastDeliveryFee;
  const discountAmount = calculateCouponDiscount(baseAmount, coupon);
  const finalAmount = Math.max(0, baseAmount - discountAmount);

  return {
    planAmount,
    addOnAmount,
    fastDeliveryFee,
    baseAmount,
    discountAmount,
    finalAmount,
  };
}

async function getCouponPricingError(plan, coupon, options = {}) {
  if (!plan || !coupon) {
    return "";
  }

  const inrPricing = getPlanPricingWithCoupon(plan, coupon, options);
  if (inrPricing.finalAmount <= 0) {
    return "This coupon would reduce the payable amount to zero. Please use a smaller discount.";
  }

  const usdPricing = await getPlanPricingForDisplayCurrency(plan, coupon, options, "usd");
  return usdPricing.currencyCode === "usd" && usdPricing.finalAmount <= 0
    ? "This coupon would reduce the USD or crypto payable amount to zero. Please use a smaller discount."
    : "";
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

async function syncPlanCouponUi(planKey) {
  const plan = getPlanByKey(planKey);
  if (!plan) {
    return;
  }

  const coupon = getStoredPlanCoupon(planKey);
  const selectedAddOns = getPlanAddOnsByIds(plan, getStoredPlanAddOnIds(planKey));
  const fastDeliveryInput = document.getElementById("planFastDelivery");
  const pricing = getPlanPricingWithCoupon(plan, coupon, {
    fastDelivery: Boolean(fastDeliveryInput?.checked),
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });
  const displayedPricing = await getDisplayedPlanPricing(plan, coupon, {
    fastDelivery: Boolean(fastDeliveryInput?.checked),
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });
  const couponToggle = document.getElementById("planCouponToggle");
    const couponForm = document.getElementById("planCouponForm");
  const couponInput = document.getElementById("planCouponCode");
  const clearButton = document.getElementById("clearPlanCouponBtn");
  const addOnRow = document.getElementById("planAddOnRow");
  const addOnLabel = document.getElementById("planAddOnLabel");
  const addOnValue = document.getElementById("planAddOnValue");
  const couponLabel = document.getElementById("planCouponLabel");
  const couponValue = document.getElementById("planCouponDiscountValue");
  const finalTotal = document.getElementById("planFinalTotal");
  const requirementAddOnRow = document.getElementById("planRequirementAddOnRow");
  const requirementPlanAmount = document.getElementById("planRequirementPlanAmount");
  const requirementAddOnLabel = document.getElementById("planRequirementAddOnLabel");
  const requirementAddOnValue = document.getElementById("planRequirementAddOnValue");
  const requirementFastDeliveryRow = document.getElementById("planRequirementFastDeliveryRow");
  const requirementFastDeliveryValue = document.getElementById("planRequirementFastDeliveryValue");
  const requirementBaseAmount = document.getElementById("planRequirementBaseAmount");
  const requirementCouponRow = document.getElementById("planRequirementCouponRow");
  const requirementCouponLabel = document.getElementById("planRequirementCouponLabel");
  const requirementCouponValue = document.getElementById("planRequirementCouponValue");
  const requirementFinalAmount = document.getElementById("planRequirementFinalAmount");
  const requirementCouponNote = document.getElementById("planRequirementCouponNote");
  const requirementFeatureList = document.getElementById("planRequirementFeatureList");
  const requirementPaymentMethodLabel = document.getElementById("planRequirementPaymentMethodLabel");
  const fastDeliveryTimingNote = document.getElementById("planFastDeliveryTimingNote");

  if (couponInput && !couponInput.matches(":focus")) {
    couponInput.value = coupon?.coupon_code || "";
  }

  if (couponForm && coupon) {
    couponForm.hidden = false;
  }

  if (couponToggle) {
    const isExpanded = couponForm ? !couponForm.hidden : false;
    couponToggle.textContent = coupon && !isExpanded ? `Coupon applied: ${coupon.coupon_code}` : "Have a coupon code?";
    couponToggle.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  if (clearButton) {
    clearButton.hidden = !coupon;
  }

  if (addOnRow) {
    addOnRow.hidden = selectedAddOns.length === 0;
  }

  if (addOnLabel) {
    addOnLabel.textContent = selectedAddOns.length
      ? selectedAddOns.map((addOn) => addOn.name).join(", ")
      : "Selected Add-ons";
  }

  if (addOnValue) {
    addOnValue.textContent = `+ ${await formatPriceInCurrency(displayedPricing.addOnAmount, displayedPricing.currencyCode)}`;
  }

  if (couponLabel) {
    couponLabel.textContent = coupon ? `Coupon (${coupon.coupon_code})` : "Coupon Discount";
  }

  if (couponValue) {
    couponValue.textContent = displayedPricing.discountAmount
      ? `- ${await formatPriceInCurrency(displayedPricing.discountAmount, displayedPricing.currencyCode)}`
      : await formatPriceInCurrency(0, displayedPricing.currencyCode);
  }

  if (finalTotal) {
    finalTotal.textContent = await formatPriceInCurrency(displayedPricing.finalAmount, displayedPricing.currencyCode);
  }

  if (requirementAddOnRow) {
    requirementAddOnRow.hidden = selectedAddOns.length === 0;
  }

  if (requirementPlanAmount) {
    requirementPlanAmount.textContent = await formatPriceInCurrency(displayedPricing.planAmount, displayedPricing.currencyCode);
  }

  if (requirementAddOnLabel) {
    requirementAddOnLabel.textContent = selectedAddOns.length
      ? selectedAddOns.map((addOn) => addOn.name).join(", ")
      : "Selected Add-ons";
  }

  if (requirementAddOnValue) {
    requirementAddOnValue.textContent = `+ ${await formatPriceInCurrency(displayedPricing.addOnAmount, displayedPricing.currencyCode)}`;
  }

  if (requirementFastDeliveryRow) {
    requirementFastDeliveryRow.hidden = pricing.fastDeliveryFee <= 0;
  }

  if (requirementFastDeliveryValue) {
    requirementFastDeliveryValue.textContent = `+ ${await formatPriceInCurrency(displayedPricing.fastDeliveryFee, displayedPricing.currencyCode)}`;
  }

  if (requirementBaseAmount) {
    requirementBaseAmount.textContent = await formatPriceInCurrency(displayedPricing.baseAmount, displayedPricing.currencyCode);
  }

  if (requirementCouponRow) {
    requirementCouponRow.hidden = !coupon;
  }

  if (requirementCouponLabel) {
    requirementCouponLabel.textContent = coupon ? `Coupon (${coupon.coupon_code})` : "Coupon Discount";
  }

  if (requirementCouponValue) {
    requirementCouponValue.textContent = displayedPricing.discountAmount
      ? `- ${await formatPriceInCurrency(displayedPricing.discountAmount, displayedPricing.currencyCode)}`
      : await formatPriceInCurrency(0, displayedPricing.currencyCode);
  }

  if (requirementFinalAmount) {
    requirementFinalAmount.textContent = await formatPriceInCurrency(displayedPricing.finalAmount, displayedPricing.currencyCode);
  }

  if (requirementPaymentMethodLabel) {
    requirementPaymentMethodLabel.textContent = displayedPricing.currencyCode === "usd" ? "USD" : "INR";
  }

  if (requirementCouponNote) {
    requirementCouponNote.textContent = coupon
      ? `${coupon.coupon_code} will be revalidated before payment is created.`
      : "Apply a coupon on the plan details page to see the discount here.";
  }

  if (fastDeliveryTimingNote) {
    const fastDeliveryRange = getPlanDeliveryRange(planKey, { fastDelivery: true });
    fastDeliveryTimingNote.hidden = !fastDeliveryInput?.checked || !fastDeliveryRange;
    fastDeliveryTimingNote.textContent = fastDeliveryRange
      ? `Fast delivery timeline: ${fastDeliveryRange}`
      : "";
  }

  if (requirementFeatureList) {
    requirementFeatureList.innerHTML = renderPlanFeatureListMarkup(planKey, {
      fastDelivery: Boolean(fastDeliveryInput?.checked),
    });
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

    const plan = getPlanByKey(planKey);
    const pricingError = await getCouponPricingError(plan, coupon, {
      addOnIds: getStoredPlanAddOnIds(planKey),
      fastDelivery: Boolean(document.getElementById("planFastDelivery")?.checked),
    });
    if (pricingError) {
      throw new Error(pricingError);
    }

    setStoredPlanCoupon(planKey, coupon);
    await syncPlanCouponUi(planKey);

    if (!options.silent) {
      setPlanCouponFeedback(`Coupon ${normalizeCouponCode(coupon.coupon_code)} applied successfully.`, "success");
    }
    return coupon;
  } catch (error) {
    clearStoredPlanCoupon(planKey);
    await syncPlanCouponUi(planKey);
    if (!options.silent) {
      setPlanCouponFeedback(error.message || "This coupon is no longer available.", "error");
    }
    return null;
  }
}

async function buildCartItemFromPlan(planKey) {
  if (String(planKey || "").trim() === "custom") {
    return {
      planKey: "custom",
      title: "Custom Plan",
      description: "Custom website scope with flexible pages, features, and a requirement-based quote.",
      price: "Custom Quote",
      amount: 0,
    };
  }

  const plan = getPlanByKey(planKey);
  if (!plan) {
    return null;
  }

  const planContext = getPlanContext(planKey, plan);
  const selectedAddOns = getPlanAddOnsByIds(plan, getStoredPlanAddOnIds(planKey));
  const addOnAmount = selectedAddOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);
  const totalAmount = Number(plan.subtotal) + addOnAmount;
  const addOnLabel = selectedAddOns.length
    ? ` Add-ons: ${selectedAddOns.map((addOn) => addOn.name).join(", ")}.`
    : "";
  const description = planContext.isBot
    ? `${plan.features.length} included features for your Discord bot build.${addOnLabel}`
    : `${plan.features.length} included features with domain registration and hosting support.${addOnLabel}`;

  return {
    planKey,
    title: plan.name,
    description,
    price: await formatDisplayPrice(totalAmount),
    amount: totalAmount,
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

function getCryptoCurrencyDisplayLabel(currency) {
  const labels = {
    btc: "Bitcoin (BTC)",
    ltc: "Litecoin (LTC)",
    eth: "Ethereum (ETH)",
    bch: "Bitcoin Cash (BCH)",
    bnb: "BNB Smart Chain (BNB)",
    doge: "Dogecoin (DOGE)",
    tbtc: "Bitcoin Testnet (TBTC)",
  };

  return labels[String(currency || "").trim().toLowerCase()] || String(currency || "").toUpperCase();
}

function getOrderPaymentMethodLabel(order) {
  const method = String(order?.payment_method || "inr").trim().toLowerCase();
  if (method === "crypto") {
    return getCryptoCurrencyDisplayLabel(order?.crypto_currency || "btc");
  }

  return "INR";
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
    cart: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.75 6.25h2.1l1.25 7h8.4l2.1-5.25H7.4" />
        <circle cx="10.25" cy="17.75" r="1.5" />
        <circle cx="16.75" cy="17.75" r="1.5" />
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
        <a class="user-menu-link" href="orders.html#ordersMain">
          <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
          <span class="user-menu-link__label">Account Activity</span>
        </a>
        <a class="user-menu-link" href="cart.html#cartMain">
          <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
          <span class="user-menu-link__label">Cart</span>
        </a>
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

async function renderCartPage(user) {
  if (!cartRoot) {
    return;
  }

  const items = readCartItems();
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const hasCustomOnlyPricing = items.length > 0 && items.every((item) => Number(item.amount || 0) === 0);
  const primaryPlanKey = items[items.length - 1]?.planKey || readSelectedPlan();
  const planContext = getPlanContext(primaryPlanKey);
  const browsePage = planContext.browsePage;
  const browseLabel = planContext.browseLabel;

  if (!user) {
    cartRoot.innerHTML = `
      <article class="card cart-empty">
        <h2>Please log in</h2>
        <p>You need to sign in before viewing your cart and saved profile details.</p>
        <a href="login.html" class="btn btn-primary">Go to Login</a>
      </article>
    `;
    return;
  }

  const cartListMarkup = !items.length
    ? `
        <article class="card cart-empty">
          <h2>Your cart is empty</h2>
          <p>${escapeHtml(user.fullName)}, you have no saved plans in your cart yet.</p>
          <div class="cart-empty-actions">
            <a href="${browsePage}" class="btn btn-primary">${browseLabel}</a>
            <a href="portfolio.html" class="btn btn-secondary">View Portfolio</a>
          </div>
        </article>
      `
    : (
        await Promise.all(
          items.map(async (item) => `
            <article class="card cart-item">
              <div class="cart-item-copy">
                <h3>${escapeHtml(item.title || "Selected Plan")}</h3>
                <p>${escapeHtml(item.description || "Saved from your recent visit.")}</p>
              </div>
              <div class="cart-item-actions">
                <div class="cart-price">${Number(item.amount || 0) > 0 ? escapeHtml(await formatDisplayPrice(item.amount || 0)) : escapeHtml(item.price || "Custom")}</div>
                <button class="btn btn-secondary" type="button" data-cart-remove="${escapeHtml(item.planKey || "")}">Remove</button>
              </div>
            </article>
          `)
        )
      ).join("");

  cartRoot.innerHTML = `
    <div class="profile-grid account-page-grid">
      <aside class="profile-sidebar">
        <article class="card profile-account-nav profile-account-nav--compact">
          <nav class="profile-account-nav__menu" aria-label="Account menu">
            <a class="user-menu-link" href="profile.html#accountMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("account")}</span>
              <span class="user-menu-link__label">Account Information</span>
            </a>
            <a class="user-menu-link" href="orders.html#ordersMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
              <span class="user-menu-link__label">Account Activity</span>
            </a>
            <a class="user-menu-link user-menu-link--active" href="cart.html#cartMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
              <span class="user-menu-link__label">Cart</span>
            </a>
          </nav>
          <div class="profile-account-nav__footer">
            <button class="user-menu-link user-menu-link--logout" type="button" data-profile-logout="true">
              <span class="user-menu-link__icon">${renderUserMenuIcon("logout")}</span>
              <span class="user-menu-link__label">Log out</span>
            </button>
          </div>
        </article>
      </aside>
      <div class="profile-main" id="cartMain">
        <div class="account-page-header">
          <h2>My Cart</h2>
        </div>
        <div class="cart-grid">
          <div class="cart-list">
            ${cartListMarkup}
          </div>
          <div>
            <article class="card cart-meta">
              <h3>Profile Snapshot</h3>
              <p><strong>Name:</strong> ${escapeHtml(user.fullName)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(user.phone || "Not added yet")}</p>
              <p><strong>Items:</strong> ${items.length}</p>
              <div class="cart-currency-shell">${getDisplayCurrencyControlMarkup("Billing Currency")}</div>
              <p class="cart-total-row"><strong>Total:</strong> <span>${hasCustomOnlyPricing ? "Custom Quote" : escapeHtml(await formatDisplayPrice(totalAmount))}</span></p>
              <a href="${primaryPlanKey ? getPlanRequirementsPagePath(primaryPlanKey) || browsePage : browsePage}" class="btn btn-primary">${primaryPlanKey ? "Proceed to Buy" : browseLabel}</a>
              <a href="orders.html#ordersMain" class="btn btn-secondary">View Orders</a>
              ${
                items.length
                  ? '<button class="btn btn-secondary" type="button" data-cart-clear="true">Clear Cart</button>'
                  : ""
              }
            </article>
          </div>
        </div>
      </div>
    </div>
  `;

  const logoutButton = cartRoot.querySelector("[data-profile-logout='true']");
  logoutButton?.addEventListener("click", async () => {
    try {
      if (dqAuth && dqAuth.isConfigured()) {
        await dqAuth.signOut();
      }
    } finally {
      window.location.href = "login.html";
    }
  });

  if (window.location.hash === "#cartMain") {
    cartRoot.querySelector("#cartMain")?.scrollIntoView({ block: "start" });
  }

  bindDisplayCurrencyControls();
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
            <a class="user-menu-link" href="orders.html#ordersMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
              <span class="user-menu-link__label">Account Activity</span>
            </a>
            <a class="user-menu-link" href="cart.html#cartMain">
              <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
              <span class="user-menu-link__label">Cart</span>
            </a>
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
              <strong class="account-row__value">${escapeHtml(getSelectedDisplayCurrencyCode())}</strong>
            </div>
            <div class="account-currency-controls">
              ${getDisplayCurrencyControlMarkup("Billing Currency")}
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

  bindDisplayCurrencyControls();
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
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <a class="user-menu-link" href="cart.html#cartMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
                <span class="user-menu-link__label">Cart</span>
              </a>
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
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <a class="user-menu-link" href="cart.html#cartMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
                <span class="user-menu-link__label">Cart</span>
              </a>
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
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <a class="user-menu-link" href="cart.html#cartMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
                <span class="user-menu-link__label">Cart</span>
              </a>
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
          <div class="orders-currency-shell">
            ${getDisplayCurrencyControlMarkup("Billing Currency")}
          </div>
          <div class="orders-list">
            ${(
              await Promise.all(
                orders.map(async (order) => {
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
                        <strong>${escapeHtml(await formatDisplayPrice(order.final_amount || 0))}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Original Amount</span>
                        <strong>${escapeHtml(await formatDisplayPrice(order.amount || 0))}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Discount</span>
                        <strong>${escapeHtml(await formatDisplayPrice(order.discount_amount || 0))}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Purchased On</span>
                        <strong>${escapeHtml(createdAt)}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Payment</span>
                        <strong>${escapeHtml(getPaymentStatusLabel(order.payment_status))}</strong>
                      </div>
                      <div class="order-card-item">
                        <span>Payment Method</span>
                        <strong>${escapeHtml(getOrderPaymentMethodLabel(order))}</strong>
                      </div>
                    </div>
                  </article>
                `;
              })
            )).join("")}
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
    bindDisplayCurrencyControls();
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
              <a class="user-menu-link user-menu-link--active" href="orders.html#ordersMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("activity")}</span>
                <span class="user-menu-link__label">Account Activity</span>
              </a>
              <a class="user-menu-link" href="cart.html#cartMain">
                <span class="user-menu-link__icon">${renderUserMenuIcon("cart")}</span>
                <span class="user-menu-link__label">Cart</span>
              </a>
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

async function renderPlanDetailsPage() {
  if (!planDetailsRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const planKey = params.get("plan") || readSelectedPlan();
  const browsePage = getPlanCatalogPagePath(planKey);
  const plan = getPlanByKey(planKey);
  const requirementsPage = getPlanRequirementsPagePath(planKey);

  if (!plan) {
    planDetailsRoot.innerHTML = `
      <article class="card cart-empty">
        <h1 class="section-title">Plan Not Found</h1>
        <p class="section-subtitle">Select a plan first to view the pricing breakdown.</p>
        <a href="${browsePage}" class="btn btn-primary">Back to Pricing</a>
      </article>
    `;
    return;
  }

  saveSelectedPlan(planKey);
  const planContext = getPlanContext(planKey, plan);
  const breakdownRows = getPlanBreakdownRows(planKey, plan);
  const savings = plan.oldPrice - plan.subtotal;
  const hasSavings = Number(plan.oldPrice || 0) > Number(plan.subtotal || 0);
  const appliedCoupon = getStoredPlanCoupon(planKey);
  const selectedAddOns = getPlanAddOnsByIds(plan, getStoredPlanAddOnIds(planKey));
  const pricing = getPlanPricingWithCoupon(plan, appliedCoupon, {
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });
  const displayedPricing = await getDisplayedPlanPricing(plan, appliedCoupon, {
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });

  planDetailsRoot.innerHTML = `
    <div class="plan-layout">
      <article class="card plan-overview">
        <span class="eyebrow">Selected Package</span>
        <h1 class="section-title">${escapeHtml(plan.name)}</h1>
        <p class="section-subtitle">${escapeHtml(planContext.detailsSubtitle)}</p>
        <div class="plan-currency-shell">
          ${getDisplayCurrencyControlMarkup("Display Currency")}
        </div>
        <div class="plan-price-strip">
          ${hasSavings ? `<span class="old-price">${escapeHtml(await formatDisplayPrice(plan.oldPrice))}</span>` : ""}
          <strong>${escapeHtml(await formatPriceInCurrency(displayedPricing.planAmount, displayedPricing.currencyCode))}</strong>
          ${hasSavings ? `<span class="plan-savings">You save ${escapeHtml(await formatDisplayPrice(savings))}</span>` : ""}
        </div>
        <ul class="plan-feature-list">
          ${plan.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
      </article>
      <article class="card plan-summary-card">
        <h2>Price Breakdown</h2>
        ${(
          await Promise.all(
            breakdownRows.map(async (row, index) => `
              <div class="plan-summary-row">
                <span>${escapeHtml(row.label || "Plan Price")}</span>
                <strong>${escapeHtml(
                  await formatPriceInCurrency(
                    breakdownRows.length === 1 && index === 0 ? displayedPricing.planAmount : row.amount || 0,
                    displayedPricing.currencyCode
                  )
                )}</strong>
              </div>
            `)
          )
        ).join("")}
        <div class="plan-summary-row" id="planAddOnRow" ${selectedAddOns.length ? "" : "hidden"}>
          <span id="planAddOnLabel">${escapeHtml(
            selectedAddOns.length ? selectedAddOns.map((addOn) => addOn.name).join(", ") : "Selected Add-ons"
          )}</span>
          <strong id="planAddOnValue">+ ${escapeHtml(await formatPriceInCurrency(displayedPricing.addOnAmount, displayedPricing.currencyCode))}</strong>
        </div>
        <button
          class="plan-coupon-toggle"
          type="button"
          id="planCouponToggle"
          aria-expanded="${appliedCoupon ? "true" : "false"}"
          aria-controls="planCouponForm"
        >
          Have a coupon code?
        </button>
        <form id="planCouponForm" class="plan-coupon-panel" ${appliedCoupon ? "" : "hidden"}>
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
          <strong id="planCouponDiscountValue">${displayedPricing.discountAmount ? `- ${escapeHtml(await formatPriceInCurrency(displayedPricing.discountAmount, displayedPricing.currencyCode))}` : escapeHtml(await formatPriceInCurrency(0, displayedPricing.currencyCode))}</strong>
        </div>
        <div class="plan-summary-row total">
          <span>Total Pricing</span>
          <strong id="planFinalTotal">${escapeHtml(await formatPriceInCurrency(displayedPricing.finalAmount, displayedPricing.currencyCode))}</strong>
        </div>
        <p class="plan-note">${escapeHtml(planContext.planNote)}</p>
        <p class="plan-feedback" id="planFeedback">${escapeHtml(planContext.feedbackText)}</p>
        <div class="plan-actions">
          <button class="btn btn-secondary" type="button" data-plan-add="${escapeHtml(planKey)}">Add to Cart</button>
          <a href="${requirementsPage || browsePage}" class="btn btn-primary" data-plan-buy-link="${escapeHtml(planKey)}">Proceed to Buy</a>
        </div>
      </article>
    </div>
    ${await renderPlanAddOnsMarkup(plan, planKey)}
  `;

  planDetailsRoot.querySelectorAll("[data-plan-addon-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const addOnId = button.getAttribute("data-plan-addon-toggle") || "";
      const wasAdded = toggleStoredPlanAddOn(planKey, addOnId);
      const selectedAddOn = (Array.isArray(plan.addOns) ? plan.addOns : []).find((addOn) => addOn.id === addOnId);
      showCartToast(
        wasAdded
          ? `${selectedAddOn?.name || "Add-on"} added to this package.`
          : `${selectedAddOn?.name || "Add-on"} removed from this package.`
      );
      renderPlanDetailsPage().catch((error) => {
        console.error("Could not rerender plan details:", error);
      });
    });
  });

  const couponToggle = document.getElementById("planCouponToggle");
  const couponForm = document.getElementById("planCouponForm");
  const clearCouponButton = document.getElementById("clearPlanCouponBtn");
  couponToggle?.addEventListener("click", () => {
    if (!couponForm) {
      return;
    }

    couponForm.hidden = !couponForm.hidden;
    syncPlanCouponUi(planKey).catch((error) => {
      console.error("Could not sync coupon UI:", error);
    });
  });

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

      const pricingError = await getCouponPricingError(plan, coupon, {
        addOnIds: getStoredPlanAddOnIds(planKey),
      });
      if (pricingError) {
        throw new Error(pricingError);
      }

      setStoredPlanCoupon(planKey, coupon);
      await syncPlanCouponUi(planKey);
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
    syncPlanCouponUi(planKey).catch((error) => {
      console.error("Could not sync coupon UI:", error);
    });
    setPlanCouponFeedback("Coupon removed.", "info");
  });

  syncPlanCouponUi(planKey).catch((error) => {
    console.error("Could not sync coupon UI:", error);
  });
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

async function bindPricingActions() {
  if (pricingPlansSection) {
    pricingPlansSection.querySelectorAll("[data-pricing-mode]").forEach((button) => {
      if (button.dataset.bound === "true") {
        return;
      }
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        renderPricingPageFilter(button.getAttribute("data-pricing-mode") || "without-hosting").catch((error) => {
          console.error("Could not update pricing filter:", error);
        });
      });
    });

    await renderPricingPageFilter(getPricingPageMode());
  }

  document.querySelectorAll("[data-plan-link]").forEach((link) => {
    if (link.dataset.bound === "true") {
      return;
    }
    link.dataset.bound = "true";
    link.addEventListener("click", () => {
      const planKey = link.dataset.planLink;
      const plan = getPlanByKey(planKey);

      if (plan && pricingPlansSection?.contains(link)) {
        if (getPricingPageMode() === "with-hosting") {
          setStoredPlanAddOnIds(planKey, getPlanHostingAddOnIds(plan));
        } else {
          clearStoredPlanAddOnIds(planKey);
        }
      }

      saveSelectedPlan(planKey);
    });
  });

  await renderStaticDisplayMoney();
  bindDisplayCurrencyControls();
}

async function handlePlanAdd(planKey) {
  const item = await buildCartItemFromPlan(planKey);
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

function normalizeCustomPlanFeatures(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function bindCustomPlanForm(user) {
  if (!customPlanForm || customPlanForm.dataset.bound === "true") {
    return;
  }

  customPlanForm.dataset.bound = "true";
  customPlanForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!user?.id || !dqAuth || !dqAuth.isConfigured()) {
      window.location.href = "login.html?redirect=custom-plan-form.html";
      return;
    }

    const client = await dqAuth.getClient();
    if (!client) {
      showCartToast("Could not start your custom plan request.");
      return;
    }

    const formData = new FormData(customPlanForm);
    const customerName = String(formData.get("customerName") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const customerPhone = String(formData.get("customerPhone") || "").trim();
    const businessName = String(formData.get("businessName") || "").trim();
    const projectName = String(formData.get("projectName") || "").trim();
    const websiteType = String(formData.get("websiteType") || "").trim();
    const pageScope = String(formData.get("pageScope") || "").trim();
    const budget = String(formData.get("budget") || "").trim();
    const timeline = String(formData.get("timeline") || "").trim();
    const features = normalizeCustomPlanFeatures(formData.get("features"));
    const references = String(formData.get("references") || "").trim();
    const projectBrief = String(formData.get("projectBrief") || "").trim();
    const submitButton = customPlanForm.querySelector('button[type="submit"]');

    try {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      const { error: profileError } = await client
        .from("profiles")
        .update({
          full_name: customerName || user.fullName || user.email,
          phone: customerPhone || user.phone || "",
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const projectPayload = {
        user_id: user.id,
        project_name: projectName || `${businessName || websiteType || "Custom"} Project`,
        template_id: "custom",
        site_config: {
          source: "custom_plan_form",
          submitted_at: new Date().toISOString(),
          project_status: "pending",
          contact: {
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
          },
          plan: {
            key: "custom",
            name: "Custom Plan",
            price: null,
          },
          summary: {
            project_name: projectName,
            idea: projectBrief || `${websiteType || "Custom website"} request`,
          },
          requirements: {
            custom: {
              businessName,
              websiteType,
              pageScope,
              budget,
              timeline,
              features,
              references,
              projectBrief,
            },
          },
        },
        is_active: false,
      };

      const { error: projectError } = await client.from("projects").insert(projectPayload);
      if (projectError) {
        throw projectError;
      }

      customPlanForm.reset();
      const customNameInput = customPlanForm.elements?.namedItem("customerName");
      const customEmailInput = customPlanForm.elements?.namedItem("customerEmail");
      const customPhoneInput = customPlanForm.elements?.namedItem("customerPhone");
      if (customNameInput && "value" in customNameInput) {
        customNameInput.value = customerName || user.fullName || "";
      }
      if (customEmailInput && "value" in customEmailInput) {
        customEmailInput.value = customerEmail || user.email || "";
      }
      if (customPhoneInput && "value" in customPhoneInput) {
        customPhoneInput.value = customerPhone || user.phone || "";
      }

      showPlanSuccessModal({
        title: "Request Received",
        message: "Our team will contact you soon.",
      });
    } catch (error) {
      showCartToast(error.message || "Could not submit your custom plan request.");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Continue";
      }
    }
  });
}

async function renderCustomPlanPage(user) {
  if (!customPlanRoot || !customPlanForm) {
    return;
  }

  if (!user) {
    window.location.href = "login.html?redirect=custom-plan-form.html";
    return;
  }

  const customName = customPlanForm.elements?.namedItem("customerName");
  const customEmail = customPlanForm.elements?.namedItem("customerEmail");
  const customPhone = customPlanForm.elements?.namedItem("customerPhone");

  if (customName && "value" in customName) {
    customName.value = user.fullName || "";
  }

  if (customEmail && "value" in customEmail) {
    customEmail.value = user.email || "";
  }

  if (customPhone && "value" in customPhone) {
    customPhone.value = user.phone || "";
  }

  saveSelectedPlan("custom");
  upsertCartItem(await buildCartItemFromPlan("custom"));
  bindCustomPlanForm(user);
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

async function createPlanCryptoOrder(payload) {
  const accessToken = await getAuthAccessToken();
  if (!accessToken) {
    throw new Error("Please sign in again before continuing.");
  }

  return fetchJson("/api/payments/crypto/create-order", {
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

async function getCryptoPaymentStatus(siteOrderId) {
  const accessToken = await getAuthAccessToken();
  if (!accessToken) {
    throw new Error("Please sign in again before checking payment status.");
  }

  return fetchJson(`/api/payments/crypto/status?siteOrderId=${encodeURIComponent(siteOrderId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function openRazorpayCheckout(checkoutData) {
  await loadRazorpayCheckout();

  const finalAmount = Number(
    checkoutData?.pricing?.chargeAmountInr ?? checkoutData?.pricing?.finalAmount ?? 0
  );
  const displayFinalAmount = Number(checkoutData?.pricing?.finalAmount || 0);
  const displayCurrencyCode =
    String(checkoutData?.pricing?.currencyCode || "inr").trim().toLowerCase() === "usd"
      ? "usd"
      : "inr";
  const gatewayAmountMinor = Number(checkoutData?.razorpayOrder?.amount || 0);
  const expectedAmountMinor = Math.round(finalAmount * 100);
  if (
    !Number.isFinite(finalAmount) ||
    finalAmount <= 0 ||
    !Number.isFinite(gatewayAmountMinor) ||
    gatewayAmountMinor !== expectedAmountMinor
  ) {
    throw new Error("The Razorpay amount does not match the checkout total. Please try again.");
  }

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
      description: `${checkoutData.planName || "Website"} Payment - ${
        displayCurrencyCode === "usd" ? formatUsd(displayFinalAmount) : formatInr(displayFinalAmount)
      }`,
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

function ensurePaymentMethodModal() {
  let modal = document.getElementById("paymentMethodModal");
  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "plan-success-modal";
  modal.id = "paymentMethodModal";
  modal.setAttribute("hidden", "");
  modal.innerHTML = `
    <div class="plan-success-dialog crypto-payment-dialog payment-choice-dialog">
      <button class="crypto-payment-close" type="button" id="paymentMethodModalCloseBtn" aria-label="Close payment method dialog">&times;</button>
      <h3 id="paymentMethodModalTitle">Choose Payment Method</h3>
      <p id="paymentMethodModalSummary">Select how you want to complete this payment.</p>
      <div class="field-block">
        <label for="paymentMethodModalSelect">Payment Method</label>
        <select id="paymentMethodModalSelect">
          <option value="inr">INR</option>
          <option value="crypto">Cryptocurrency</option>
        </select>
      </div>
      <div class="field-block" id="paymentMethodModalCryptoField" hidden>
        <label for="paymentMethodModalCryptoCurrency">Select Cryptocurrency</label>
        <select id="paymentMethodModalCryptoCurrency">
          <option value="btc">Bitcoin (BTC)</option>
          <option value="ltc">Litecoin (LTC)</option>
          <option value="eth">Ethereum (ETH)</option>
          <option value="bch">Bitcoin Cash (BCH)</option>
          <option value="bnb">BNB Smart Chain (BNB)</option>
          <option value="doge">Dogecoin (DOGE)</option>
          <option value="tbtc">Bitcoin Testnet (TBTC)</option>
        </select>
        <p class="plan-form-option-note">A unique wallet address will be generated after you continue.</p>
      </div>
      <p class="checkout-currency-label" id="paymentMethodPricingCurrency">Pricing in INR</p>
      <div class="checkout-price-breakdown" id="paymentMethodPriceBreakdown" aria-live="polite"></div>
      <p class="plan-form-option-note">The server will revalidate this total before opening the selected payment gateway.</p>
      <div class="plan-form-actions payment-modal-actions">
        <button class="btn btn-secondary" type="button" id="paymentMethodModalCancelBtn">Cancel</button>
        <button class="btn btn-primary" type="button" id="paymentMethodModalContinueBtn">Continue</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function renderCheckoutPriceBreakdown(pricing = {}) {
  const selectedAddOns = Array.isArray(pricing.selectedAddOns) ? pricing.selectedAddOns : [];
  const couponCode = normalizeCouponCode(pricing.couponCode);
  const currencyCode =
    String(pricing.currencyCode || "inr").trim().toLowerCase() === "usd" ? "usd" : "inr";
  const formatMoney = (value) => (currencyCode === "usd" ? formatUsd(value) : formatInr(value));
  const rows = [
    {
      label: "Plan price",
      value: formatMoney(pricing.planAmount ?? pricing.baseAmount),
      hidden: false,
    },
    {
      label: selectedAddOns.length
        ? `Add-ons (${selectedAddOns.map((addOn) => addOn.name).filter(Boolean).join(", ")})`
        : "Add-ons",
      value: `+ ${formatMoney(pricing.addOnAmount)}`,
      hidden: Number(pricing.addOnAmount || 0) <= 0,
    },
    {
      label: "Fast delivery",
      value: `+ ${formatMoney(pricing.fastDeliveryFee)}`,
      hidden: Number(pricing.fastDeliveryFee || 0) <= 0,
    },
    {
      label: couponCode ? `Coupon (${couponCode})` : "Coupon",
      value: `- ${formatMoney(pricing.discountAmount)}`,
      hidden: Number(pricing.discountAmount || 0) <= 0,
    },
  ];

  return `
    ${rows
      .filter((row) => !row.hidden)
      .map(
        (row) => `
          <div class="checkout-price-row">
            <span>${escapeHtml(row.label)}</span>
            <strong>${escapeHtml(row.value)}</strong>
          </div>
        `
      )
      .join("")}
    <div class="checkout-price-row checkout-price-total">
      <span>Amount to pay</span>
      <strong>${escapeHtml(formatMoney(pricing.finalAmount))}</strong>
    </div>
  `;
}

async function openPaymentMethodSelectionModal(planName, pricingOptions = {}) {
  const modal = ensurePaymentMethodModal();
  const title = document.getElementById("paymentMethodModalTitle");
  const summary = document.getElementById("paymentMethodModalSummary");
  const priceBreakdown = document.getElementById("paymentMethodPriceBreakdown");
  const pricingCurrencyLabel = document.getElementById("paymentMethodPricingCurrency");
  const paymentMethodSelect = document.getElementById("paymentMethodModalSelect");
  const cryptoField = document.getElementById("paymentMethodModalCryptoField");
  const cryptoCurrencySelect = document.getElementById("paymentMethodModalCryptoCurrency");
  const closeButton = document.getElementById("paymentMethodModalCloseBtn");
  const cancelButton = document.getElementById("paymentMethodModalCancelBtn");
  const continueButton = document.getElementById("paymentMethodModalContinueBtn");
  const preferredCurrency =
    String(pricingOptions.preferredCurrency || "inr").trim().toLowerCase() === "usd" ? "usd" : "inr";
  const inrPricing = pricingOptions.inrPricing || {};
  const usdPricing = pricingOptions.usdPricing || inrPricing;

  if (!(paymentMethodSelect instanceof HTMLSelectElement) || !(cryptoCurrencySelect instanceof HTMLSelectElement)) {
    throw new Error("Payment method selection is unavailable.");
  }

  if (title) {
    title.textContent = `Choose how to pay for ${planName || "this plan"}`;
  }
  if (summary) {
    summary.textContent = "Review the complete amount, then choose Razorpay or cryptocurrency.";
  }

  paymentMethodSelect.value = preferredCurrency === "usd" ? "crypto" : "inr";
  cryptoCurrencySelect.value = "btc";
  if (cryptoField) {
    cryptoField.hidden = true;
    cryptoField.style.display = "none";
  }

  const syncUi = () => {
    const showCrypto = paymentMethodSelect.value === "crypto";
    const displayCurrency = showCrypto ? "usd" : preferredCurrency;
    const pricing = displayCurrency === "usd" ? usdPricing : inrPricing;

    if (cryptoField) {
      cryptoField.hidden = !showCrypto;
      cryptoField.style.display = showCrypto ? "" : "none";
      cryptoCurrencySelect.disabled = !showCrypto;
      if (!showCrypto) {
        cryptoCurrencySelect.value = "btc";
      }
    }
    if (pricingCurrencyLabel) {
      pricingCurrencyLabel.textContent =
        displayCurrency === "usd"
          ? showCrypto
            ? "Crypto uses USD pricing"
            : "Pricing in USD"
          : "Pricing in INR";
    }
    if (priceBreakdown) {
      priceBreakdown.innerHTML = renderCheckoutPriceBreakdown(pricing);
    }
    if (summary) {
      summary.textContent = showCrypto
        ? "Crypto pricing is shown in USD. The exact coin amount is generated after you continue."
        : displayCurrency === "usd"
        ? "USD pricing is selected. Razorpay will receive the live INR settlement equivalent."
        : "INR pricing is selected. Razorpay will charge this exact INR total.";
    }
  };

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback) => () => {
      if (settled) {
        return;
      }
      settled = true;
      paymentMethodSelect.removeEventListener("change", syncUi);
      closeButton?.removeEventListener("click", onCancel);
      cancelButton?.removeEventListener("click", onCancel);
      continueButton?.removeEventListener("click", onContinue);
      modal.setAttribute("hidden", "");
      callback();
    };

    const onCancel = finish(() => reject(new Error("Payment was cancelled.")));
    const onContinue = finish(() =>
      resolve({
        paymentMethod: paymentMethodSelect.value === "crypto" ? "crypto" : "inr",
        cryptoCurrency: cryptoCurrencySelect.value || "btc",
        pricingCurrency:
          paymentMethodSelect.value === "crypto" || preferredCurrency === "usd" ? "USD" : "INR",
      })
    );

    paymentMethodSelect.addEventListener("change", syncUi);
    closeButton?.addEventListener("click", onCancel);
    cancelButton?.addEventListener("click", onCancel);
    continueButton?.addEventListener("click", onContinue);
    syncUi();
    modal.removeAttribute("hidden");
  });
}

function ensureCryptoPaymentModal() {
  let modal = document.getElementById("cryptoPaymentModal");
  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "plan-success-modal";
  modal.id = "cryptoPaymentModal";
  modal.setAttribute("hidden", "");
  modal.innerHTML = `
    <div class="plan-success-dialog crypto-payment-dialog">
      <button class="crypto-payment-close" type="button" id="cryptoExitPaymentBtn" aria-label="Close crypto payment modal">&times;</button>
      <h3 id="cryptoPaymentTitle">Complete Your Crypto Payment</h3>
      <p id="cryptoPaymentSummary">Send the exact amount to the address below.</p>
      <img id="cryptoPaymentQr" alt="Cwallet recipient address QR code" hidden />
      <div class="crypto-payment-grid">
        <div>
          <span class="crypto-payment-label">Currency</span>
          <strong id="cryptoPaymentCurrency">-</strong>
        </div>
        <div>
          <span class="crypto-payment-label">Amount</span>
          <strong id="cryptoPaymentAmount">-</strong>
        </div>
      </div>
      <div class="checkout-price-breakdown" id="cryptoPaymentPriceBreakdown" aria-live="polite"></div>
      <div class="crypto-payment-address-box">
        <span class="crypto-payment-label">Payment Address</span>
        <code id="cryptoPaymentAddress">-</code>
      </div>
      <p class="plan-form-option-note" id="cryptoWalletCompatibilityNote">
        Cwallet scans the address only. Copy the exact amount shown above into Cwallet before sending.
      </p>
      <p class="crypto-payment-status" id="cryptoPaymentStatus">Waiting for payment detection.</p>
      <div class="plan-form-actions payment-modal-actions">
        <button class="btn btn-secondary" type="button" id="cryptoCopyAddressBtn">Copy Address</button>
        <button class="btn btn-primary" type="button" id="cryptoCopyAmountBtn">Copy Amount</button>
        <a class="btn btn-secondary" href="#" id="cryptoOpenGenericWalletBtn">Open Compatible Wallet</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function buildCryptoPaymentSvgDataUrl(crypto = {}) {
  const currency = String(crypto.currency || "").toUpperCase();
  const label = String(crypto.label || currency || "CRYPTO");
  const amount = String(crypto.amount || "-");
  const address = String(crypto.address || "-");
  const addressLines = [];

  for (let index = 0; index < address.length; index += 26) {
    addressLines.push(address.slice(index, index + 26));
  }

  const escapedLines = addressLines
    .slice(0, 3)
    .map(
      (line, lineIndex) =>
        `<text x="24" y="${150 + lineIndex * 22}" font-size="16" fill="#d7e3ff" font-family="monospace">${escapeHtml(
          line
        )}</text>`
    )
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
      <defs>
        <linearGradient id="cryptoCardBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0d2f6f"/>
          <stop offset="100%" stop-color="#091833"/>
        </linearGradient>
      </defs>
      <rect width="720" height="420" rx="28" fill="url(#cryptoCardBg)"/>
      <text x="24" y="54" font-size="18" fill="#98b6ff" font-family="Arial, sans-serif">DigitQuo Crypto Payment</text>
      <text x="24" y="106" font-size="34" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${escapeHtml(
        label
      )} (${escapeHtml(currency)})</text>
      <text x="24" y="138" font-size="22" fill="#ffffff" font-family="Arial, sans-serif">${escapeHtml(
        amount
      )} ${escapeHtml(currency)}</text>
      <text x="24" y="186" font-size="16" fill="#98b6ff" font-family="Arial, sans-serif">Payment address</text>
      ${escapedLines}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getCryptoPaymentQrCodeUrl(paymentUri) {
  const safePaymentUri = String(paymentUri || "").trim();
  if (!safePaymentUri) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(safePaymentUri)}`;
}

async function openCryptoPaymentModal(checkoutData) {
  const modal = ensureCryptoPaymentModal();
  const title = document.getElementById("cryptoPaymentTitle");
  const summary = document.getElementById("cryptoPaymentSummary");
  const qr = document.getElementById("cryptoPaymentQr");
  const currency = document.getElementById("cryptoPaymentCurrency");
  const amount = document.getElementById("cryptoPaymentAmount");
  const priceBreakdown = document.getElementById("cryptoPaymentPriceBreakdown");
  const address = document.getElementById("cryptoPaymentAddress");
  const status = document.getElementById("cryptoPaymentStatus");
  const exitButton = document.getElementById("cryptoExitPaymentBtn");
  const copyButton = document.getElementById("cryptoCopyAddressBtn");
  const copyAmountButton = document.getElementById("cryptoCopyAmountBtn");
  const genericWalletLink = document.getElementById("cryptoOpenGenericWalletBtn");
  const crypto = checkoutData?.crypto || {};
  const finalAmount = Number(checkoutData?.pricing?.finalAmount || 0);
  const quotedUsdAmount = Number(crypto.amountUsd || 0);
  let userExited = false;

  if (
    !Number.isFinite(finalAmount) ||
    finalAmount <= 0 ||
    !Number.isFinite(quotedUsdAmount) ||
    Math.abs(finalAmount - quotedUsdAmount) > 0.001
  ) {
    throw new Error("The crypto quote does not match the checkout total. Please try again.");
  }

  if (title) {
    title.textContent = `Pay with ${crypto.label || String(crypto.currency || "").toUpperCase()}`;
  }
  if (summary) {
    summary.textContent = `Scan the address in Cwallet, then enter exactly ${crypto.amount || "-"} ${String(
      crypto.currency || ""
    ).toUpperCase()}. Order ${checkoutData.siteOrderId} needs ${crypto.confirmationsRequired || 1} confirmation(s).`;
  }
  if (currency) {
    currency.textContent = `${crypto.label || "-"} (${String(crypto.currency || "").toUpperCase()})`;
  }
  if (amount) {
    amount.textContent = `${crypto.amount || "-"} ${String(crypto.currency || "").toUpperCase()}`;
  }
  if (priceBreakdown) {
    priceBreakdown.innerHTML = renderCheckoutPriceBreakdown({
      ...(checkoutData?.pricing || {}),
      couponCode: checkoutData?.coupon?.code || "",
    });
  }
  if (address) {
    address.textContent = crypto.address || "-";
  }
  if (status) {
    status.textContent = "Waiting for payment detection.";
  }
  if (genericWalletLink) {
    genericWalletLink.href = crypto.paymentUri || "#";
    genericWalletLink.hidden = !crypto.paymentUri;
  }
  if (qr) {
    if (crypto.address) {
      qr.src = getCryptoPaymentQrCodeUrl(crypto.address);
      qr.hidden = false;
    } else {
      qr.hidden = true;
    }
  }

  copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(crypto.address || "");
      if (status) {
        status.textContent = "Address copied. Waiting for payment detection.";
      }
    } catch {
      if (status) {
        status.textContent = "Could not copy the address automatically.";
      }
    }
  };

  if (copyAmountButton instanceof HTMLButtonElement) {
    copyAmountButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(String(crypto.amount || ""));
        if (status) {
          status.textContent = `Amount copied: ${crypto.amount || "-"} ${String(
            crypto.currency || ""
          ).toUpperCase()}.`;
        }
      } catch {
        if (status) {
          status.textContent = "Could not copy the amount automatically.";
        }
      }
    };
  }

  if (exitButton instanceof HTMLButtonElement) {
    exitButton.onclick = () => {
      const shouldExit = window.confirm(
        "Exit crypto payment? You can check the payment status later from your orders if you already sent the funds."
      );
      if (!shouldExit) {
        return;
      }

      userExited = true;
      modal.setAttribute("hidden", "");
    };
  }

  modal.removeAttribute("hidden");

  const startedAt = Date.now();
  while (Date.now() - startedAt < 15 * 60 * 1000) {
    if (userExited) {
      throw new Error("Crypto payment failed.");
    }

    await new Promise((resolve) => window.setTimeout(resolve, 8000));
    const response = await getCryptoPaymentStatus(checkoutData.siteOrderId);
    const order = response?.order || {};

    if (status) {
      if (order.payment_status === "paid") {
        status.textContent = `Payment confirmed with ${Number(order.crypto_confirmations || 0)} confirmation(s).`;
      } else if (Number(order.crypto_confirmations || 0) > 0 || Number(order.crypto_amount_received || 0) > 0) {
        status.textContent = `Payment detected. Confirmations: ${Number(order.crypto_confirmations || 0)} / ${Number(
          order.crypto_confirmation_target || crypto.confirmationsRequired || 1
        )}.`;
      } else {
        status.textContent = "Waiting for payment detection.";
      }
    }

    if (order.payment_status === "paid") {
      modal.setAttribute("hidden", "");
      return order;
    }
  }

  throw new Error("Crypto payment was not confirmed yet. You can check the order later from your account.");
}

async function renderPlanRequirementsPage(user) {
  if (!planRequirementsRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const pagePlanKey = planRequirementsRoot.dataset.planKey || "";
  const planKey = pagePlanKey || params.get("plan") || readSelectedPlan();
  const browsePage = getPlanCatalogPagePath(planKey);
  const plan = getPlanByKey(planKey);
  const requirementsPage = getPlanRequirementsPagePath(planKey);

  if (!plan) {
    planRequirementsRoot.innerHTML = `
      <article class="card cart-empty">
        <h1 class="section-title">Plan Not Found</h1>
        <p class="section-subtitle">Choose a package first before filling the project requirement form.</p>
        <a href="${browsePage}" class="btn btn-primary">Back to Pricing</a>
      </article>
    `;
    return;
  }

  let authenticatedUser = user;

  if (!authenticatedUser) {
    authenticatedUser = await resolveAuthenticatedUiUser();
  }

  if (!authenticatedUser) {
    const currentRequirementsPath = `${window.location.pathname.split("/").pop() || "plan-requirements.html"}${window.location.search}`;
    const loginRedirectTarget = requirementsPage || currentRequirementsPath || "pricing.html";
    window.location.href = `login.html?redirect=${encodeURIComponent(loginRedirectTarget)}`;
    return;
  }

  saveSelectedPlan(planKey);
  currentUiUser = authenticatedUser;
  const planContext = getPlanContext(planKey, plan);
  const appliedCoupon = getStoredPlanCoupon(planKey);
  const selectedAddOns = getPlanAddOnsByIds(plan, getStoredPlanAddOnIds(planKey));
  const pricing = getPlanPricingWithCoupon(plan, appliedCoupon, {
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });
  const displayedPricing = await getDisplayedPlanPricing(plan, appliedCoupon, {
    addOnIds: selectedAddOns.map((addOn) => addOn.id),
  });

  const showBotSection = isBotPlanKey(planKey);
  const showAdvancedBotSection = planKey === "bot-premium" || planKey === "bot-enterprise";
  const showBasicSection = planKey === "basic" || planKey === "business" || planKey === "professional";
  const showBusinessSection = planKey === "business" || planKey === "professional";
  const showProfessionalSection = planKey === "professional";
  const showEcommerceSection = planKey === "ecommerce" || planKey === "advanced-ecommerce";
  const showAdvancedEcommerceSection = planKey === "advanced-ecommerce";

  planRequirementsRoot.innerHTML = `
    <div class="plan-form-layout">
      <article class="card plan-form-card">
        <span class="eyebrow">${escapeHtml(planContext.requirementsEyebrow)}</span>
        <h1 class="section-title">${escapeHtml(plan.name)}</h1>
        <p class="section-subtitle">${escapeHtml(planContext.requirementsSubtitle)}</p>

        <form id="planRequirementsForm" class="contact-form">
          <div class="field-row">
            <div class="field-block">
              <label for="planCustomerName">Full Name</label>
              <input id="planCustomerName" name="customerName" type="text" value="${escapeHtml(authenticatedUser.fullName || "")}" required />
            </div>
            <div class="field-block">
              <label for="planCustomerEmail">Email</label>
              <input id="planCustomerEmail" name="customerEmail" type="email" value="${escapeHtml(authenticatedUser.email || "")}" readonly required />
            </div>
          </div>

          <div class="field-block">
            <label for="planCustomerPhone">Phone</label>
            <input id="planCustomerPhone" name="customerPhone" type="tel" value="${escapeHtml(authenticatedUser.phone || "")}" placeholder="+91 98765 43210" required />
          </div>

          <div class="field-block">
            <label for="projectName">Project name</label>
            <input id="projectName" name="projectName" type="text" placeholder="${escapeHtml(planContext.projectNamePlaceholder)}" required />
          </div>

          <div class="field-block">
            <span class="plan-form-option-label">Delivery Preference</span>
            <label class="plan-check-option plan-check-option--single" for="planFastDelivery">
              <input id="planFastDelivery" name="fastDelivery" type="checkbox" value="yes" />
              <span>Fast delivery (+10%)</span>
            </label>
            <p class="plan-form-option-note" id="planFastDeliveryTimingNote" hidden aria-live="polite"></p>
          </div>

          ${
            showBotSection
              ? `
                <div class="plan-form-section">
                  <h3>${escapeHtml(plan.name)} Requirements</h3>
                  <div class="field-block">
                    <label for="botIdea">What should your bot do for the server?</label>
                    <textarea id="botIdea" name="botIdea" required></textarea>
                  </div>
                  <div class="field-row">
                    <div class="field-block">
                      <label for="serverAudience">Who is this bot for?</label>
                      <input id="serverAudience" name="serverAudience" type="text" placeholder="Gaming community, creator server, support team..." required />
                    </div>
                    <div class="field-block">
                      <label for="serverSize">Expected server size</label>
                      <input id="serverSize" name="serverSize" type="text" placeholder="Example: 500 members" required />
                    </div>
                  </div>
                  <div class="field-block">
                    <label>Core bot systems needed</label>
                    ${renderCheckboxGroup(
                      "botFeatures",
                      [
                        "Welcome System",
                        "Auto Roles",
                        "Moderation Commands",
                        "Reaction Roles",
                        "Ticket System",
                        "Logs and Automod",
                        "Leveling or Economy",
                        "Custom Embeds",
                        "Giveaways or Events",
                      ],
                      "botOtherFeature"
                    )}
                  </div>
                  ${
                    showAdvancedBotSection
                      ? `
                        <div class="field-block">
                          <label>Advanced systems needed</label>
                          ${renderCheckboxGroup(
                            "botAdvancedFeatures",
                            [
                              "API Integrations",
                              "Payment or Crypto Features",
                              "Dashboard",
                              "Marketplace Logic",
                              "SaaS Bot Platform",
                              "Database Optimization",
                              "Multi-Server Sync",
                              "Anti-Abuse Systems",
                            ],
                            "botAdvancedOtherFeature"
                          )}
                        </div>
                      `
                      : ""
                  }
                  <div class="field-block">
                    <label for="botCommands">Commands, workflows, or automations you already know you need</label>
                    <textarea id="botCommands" name="botCommands" placeholder="Examples: onboarding flow, application review, purchase logging, wallet checks..."></textarea>
                  </div>
                  <div class="field-row">
                    <div class="field-block">
                      <label for="botIntegrations">Integrations needed</label>
                      <input id="botIntegrations" name="botIntegrations" type="text" placeholder="APIs, payments, dashboards, webhooks..." />
                    </div>
                    <div class="field-block">
                      <label for="botReferences">Reference bots or style direction</label>
                      <input id="botReferences" name="botReferences" type="text" placeholder="Links, examples, or bot names" />
                    </div>
                  </div>
                </div>
              `
              : ""
          }

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
          <div class="plan-currency-shell">
            ${getDisplayCurrencyControlMarkup("Display Currency")}
          </div>
          <p class="plan-form-price" id="planRequirementFinalAmount">${escapeHtml(
            await formatPriceInCurrency(displayedPricing.finalAmount, displayedPricing.currencyCode)
          )}</p>
          <div class="plan-form-summary-row">
            <span>Plan Price</span>
            <strong id="planRequirementPlanAmount">${escapeHtml(
              await formatPriceInCurrency(displayedPricing.planAmount, displayedPricing.currencyCode)
            )}</strong>
          </div>
          <div class="plan-form-summary-row" id="planRequirementAddOnRow" ${selectedAddOns.length ? "" : "hidden"}>
            <span id="planRequirementAddOnLabel">${escapeHtml(
              selectedAddOns.length ? selectedAddOns.map((addOn) => addOn.name).join(", ") : "Selected Add-ons"
            )}</span>
            <strong id="planRequirementAddOnValue">+ ${escapeHtml(
              await formatPriceInCurrency(displayedPricing.addOnAmount, displayedPricing.currencyCode)
            )}</strong>
          </div>
          <div class="plan-form-summary-row" id="planRequirementFastDeliveryRow" hidden>
            <span>Fast Delivery</span>
            <strong id="planRequirementFastDeliveryValue">+ ${escapeHtml(
              await formatPriceInCurrency(0, displayedPricing.currencyCode)
            )}</strong>
          </div>
          <div class="plan-form-summary-row">
            <span>Subtotal</span>
            <strong id="planRequirementBaseAmount">${escapeHtml(
              await formatPriceInCurrency(displayedPricing.baseAmount, displayedPricing.currencyCode)
            )}</strong>
          </div>
          <div class="plan-form-summary-row" id="planRequirementCouponRow" ${appliedCoupon ? "" : "hidden"}>
            <span id="planRequirementCouponLabel">${escapeHtml(appliedCoupon ? `Coupon (${appliedCoupon.coupon_code})` : "Coupon Discount")}</span>
            <strong id="planRequirementCouponValue">${
              displayedPricing.discountAmount
                ? `- ${escapeHtml(await formatPriceInCurrency(displayedPricing.discountAmount, displayedPricing.currencyCode))}`
                : escapeHtml(await formatPriceInCurrency(0, displayedPricing.currencyCode))
            }</strong>
          </div>
          <div class="plan-form-summary-row">
            <span>Pricing Currency</span>
            <strong id="planRequirementPaymentMethodLabel">${
              displayedPricing.currencyCode === "usd" ? "USD" : "INR"
            }</strong>
          </div>
          <p class="plan-form-coupon-note" id="planRequirementCouponNote">
            ${
              appliedCoupon
                ? `${escapeHtml(appliedCoupon.coupon_code)} will be revalidated before payment is created.`
                : "Apply a coupon on the plan details page to see the discount here."
            }
          </p>
          <ul class="plan-feature-list" id="planRequirementFeatureList">
            ${renderPlanFeatureListMarkup(planKey)}
          </ul>
        </article>
      </aside>
    </div>
  `;

  const form = document.getElementById("planRequirementsForm");
  const fastDeliveryInput = document.getElementById("planFastDelivery");
  const paymentMethodLabel = document.getElementById("planRequirementPaymentMethodLabel");
  fastDeliveryInput?.addEventListener("change", () => {
    syncPlanCouponUi(planKey).catch((error) => {
      console.error("Could not sync plan coupon UI:", error);
    });
  });
  bindDisplayCurrencyControls();

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!dqAuth || !dqAuth.isConfigured()) {
      window.location.href = "login.html";
      return;
    }

    const session = typeof dqAuth.getSession === "function" ? await dqAuth.getSession() : null;
    if (!session?.user?.id || !session.access_token) {
      const currentRequirementsPath = `${window.location.pathname.split("/").pop() || "plan-requirements.html"}${window.location.search}`;
      window.location.href = `login.html?redirect=${encodeURIComponent(currentRequirementsPath)}`;
      return;
    }

    const formData = new FormData(form);
    const customerName = String(formData.get("customerName") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const customerPhone = String(formData.get("customerPhone") || "").trim();
    const projectName = String(formData.get("projectName") || "").trim();
    const fastDelivery = String(formData.get("fastDelivery") || "").trim() === "yes";
    const requirements = {
      delivery: {
        fastDelivery,
      },
      bot: showBotSection
        ? {
            serverIdea: String(formData.get("botIdea") || "").trim(),
            serverAudience: String(formData.get("serverAudience") || "").trim(),
            serverSize: String(formData.get("serverSize") || "").trim(),
            features: readCheckboxValues(formData, "botFeatures"),
            otherFeature: String(formData.get("botOtherFeature") || "").trim(),
            advancedFeatures: readCheckboxValues(formData, "botAdvancedFeatures"),
            otherAdvancedFeature: String(formData.get("botAdvancedOtherFeature") || "").trim(),
            commandsWorkflows: String(formData.get("botCommands") || "").trim(),
            integrations: String(formData.get("botIntegrations") || "").trim(),
            references: String(formData.get("botReferences") || "").trim(),
          }
        : null,
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
        requirements.bot?.serverIdea ||
        requirements.ecommerce?.storeIdea ||
        requirements.basic.websiteIdea ||
        `${plan.name} Requirement`;

    const submitButton = form.querySelector('button[type="submit"]');

    try {
      const selectedAddOnIds = getStoredPlanAddOnIds(planKey);
      const selectedCheckoutAddOns = getPlanAddOnsByIds(plan, selectedAddOnIds);
      const checkoutCoupon = getStoredPlanCoupon(planKey);
      const pricingOptions = {
        addOnIds: selectedAddOnIds,
        fastDelivery,
      };
      const [checkoutPricingInr, checkoutPricingUsd] = await Promise.all([
        getPlanPricingForDisplayCurrency(plan, checkoutCoupon, pricingOptions, "inr"),
        getPlanPricingForDisplayCurrency(plan, checkoutCoupon, pricingOptions, "usd"),
      ]);
      const withCheckoutDetails = (pricing) => ({
        ...pricing,
        selectedAddOns: selectedCheckoutAddOns,
        couponCode: checkoutCoupon?.coupon_code || "",
      });
      const paymentSelection = await openPaymentMethodSelectionModal(plan.name, {
        preferredCurrency: readDisplayCurrencyPreference().currency,
        inrPricing: withCheckoutDetails(checkoutPricingInr),
        usdPricing: withCheckoutDetails(checkoutPricingUsd),
      });
      const paymentMethod = String(paymentSelection?.paymentMethod || "inr").trim().toLowerCase();
      const cryptoCurrency = String(paymentSelection?.cryptoCurrency || "btc").trim().toLowerCase();
      const pricingCurrency =
        paymentMethod === "crypto" || String(paymentSelection?.pricingCurrency || "").toUpperCase() === "USD"
          ? "USD"
          : "INR";

      if (paymentMethodLabel) {
        paymentMethodLabel.textContent =
          paymentMethod === "crypto"
            ? `USD / ${getCryptoCurrencyDisplayLabel(cryptoCurrency)}`
            : pricingCurrency === "USD"
            ? "USD pricing / INR settlement"
            : "INR";
      }

      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent = paymentMethod === "crypto" ? "Creating Crypto Payment..." : "Opening Payment...";
      }

      const orderPayload = {
        planKey,
        addOnIds: selectedAddOnIds,
        customerName,
        customerEmail,
        customerPhone,
        projectName,
        ideaSummary,
        fastDelivery,
        couponCode: checkoutCoupon?.coupon_code || "",
        pricingCurrency,
        requirements,
      };

      if (paymentMethod === "crypto") {
        const checkoutData = await createPlanCryptoOrder({
          ...orderPayload,
          cryptoCurrency,
        });

        if (submitButton instanceof HTMLButtonElement) {
          submitButton.textContent = "Waiting for Confirmation...";
        }

        await openCryptoPaymentModal(checkoutData);
      } else {
        const checkoutData = await createPlanPaymentOrder(orderPayload);
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
      }

      removeCartItem(planKey);
      clearStoredPlanCoupon(planKey);
      clearStoredPlanAddOnIds(planKey);
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

async function resolveAuthenticatedUiUser() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    return null;
  }

  const rawUser = await dqAuth.getCurrentUser();
  if (!rawUser) {
    return null;
  }

  let profile = null;
  if (typeof dqAuth.getCurrentProfile === "function") {
    try {
      profile = await Promise.race([
        dqAuth.getCurrentProfile(),
        new Promise((resolve) => {
          window.setTimeout(() => resolve(null), 1200);
        }),
      ]);
    } catch (error) {
      profile = null;
    }
  }

  return mergeUserAndProfile(rawUser, profile);
}

async function initAuthUi() {
  if (!dqAuth || !dqAuth.isConfigured()) {
    currentUiUser = null;
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    updatePlanBuyLinks(null);
    await renderCartPage(null);
    renderProfilePage(null);
    await renderOrdersPage(null);
    renderQuoteRequestPage(null);
    await renderCustomPlanPage(null);
    await renderPlanRequirementsPage(null);
    return;
  }

  try {
    const user = await resolveAuthenticatedUiUser();
    if (!user) {
      currentUiUser = null;
      bindPortfolioQuoteTrigger(null);
      updateQuoteActionLinks(null);
      updatePlanBuyLinks(null);
      await renderCartPage(null);
      renderProfilePage(null);
      await renderOrdersPage(null);
      renderQuoteRequestPage(null);
      await renderCustomPlanPage(null);
      await renderPlanRequirementsPage(null);
      return;
    }

    currentUiUser = user;
    bindPortfolioQuoteTrigger(user);
    updateQuoteActionLinks(user);
    updatePlanBuyLinks(user);
    buildProfileMenu(user);
    await renderCartPage(user);
    renderProfilePage(user);
    await renderOrdersPage(user);
    renderQuoteRequestPage(user);
    await renderCustomPlanPage(user);
    await renderPlanRequirementsPage(user);
  } catch {
    currentUiUser = null;
    bindPortfolioQuoteTrigger(null);
    updateQuoteActionLinks(null);
    updatePlanBuyLinks(null);
    await renderCartPage(null);
    renderProfilePage(null);
    await renderOrdersPage(null);
    renderQuoteRequestPage(null);
    await renderCustomPlanPage(null);
    await renderPlanRequirementsPage(null);
  }
}

async function bindAuthUiSubscription() {
  if (authUiSubscriptionBound || !dqAuth || !dqAuth.isConfigured()) {
    return;
  }

  try {
    const client = await dqAuth.getClient();
    if (!client) {
      return;
    }

    authUiSubscriptionBound = true;
    client.auth.onAuthStateChange(() => {
      initAuthUi().catch((error) => {
        console.error("Could not refresh auth UI after auth change:", error);
      });
    });
  } catch (error) {
    console.error("Could not bind auth UI subscription:", error);
  }
}

document.addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const target = event.target.closest("[data-plan-add], [data-cart-remove], [data-cart-clear]");
  if (!target) {
    return;
  }

  if (target.dataset.planAdd) {
    await handlePlanAdd(target.dataset.planAdd);
    return;
  }

  if (target.dataset.cartRemove) {
    removeCartItem(target.dataset.cartRemove);
    await initAuthUi();
    return;
  }

  if (target.dataset.cartClear === "true") {
    clearCart();
    await initAuthUi();
  }
});

renderPlanDetailsPage().catch((error) => {
  console.error("Could not render plan details page:", error);
});
bindPricingActions().catch((error) => {
  console.error("Could not bind pricing actions:", error);
});
bindAuthUiSubscription().catch((error) => {
  console.error("Could not start auth UI subscription:", error);
});
initAuthUi().catch((error) => {
  console.error("Could not initialize auth UI:", error);
});
initAutoTechRows();
window.addEventListener("load", initAutoTechRows, { once: true });
window.addEventListener("resize", initAutoTechRows);
bindDisplayCurrencyControls();
