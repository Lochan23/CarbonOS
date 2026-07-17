/* =========================================================
   KARBONCRED BUYER JAVASCRIPT
   File: js/buyer.js

   PART 1:
   - Dashboard navigation
   - Marketplace credit data
   - Credit card rendering
   - Search
   - Category filter
   - Marketplace statistics
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeBuyerNavigation();
  initializeMarketplace();
});

/* =========================================================
   DEMO MARKETPLACE DATA

   Later this data can be replaced with Supabase data.
========================================================= */

const marketplaceCredits = [
  {
    id: "KC-SOLAR-001",
    projectName: "Delhi Rooftop Solar Project",
    sellerName: "GreenRay Energy",
    projectType: "solar",
    location: "New Delhi, India",
    availableCredits: 420,
    pricePerCredit: 780,
    vintage: "2026",
    certification: "CCTS Approved",
    description:
      "Verified rooftop solar project supplying renewable electricity to residential and commercial buildings.",
    carbonReduction: 420,
    status: "available"
  },

  {
    id: "KC-WIND-002",
    projectName: "Gujarat MSME Wind Project",
    sellerName: "AeroWind Solutions",
    projectType: "wind",
    location: "Kutch, Gujarat",
    availableCredits: 680,
    pricePerCredit: 840,
    vintage: "2026",
    certification: "CCTS Approved",
    description:
      "Wind-based clean energy project supporting MSME manufacturing units across Gujarat.",
    carbonReduction: 680,
    status: "available"
  },

  {
    id: "KC-BIO-003",
    projectName: "Punjab Biomass Energy Plant",
    sellerName: "BioHarvest Power",
    projectType: "biomass",
    location: "Ludhiana, Punjab",
    availableCredits: 315,
    pricePerCredit: 720,
    vintage: "2025",
    certification: "Audit Verified",
    description:
      "Agricultural residue is converted into renewable energy while reducing open-field crop burning.",
    carbonReduction: 315,
    status: "available"
  },

  {
    id: "KC-HYDRO-004",
    projectName: "Himachal Micro Hydro Project",
    sellerName: "MountainFlow Energy",
    projectType: "hydro",
    location: "Kullu, Himachal Pradesh",
    availableCredits: 250,
    pricePerCredit: 910,
    vintage: "2026",
    certification: "CCTS Approved",
    description:
      "Small-scale hydroelectric project generating renewable energy with low environmental impact.",
    carbonReduction: 250,
    status: "available"
  },

  {
    id: "KC-EFF-005",
    projectName: "Maharashtra Industrial Efficiency",
    sellerName: "EcoProcess Industries",
    projectType: "efficiency",
    location: "Pune, Maharashtra",
    availableCredits: 540,
    pricePerCredit: 690,
    vintage: "2025",
    certification: "Audit Verified",
    description:
      "Energy-efficiency upgrades reduce electricity consumption and industrial greenhouse-gas emissions.",
    carbonReduction: 540,
    status: "available"
  },

  {
    id: "KC-SOLAR-006",
    projectName: "Rajasthan Solar Microgrid",
    sellerName: "SunGrid India",
    projectType: "solar",
    location: "Jaisalmer, Rajasthan",
    availableCredits: 760,
    pricePerCredit: 820,
    vintage: "2026",
    certification: "CCTS Approved",
    description:
      "A rural solar microgrid delivering reliable clean electricity to underserved communities.",
    carbonReduction: 760,
    status: "available"
  }
];

/* =========================================================
   BUYER SIDEBAR NAVIGATION
========================================================= */

function initializeBuyerNavigation() {
  const navigationButtons =
    document.querySelectorAll(".side[data-section]");

  const dashboardSections =
    document.querySelectorAll(".dash-section");

  if (
    !navigationButtons.length ||
    !dashboardSections.length
  ) {
    return;
  }

  navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSectionId =
        button.dataset.section;

      if (!targetSectionId) {
        return;
      }

      navigationButtons.forEach((navButton) => {
        navButton.classList.remove("active");
      });

      dashboardSections.forEach((section) => {
        section.classList.remove("active");
      });

      button.classList.add("active");

      const targetSection =
        document.getElementById(targetSectionId);

      if (targetSection) {
        targetSection.classList.add("active");
      }

      updateDashboardHeading(button);
    });
  });
}

/* =========================================================
   UPDATE DASHBOARD HEADING
========================================================= */

function updateDashboardHeading(activeButton) {
  const dashboardTitle =
    document.getElementById("dashboardTitle");

  const dashboardSubtitle =
    document.getElementById("dashboardSubtitle");

  if (dashboardTitle) {
    dashboardTitle.textContent =
      activeButton.dataset.title ||
      activeButton.textContent.trim();
  }

  if (dashboardSubtitle) {
    dashboardSubtitle.textContent =
      activeButton.dataset.subtitle ||
      "Buyer Dashboard";
  }
}

/* =========================================================
   INITIALIZE MARKETPLACE
========================================================= */

function initializeMarketplace() {
  const marketplaceGrid =
    document.getElementById("creditGrid");

  if (!marketplaceGrid) {
    return;
  }

  renderMarketplaceCredits(marketplaceCredits);
  initializeMarketplaceSearch();
  initializeMarketplaceFilter();
  updateMarketplaceStatistics(marketplaceCredits);
}

/* =========================================================
   RENDER MARKETPLACE CARDS
========================================================= */

function renderMarketplaceCredits(credits) {
  const marketplaceGrid =
    document.getElementById("creditGrid");

  const emptyState =
    document.getElementById("marketplaceEmpty");

  if (!marketplaceGrid) {
    return;
  }

  marketplaceGrid.innerHTML = "";

  if (!credits.length) {
    if (emptyState) {
      emptyState.classList.remove("hidden");
    } else {
      marketplaceGrid.innerHTML = `
        <div class="panel">
          <h3>No carbon credits found</h3>
          <p>
            Try changing the search text or project filter.
          </p>
        </div>
      `;
    }

    return;
  }

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  credits.forEach((credit) => {
    const creditCard =
      createCreditCard(credit);

    marketplaceGrid.appendChild(creditCard);
  });
}

/* =========================================================
   CREATE CREDIT CARD
========================================================= */

function createCreditCard(credit) {
  const article =
    document.createElement("article");

  article.className = "credit";

  article.dataset.creditId = credit.id;
  article.dataset.projectType =
    credit.projectType;

  article.innerHTML = `
    <div class="credit-top">
      <span class="pill">
        ${formatProjectType(credit.projectType)}
      </span>

      <small>${escapeHTML(credit.id)}</small>
    </div>

    <h3>${escapeHTML(credit.projectName)}</h3>

    <p>${escapeHTML(credit.description)}</p>

    <div class="credit-info">
      <div>
        <span>Seller</span>
        <b>${escapeHTML(credit.sellerName)}</b>
      </div>

      <div>
        <span>Location</span>
        <b>${escapeHTML(credit.location)}</b>
      </div>

      <div>
        <span>Available</span>
        <b>
          ${formatNumber(credit.availableCredits)}
          Credits
        </b>
      </div>

      <div>
        <span>Price</span>
        <b>
          ₹${formatNumber(credit.pricePerCredit)}
          / Credit
        </b>
      </div>

      <div>
        <span>Vintage</span>
        <b>${escapeHTML(credit.vintage)}</b>
      </div>

      <div>
        <span>Verification</span>
        <b>${escapeHTML(credit.certification)}</b>
      </div>
    </div>

    <div
      class="barcode"
      aria-label="Credit verification barcode"
      title="${escapeHTML(credit.id)}"
    ></div>

    <button
      type="button"
      class="btn primary buy"
      data-buy-credit="${escapeHTML(credit.id)}"
    >
      Buy Credit
    </button>
  `;

  return article;
}

/* =========================================================
   MARKETPLACE SEARCH
========================================================= */

function initializeMarketplaceSearch() {
  const searchInput =
    document.getElementById("marketSearch");

  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", () => {
    applyMarketplaceFilters();
  });
}

/* =========================================================
   MARKETPLACE CATEGORY FILTER
========================================================= */

function initializeMarketplaceFilter() {
  const categoryFilter =
    document.getElementById("marketFilter");

  if (!categoryFilter) {
    return;
  }

  categoryFilter.addEventListener(
    "change",
    () => {
      applyMarketplaceFilters();
    }
  );
}

/* =========================================================
   APPLY SEARCH AND FILTER
========================================================= */

function applyMarketplaceFilters() {
  const searchInput =
    document.getElementById("marketSearch");

  const categoryFilter =
    document.getElementById("marketFilter");

  const searchTerm =
    searchInput?.value
      .trim()
      .toLowerCase() || "";

  const selectedCategory =
    categoryFilter?.value
      .trim()
      .toLowerCase() || "all";

  const filteredCredits =
    marketplaceCredits.filter((credit) => {
      const matchesSearch =
        matchesMarketplaceSearch(
          credit,
          searchTerm
        );

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "" ||
        credit.projectType.toLowerCase() ===
          selectedCategory;

      return matchesSearch && matchesCategory;
    });

  renderMarketplaceCredits(filteredCredits);
  updateMarketplaceStatistics(filteredCredits);
}

/* =========================================================
   SEARCH MATCHING
========================================================= */

function matchesMarketplaceSearch(
  credit,
  searchTerm
) {
  if (!searchTerm) {
    return true;
  }

  const searchableText = [
    credit.id,
    credit.projectName,
    credit.sellerName,
    credit.projectType,
    credit.location,
    credit.vintage,
    credit.certification,
    credit.description
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(searchTerm);
}

/* =========================================================
   MARKETPLACE STATISTICS
========================================================= */

function updateMarketplaceStatistics(credits) {
  const listingCountElement =
    document.getElementById(
      "marketListingCount"
    );

  const totalCreditsElement =
    document.getElementById(
      "marketTotalCredits"
    );

  const averagePriceElement =
    document.getElementById(
      "marketAveragePrice"
    );

  const verifiedCountElement =
    document.getElementById(
      "marketVerifiedCount"
    );

  const totalCredits =
    credits.reduce(
      (total, credit) =>
        total + credit.availableCredits,
      0
    );

  const totalPrice =
    credits.reduce(
      (total, credit) =>
        total + credit.pricePerCredit,
      0
    );

  const averagePrice =
    credits.length
      ? Math.round(
          totalPrice / credits.length
        )
      : 0;

  const verifiedCount =
    credits.filter((credit) =>
      credit.certification
        .toLowerCase()
        .includes("approved")
    ).length;

  if (listingCountElement) {
    listingCountElement.textContent =
      formatNumber(credits.length);
  }

  if (totalCreditsElement) {
    totalCreditsElement.textContent =
      formatNumber(totalCredits);
  }

  if (averagePriceElement) {
    averagePriceElement.textContent =
      `₹${formatNumber(averagePrice)}`;
  }

  if (verifiedCountElement) {
    verifiedCountElement.textContent =
      formatNumber(verifiedCount);
  }
}

/* =========================================================
   GET CREDIT BY ID

   This function will also be used in Part 2.
========================================================= */

function getMarketplaceCreditById(creditId) {
  return (
    marketplaceCredits.find(
      (credit) => credit.id === creditId
    ) || null
  );
}

/* =========================================================
   PROJECT TYPE FORMATTING
========================================================= */

function formatProjectType(projectType) {
  const projectTypeNames = {
    solar: "Solar Energy",
    wind: "Wind Energy",
    biomass: "Biomass",
    hydro: "Hydro Energy",
    efficiency: "Energy Efficiency"
  };

  return (
    projectTypeNames[projectType] ||
    capitalizeBuyerText(projectType)
  );
}

/* =========================================================
   NUMBER FORMATTING
========================================================= */

function formatNumber(value) {
  const numericValue =
    Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return numericValue.toLocaleString(
    "en-IN"
  );
}

/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   TEXT CAPITALIZATION
========================================================= */

function capitalizeBuyerText(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .split(/[\s_-]+/)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
    )
    .join(" ");
}
/* =========================================================
   BUYER.JS — PART 2A

   Includes:
   - Buy Credit button events
   - Buy modal open / close
   - Selected credit details
   - Quantity validation
   - Live purchase calculation
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeBuyCreditSystem();
});

/* =========================================================
   CURRENT SELECTED CREDIT
========================================================= */

let selectedMarketplaceCredit = null;

/* =========================================================
   INITIALIZE BUY CREDIT SYSTEM
========================================================= */

function initializeBuyCreditSystem() {
  initializeBuyCreditButtons();
  initializeBuyModalControls();
  initializePurchaseQuantity();
  initializePurchaseForm();
}

/* =========================================================
   BUY BUTTON EVENT

   Event delegation is used because marketplace cards
   are dynamically created by Part 1.
========================================================= */

function initializeBuyCreditButtons() {
  const marketplaceGrid =
    document.getElementById("creditGrid");

  if (!marketplaceGrid) {
    return;
  }

  marketplaceGrid.addEventListener(
    "click",
    (event) => {
      const buyButton =
        event.target.closest(
          "[data-buy-credit]"
        );

      if (!buyButton) {
        return;
      }

      const creditId =
        buyButton.dataset.buyCredit;

      if (!creditId) {
        return;
      }

      openBuyCreditModal(creditId);
    }
  );
}

/* =========================================================
   OPEN BUY CREDIT MODAL
========================================================= */

function openBuyCreditModal(creditId) {
  const credit =
    getMarketplaceCreditById(creditId);

  if (!credit) {
    showBuyerNotification(
      "Credit listing could not be found.",
      "error"
    );

    return;
  }

  if (
    Number(credit.availableCredits) <= 0
  ) {
    showBuyerNotification(
      "This carbon credit listing is sold out.",
      "error"
    );

    return;
  }

  selectedMarketplaceCredit = credit;

  populateBuyModal(credit);

  const modal =
    document.getElementById("buyModal");

  if (!modal) {
    console.error(
      "Buy modal with ID buyModal was not found."
    );

    return;
  }

  modal.classList.add("active");
  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (quantityInput) {
    setTimeout(() => {
      quantityInput.focus();
      quantityInput.select();
    }, 100);
  }
}

/* =========================================================
   POPULATE BUY MODAL
========================================================= */

function populateBuyModal(credit) {
  setBuyerText(
    "modalCreditName",
    credit.projectName
  );

  setBuyerText(
    "modalCreditId",
    credit.id
  );

  setBuyerText(
    "modalSellerName",
    credit.sellerName
  );

  setBuyerText(
    "modalProjectType",
    formatProjectType(
      credit.projectType
    )
  );

  setBuyerText(
    "modalLocation",
    credit.location
  );

  setBuyerText(
    "modalCertification",
    credit.certification
  );

  setBuyerText(
    "modalAvailableCredits",
    `${formatNumber(
      credit.availableCredits
    )} Credits`
  );

  setBuyerText(
    "modalCreditPrice",
    `₹${formatNumber(
      credit.pricePerCredit
    )}`
  );

  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (quantityInput) {
    quantityInput.value = "1";
    quantityInput.min = "1";
    quantityInput.max =
      String(
        credit.availableCredits
      );
  }

  clearPurchaseMessage();
  updatePurchaseCalculation();
}

/* =========================================================
   MODAL CONTROLS
========================================================= */

function initializeBuyModalControls() {
  const modal =
    document.getElementById("buyModal");

  if (!modal) {
    return;
  }

  const closeButtons =
    modal.querySelectorAll(
      "[data-close-modal], .close"
    );

  closeButtons.forEach((button) => {
    button.addEventListener(
      "click",
      closeBuyCreditModal
    );
  });

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeBuyCreditModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "active"
        )
      ) {
        closeBuyCreditModal();
      }
    }
  );
}

/* =========================================================
   CLOSE BUY CREDIT MODAL
========================================================= */

function closeBuyCreditModal() {
  const modal =
    document.getElementById("buyModal");

  if (!modal) {
    return;
  }

  modal.classList.remove("active");
  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";

  selectedMarketplaceCredit = null;

  const purchaseForm =
    document.getElementById(
      "purchaseForm"
    );

  if (purchaseForm) {
    purchaseForm.reset();
  }

  clearPurchaseMessage();
}

/* =========================================================
   QUANTITY INPUT
========================================================= */

function initializePurchaseQuantity() {
  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (!quantityInput) {
    return;
  }

  quantityInput.addEventListener(
    "input",
    () => {
      sanitizePurchaseQuantity();
      updatePurchaseCalculation();
    }
  );

  quantityInput.addEventListener(
    "change",
    () => {
      validatePurchaseQuantity();
      updatePurchaseCalculation();
    }
  );

  quantityInput.addEventListener(
    "keydown",
    (event) => {
      const blockedKeys = [
        "e",
        "E",
        "+",
        "-",
        "."
      ];

      if (
        blockedKeys.includes(event.key)
      ) {
        event.preventDefault();
      }
    }
  );
}

/* =========================================================
   REMOVE INVALID QUANTITY CHARACTERS
========================================================= */

function sanitizePurchaseQuantity() {
  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (!quantityInput) {
    return;
  }

  const sanitizedValue =
    String(quantityInput.value)
      .replace(/[^\d]/g, "")
      .replace(/^0+(?=\d)/, "");

  quantityInput.value =
    sanitizedValue;
}

/* =========================================================
   VALIDATE QUANTITY
========================================================= */

function validatePurchaseQuantity() {
  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (
    !quantityInput ||
    !selectedMarketplaceCredit
  ) {
    return false;
  }

  const quantity =
    Number(quantityInput.value);

  const availableCredits =
    Number(
      selectedMarketplaceCredit
        .availableCredits
    );

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    quantityInput.value = "1";

    showPurchaseMessage(
      "Minimum purchase quantity is 1 credit.",
      "error"
    );

    return false;
  }

  if (quantity > availableCredits) {
    quantityInput.value =
      String(availableCredits);

    showPurchaseMessage(
      `Only ${formatNumber(
        availableCredits
      )} credits are currently available.`,
      "error"
    );

    return false;
  }

  clearPurchaseMessage();

  return true;
}

/* =========================================================
   LIVE PURCHASE CALCULATION
========================================================= */

function updatePurchaseCalculation() {
  const quantityInput =
    document.getElementById(
      "purchaseQuantity"
    );

  if (
    !quantityInput ||
    !selectedMarketplaceCredit
  ) {
    resetPurchaseCalculation();
    return;
  }

  const quantity =
    Number(quantityInput.value) || 0;

  const pricePerCredit =
    Number(
      selectedMarketplaceCredit
        .pricePerCredit
    ) || 0;

  const subtotal =
    quantity * pricePerCredit;

  const platformFee =
    calculatePlatformFee(subtotal);

  const taxAmount =
    calculatePurchaseTax(
      platformFee
    );

  const totalAmount =
    subtotal +
    platformFee +
    taxAmount;

  setBuyerText(
    "summaryQuantity",
    formatNumber(quantity)
  );

  setBuyerText(
    "summaryUnitPrice",
    `₹${formatCurrencyAmount(
      pricePerCredit
    )}`
  );

  setBuyerText(
    "summarySubtotal",
    `₹${formatCurrencyAmount(
      subtotal
    )}`
  );

  setBuyerText(
    "summaryPlatformFee",
    `₹${formatCurrencyAmount(
      platformFee
    )}`
  );

  setBuyerText(
    "summaryTax",
    `₹${formatCurrencyAmount(
      taxAmount
    )}`
  );

  setBuyerText(
    "summaryTotal",
    `₹${formatCurrencyAmount(
      totalAmount
    )}`
  );

  updateConfirmPurchaseButton(
    quantity,
    totalAmount
  );
}

/* =========================================================
   PLATFORM FEE

   Demo calculation:
   2% of subtotal
========================================================= */

function calculatePlatformFee(
  subtotal
) {
  const feePercentage = 0.02;

  return roundBuyerAmount(
    Number(subtotal) *
      feePercentage
  );
}

/* =========================================================
   TAX CALCULATION

   Demo calculation:
   18% GST is calculated only on the platform fee.
========================================================= */

function calculatePurchaseTax(
  platformFee
) {
  const taxPercentage = 0.18;

  return roundBuyerAmount(
    Number(platformFee) *
      taxPercentage
  );
}

/* =========================================================
   UPDATE CONFIRM BUTTON
========================================================= */

function updateConfirmPurchaseButton(
  quantity,
  totalAmount
) {
  const confirmButton =
    document.getElementById(
      "confirmPurchaseButton"
    );

  if (!confirmButton) {
    return;
  }

  const validPurchase =
    selectedMarketplaceCredit &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <=
      Number(
        selectedMarketplaceCredit
          .availableCredits
      );

  confirmButton.disabled =
    !validPurchase;

  confirmButton.textContent =
    validPurchase
      ? `Confirm Purchase • ₹${formatCurrencyAmount(
          totalAmount
        )}`
      : "Confirm Purchase";
}

/* =========================================================
   PURCHASE FORM VALIDATION

   Actual saving and portfolio updates
   will be added in Part 2B.
========================================================= */

function initializePurchaseForm() {
  const purchaseForm =
    document.getElementById(
      "purchaseForm"
    );

  if (!purchaseForm) {
    return;
  }

  purchaseForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (
        !selectedMarketplaceCredit
      ) {
        showPurchaseMessage(
          "Please select a carbon credit listing.",
          "error"
        );

        return;
      }

      const quantityValid =
        validatePurchaseQuantity();

      updatePurchaseCalculation();

      if (!quantityValid) {
        return;
      }

      const quantityInput =
        document.getElementById(
          "purchaseQuantity"
        );

      const paymentMethod =
        getSelectedPaymentMethod();

      const quantity =
        Number(
          quantityInput?.value
        );

      if (!paymentMethod) {
        showPurchaseMessage(
          "Please select a payment method.",
          "error"
        );

        return;
      }

      const purchaseData =
        createPurchaseCalculation(
          selectedMarketplaceCredit,
          quantity,
          paymentMethod
        );

      /*
         This function will be created
         in buyer.js Part 2B.
      */

      if (
        typeof completeCreditPurchase ===
        "function"
      ) {
        completeCreditPurchase(
          purchaseData
        );
      } else {
        console.log(
          "Purchase ready:",
          purchaseData
        );

        showPurchaseMessage(
          "Purchase details are valid. Add Part 2B to complete the transaction.",
          "success"
        );
      }
    }
  );
}

/* =========================================================
   GET SELECTED PAYMENT METHOD
========================================================= */

function getSelectedPaymentMethod() {
  const selectedPayment =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    );

  if (selectedPayment) {
    return selectedPayment.value;
  }

  const paymentSelect =
    document.getElementById(
      "paymentMethod"
    );

  return paymentSelect?.value || "";
}

/* =========================================================
   CREATE PURCHASE CALCULATION OBJECT
========================================================= */

function createPurchaseCalculation(
  credit,
  quantity,
  paymentMethod
) {
  const pricePerCredit =
    Number(
      credit.pricePerCredit
    );

  const subtotal =
    quantity * pricePerCredit;

  const platformFee =
    calculatePlatformFee(subtotal);

  const taxAmount =
    calculatePurchaseTax(
      platformFee
    );

  const totalAmount =
    subtotal +
    platformFee +
    taxAmount;

  return {
    creditId: credit.id,
    projectName:
      credit.projectName,
    sellerName:
      credit.sellerName,
    projectType:
      credit.projectType,
    location:
      credit.location,
    certification:
      credit.certification,
    vintage:
      credit.vintage,
    quantity,
    pricePerCredit,
    subtotal:
      roundBuyerAmount(subtotal),
    platformFee,
    taxAmount,
    totalAmount:
      roundBuyerAmount(totalAmount),
    paymentMethod,
    status: "completed",
    purchasedAt:
      new Date().toISOString()
  };
}

/* =========================================================
   RESET PURCHASE CALCULATION
========================================================= */

function resetPurchaseCalculation() {
  setBuyerText(
    "summaryQuantity",
    "0"
  );

  setBuyerText(
    "summaryUnitPrice",
    "₹0"
  );

  setBuyerText(
    "summarySubtotal",
    "₹0"
  );

  setBuyerText(
    "summaryPlatformFee",
    "₹0"
  );

  setBuyerText(
    "summaryTax",
    "₹0"
  );

  setBuyerText(
    "summaryTotal",
    "₹0"
  );

  const confirmButton =
    document.getElementById(
      "confirmPurchaseButton"
    );

  if (confirmButton) {
    confirmButton.disabled = true;
    confirmButton.textContent =
      "Confirm Purchase";
  }
}

/* =========================================================
   PURCHASE MESSAGE
========================================================= */

function showPurchaseMessage(
  message,
  type = "success"
) {
  const messageElement =
    document.getElementById(
      "purchaseMessage"
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    message;

  messageElement.style.color =
    type === "error"
      ? "var(--danger)"
      : "var(--primary)";
}

function clearPurchaseMessage() {
  const messageElement =
    document.getElementById(
      "purchaseMessage"
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = "";
}

/* =========================================================
   GENERAL BUYER NOTIFICATION
========================================================= */

function showBuyerNotification(
  message,
  type = "success"
) {
  let notification =
    document.getElementById(
      "buyerNotification"
    );

  if (!notification) {
    notification =
      document.createElement("div");

    notification.id =
      "buyerNotification";

    notification.style.position =
      "fixed";

    notification.style.top =
      "24px";

    notification.style.right =
      "24px";

    notification.style.zIndex =
      "3000";

    notification.style.maxWidth =
      "360px";

    notification.style.padding =
      "15px 18px";

    notification.style.borderRadius =
      "14px";

    notification.style.fontWeight =
      "800";

    notification.style.boxShadow =
      "0 18px 50px rgba(0, 0, 0, 0.35)";

    notification.style.transition =
      "opacity 0.25s ease, transform 0.25s ease";

    document.body.appendChild(
      notification
    );
  }

  notification.textContent =
    message;

  notification.style.color =
    type === "error"
      ? "#ffffff"
      : "#00140b";

  notification.style.background =
    type === "error"
      ? "var(--danger)"
      : "var(--primary)";

  notification.style.opacity = "1";

  notification.style.transform =
    "translateY(0)";

  clearTimeout(
    notification.hideTimer
  );

  notification.hideTimer =
    setTimeout(() => {
      notification.style.opacity =
        "0";

      notification.style.transform =
        "translateY(-10px)";
    }, 3000);
}

/* =========================================================
   SET ELEMENT TEXT
========================================================= */

function setBuyerText(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent = value;
  }
}

/* =========================================================
   CURRENCY FORMATTING
========================================================= */

function formatCurrencyAmount(value) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return "0";
  }

  return numericValue.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );
}

/* =========================================================
   ROUND MONETARY AMOUNT
========================================================= */

function roundBuyerAmount(value) {
  return Math.round(
    (Number(value) +
      Number.EPSILON) *
      100
  ) / 100;
}
/* =========================================================
   BUYER.JS — PART 3 COMPLETE

   Includes:
   - Credit retirement
   - Retirement modal
   - Retirement transaction
   - Certificate preview
   - Certificate modal
   - Buyer profile data
   - Final event initialization
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeRetirementSystem();
  initializeCertificateSystem();
  initializeBuyerProfile();
});

/* =========================================================
   RETIREMENT STORAGE KEY
========================================================= */

const BUYER_RETIREMENTS_KEY =
  "karbonCredBuyerRetirements";

/* =========================================================
   CURRENT SELECTED RETIREMENT ASSET
========================================================= */

let selectedRetirementAsset = null;

/* =========================================================
   INITIALIZE RETIREMENT SYSTEM
========================================================= */

function initializeRetirementSystem() {
  initializeRetireButtons();
  initializeRetirementModal();
  initializeRetirementQuantity();
  initializeRetirementForm();
  renderRetirementHistory();
}

/* =========================================================
   RETIRE BUTTON EVENTS
========================================================= */

function initializeRetireButtons() {
  document.addEventListener(
    "click",
    (event) => {
      const retireButton =
        event.target.closest(
          "[data-retire-credit]"
        );

      if (!retireButton) {
        return;
      }

      const portfolioId =
        retireButton.dataset
          .retireCredit;

      if (!portfolioId) {
        return;
      }

      openRetirementModal(
        portfolioId
      );
    }
  );
}

/* =========================================================
   OPEN RETIREMENT MODAL
========================================================= */

function openRetirementModal(
  portfolioId
) {
  const portfolio =
    getBuyerPortfolio();

  const asset =
    portfolio.find(
      (item) =>
        item.portfolioId ===
        portfolioId
    );

  if (!asset) {
    showBuyerNotification(
      "Portfolio asset could not be found.",
      "error"
    );

    return;
  }

  const availableQuantity =
    getAvailableAssetQuantity(
      asset
    );

  if (availableQuantity <= 0) {
    showBuyerNotification(
      "No credits are available for retirement.",
      "error"
    );

    return;
  }

  selectedRetirementAsset =
    asset;

  populateRetirementModal(
    asset
  );

  const modal =
    document.getElementById(
      "retirementModal"
    );

  if (!modal) {
    console.error(
      "Retirement modal with ID retirementModal was not found."
    );

    return;
  }

  modal.classList.add(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";

  const quantityInput =
    document.getElementById(
      "retirementQuantity"
    );

  if (quantityInput) {
    setTimeout(() => {
      quantityInput.focus();
      quantityInput.select();
    }, 100);
  }
}

/* =========================================================
   POPULATE RETIREMENT MODAL
========================================================= */

function populateRetirementModal(
  asset
) {
  setBuyerText(
    "retirementProjectName",
    asset.projectName
  );

  setBuyerText(
    "retirementCreditId",
    asset.creditId
  );

  setBuyerText(
    "retirementAvailableCredits",
    `${formatNumber(
      getAvailableAssetQuantity(
        asset
      )
    )} Credits`
  );

  setBuyerText(
    "retirementCertificateId",
    asset.certificateId
  );

  const quantityInput =
    document.getElementById(
      "retirementQuantity"
    );

  if (quantityInput) {
    quantityInput.value = "1";
    quantityInput.min = "1";
    quantityInput.max =
      String(
        getAvailableAssetQuantity(
          asset
        )
      );
  }

  const reasonInput =
    document.getElementById(
      "retirementReason"
    );

  if (reasonInput) {
    reasonInput.value = "";
  }

  clearRetirementMessage();
  updateRetirementSummary();
}

/* =========================================================
   INITIALIZE RETIREMENT MODAL
========================================================= */

function initializeRetirementModal() {
  const modal =
    document.getElementById(
      "retirementModal"
    );

  if (!modal) {
    return;
  }

  const closeButtons =
    modal.querySelectorAll(
      "[data-close-retirement], .close"
    );

  closeButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        closeRetirementModal
      );
    }
  );

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeRetirementModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "active"
        )
      ) {
        closeRetirementModal();
      }
    }
  );
}

/* =========================================================
   CLOSE RETIREMENT MODAL
========================================================= */

function closeRetirementModal() {
  const modal =
    document.getElementById(
      "retirementModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow =
    "";

  selectedRetirementAsset =
    null;

  const form =
    document.getElementById(
      "retirementForm"
    );

  if (form) {
    form.reset();
  }

  clearRetirementMessage();
}

/* =========================================================
   RETIREMENT QUANTITY
========================================================= */

function initializeRetirementQuantity() {
  const quantityInput =
    document.getElementById(
      "retirementQuantity"
    );

  if (!quantityInput) {
    return;
  }

  quantityInput.addEventListener(
    "input",
    () => {
      quantityInput.value =
        String(
          quantityInput.value
        )
          .replace(/[^\d]/g, "")
          .replace(
            /^0+(?=\d)/,
            ""
          );

      updateRetirementSummary();
    }
  );

  quantityInput.addEventListener(
    "change",
    () => {
      validateRetirementQuantity();
      updateRetirementSummary();
    }
  );

  quantityInput.addEventListener(
    "keydown",
    (event) => {
      const blockedKeys = [
        "e",
        "E",
        "+",
        "-",
        "."
      ];

      if (
        blockedKeys.includes(
          event.key
        )
      ) {
        event.preventDefault();
      }
    }
  );
}

/* =========================================================
   VALIDATE RETIREMENT QUANTITY
========================================================= */

function validateRetirementQuantity() {
  const quantityInput =
    document.getElementById(
      "retirementQuantity"
    );

  if (
    !quantityInput ||
    !selectedRetirementAsset
  ) {
    return false;
  }

  const quantity =
    Number(
      quantityInput.value
    );

  const availableQuantity =
    getAvailableAssetQuantity(
      selectedRetirementAsset
    );

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1
  ) {
    quantityInput.value =
      "1";

    showRetirementMessage(
      "Minimum retirement quantity is 1 credit.",
      "error"
    );

    return false;
  }

  if (
    quantity >
    availableQuantity
  ) {
    quantityInput.value =
      String(
        availableQuantity
      );

    showRetirementMessage(
      `Only ${formatNumber(
        availableQuantity
      )} credits are available.`,
      "error"
    );

    return false;
  }

  clearRetirementMessage();

  return true;
}

/* =========================================================
   UPDATE RETIREMENT SUMMARY
========================================================= */

function updateRetirementSummary() {
  const quantityInput =
    document.getElementById(
      "retirementQuantity"
    );

  const confirmButton =
    document.getElementById(
      "confirmRetirementButton"
    );

  const quantity =
    Number(
      quantityInput?.value
    ) || 0;

  setBuyerText(
    "retirementSummaryQuantity",
    formatNumber(
      quantity
    )
  );

  setBuyerText(
    "retirementSummaryImpact",
    `${formatNumber(
      quantity
    )} tCO₂e`
  );

  if (
    confirmButton &&
    selectedRetirementAsset
  ) {
    const available =
      getAvailableAssetQuantity(
        selectedRetirementAsset
      );

    const valid =
      Number.isInteger(
        quantity
      ) &&
      quantity >= 1 &&
      quantity <= available;

    confirmButton.disabled =
      !valid;

    confirmButton.textContent =
      valid
        ? `Retire ${formatNumber(
            quantity
          )} Credits`
        : "Retire Credits";
  }
}

/* =========================================================
   INITIALIZE RETIREMENT FORM
========================================================= */

function initializeRetirementForm() {
  const form =
    document.getElementById(
      "retirementForm"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      if (
        !selectedRetirementAsset
      ) {
        showRetirementMessage(
          "Please select a portfolio asset.",
          "error"
        );

        return;
      }

      const valid =
        validateRetirementQuantity();

      if (!valid) {
        return;
      }

      const quantityInput =
        document.getElementById(
          "retirementQuantity"
        );

      const reasonInput =
        document.getElementById(
          "retirementReason"
        );

      const quantity =
        Number(
          quantityInput?.value
        );

      const reason =
        reasonInput?.value
          .trim() || "";

      if (!reason) {
        showRetirementMessage(
          "Please enter a retirement purpose.",
          "error"
        );

        return;
      }

      completeCreditRetirement({
        portfolioId:
          selectedRetirementAsset
            .portfolioId,

        quantity,
        reason
      });
    }
  );
}

/* =========================================================
   COMPLETE CREDIT RETIREMENT
========================================================= */

function completeCreditRetirement(
  retirementData
) {
  const portfolio =
    getBuyerPortfolio();

  const asset =
    portfolio.find(
      (item) =>
        item.portfolioId ===
        retirementData.portfolioId
    );

  if (!asset) {
    showRetirementMessage(
      "Portfolio asset could not be found.",
      "error"
    );

    return;
  }

  const available =
    getAvailableAssetQuantity(
      asset
    );

  if (
    retirementData.quantity >
    available
  ) {
    showRetirementMessage(
      "Retirement quantity exceeds available credits.",
      "error"
    );

    return;
  }

  const confirmButton =
    document.getElementById(
      "confirmRetirementButton"
    );

  if (confirmButton) {
    confirmButton.disabled =
      true;

    confirmButton.textContent =
      "Retiring Credits...";
  }

  setTimeout(() => {
    asset.retiredQuantity =
      (
        Number(
          asset.retiredQuantity
        ) || 0
      ) +
      retirementData.quantity;

    asset.availableQuantity =
      Math.max(
        0,
        Number(
          asset.quantity
        ) -
          Number(
            asset.retiredQuantity
          )
      );

    if (
      asset.availableQuantity ===
      0
    ) {
      asset.status =
        "fully-retired";
    } else {
      asset.status =
        "partially-retired";
    }

    asset.lastRetiredAt =
      new Date().toISOString();

    saveBuyerPortfolio(
      portfolio
    );

    const retirementRecord = {
      retirementId:
        generateRetirementId(),

      certificateId:
        generateRetirementCertificateId(),

      portfolioId:
        asset.portfolioId,

      creditId:
        asset.creditId,

      projectName:
        asset.projectName,

      sellerName:
        asset.sellerName,

      projectType:
        asset.projectType,

      vintage:
        asset.vintage,

      quantity:
        retirementData.quantity,

      reason:
        retirementData.reason,

      retiredAt:
        new Date().toISOString(),

      status: "retired"
    };

    saveRetirementRecord(
      retirementRecord
    );

    saveRetirementTransaction(
      retirementRecord
    );

    renderBuyerPortfolio();
    renderBuyerTransactions();
    renderRetirementHistory();
    updateBuyerDashboardMetrics();

    showBuyerNotification(
      `${formatNumber(
        retirementData.quantity
      )} credits retired successfully.`,
      "success"
    );

    closeRetirementModal();

    openBuyerSection(
      "retirementSection"
    );
  }, 800);
}

/* =========================================================
   RETIREMENT RECORD STORAGE
========================================================= */

function getBuyerRetirements() {
  try {
    const stored =
      localStorage.getItem(
        BUYER_RETIREMENTS_KEY
      );

    const retirements =
      stored
        ? JSON.parse(
            stored
          )
        : [];

    return Array.isArray(
      retirements
    )
      ? retirements
      : [];
  } catch (error) {
    console.error(
      "Unable to read retirements:",
      error
    );

    return [];
  }
}

function saveBuyerRetirements(
  retirements
) {
  try {
    localStorage.setItem(
      BUYER_RETIREMENTS_KEY,
      JSON.stringify(
        retirements
      )
    );
  } catch (error) {
    console.error(
      "Unable to save retirements:",
      error
    );
  }
}

function saveRetirementRecord(
  retirementRecord
) {
  const retirements =
    getBuyerRetirements();

  retirements.unshift(
    retirementRecord
  );

  saveBuyerRetirements(
    retirements
  );
}

/* =========================================================
   SAVE RETIREMENT TRANSACTION
========================================================= */

function saveRetirementTransaction(
  retirementRecord
) {
  const transactions =
    getBuyerTransactions();

  transactions.unshift({
    transactionId:
      generateBuyerTransactionId(),

    type: "retirement",

    creditId:
      retirementRecord.creditId,

    certificateId:
      retirementRecord
        .certificateId,

    projectName:
      retirementRecord
        .projectName,

    sellerName:
      retirementRecord
        .sellerName,

    projectType:
      retirementRecord
        .projectType,

    quantity:
      retirementRecord.quantity,

    unitPrice: 0,

    subtotal: 0,

    platformFee: 0,

    taxAmount: 0,

    totalAmount: 0,

    paymentMethod:
      "not-applicable",

    reason:
      retirementRecord.reason,

    status: "completed",

    createdAt:
      retirementRecord.retiredAt
  });

  saveBuyerTransactions(
    transactions
  );
}

/* =========================================================
   RENDER RETIREMENT HISTORY
========================================================= */

function renderRetirementHistory() {
  const tableBody =
    document.getElementById(
      "retirementTableBody"
    );

  const retirementGrid =
    document.getElementById(
      "retirementGrid"
    );

  const retirements =
    getBuyerRetirements();

  if (tableBody) {
    tableBody.innerHTML = "";

    if (!retirements.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No retired credits available.
          </td>
        </tr>
      `;
    } else {
      retirements.forEach(
        (retirement) => {
          const row =
            document.createElement(
              "tr"
            );

          row.innerHTML = `
            <td>
              ${escapeHTML(
                retirement
                  .retirementId
              )}
            </td>

            <td>
              ${escapeHTML(
                retirement
                  .projectName
              )}
            </td>

            <td>
              ${formatNumber(
                retirement.quantity
              )}
            </td>

            <td>
              ${escapeHTML(
                retirement.reason
              )}
            </td>

            <td>
              ${formatBuyerDate(
                retirement.retiredAt
              )}
            </td>

            <td>
              ${escapeHTML(
                retirement
                  .certificateId
              )}
            </td>

            <td>
              <span class="pill">
                Retired
              </span>
            </td>
          `;

          tableBody.appendChild(
            row
          );
        }
      );
    }
  }

  if (retirementGrid) {
    retirementGrid.innerHTML =
      "";

    if (!retirements.length) {
      retirementGrid.innerHTML = `
        <div class="panel">
          <h3>No credits retired yet</h3>
          <p>
            Retire credits from your portfolio
            to create a permanent climate-impact record.
          </p>
        </div>
      `;
    } else {
      retirements.forEach(
        (retirement) => {
          const card =
            document.createElement(
              "article"
            );

          card.className =
            "credit";

          card.innerHTML = `
            <div class="credit-top">
              <span class="pill">
                Retired
              </span>

              <small>
                ${escapeHTML(
                  retirement
                    .retirementId
                )}
              </small>
            </div>

            <h3>
              ${escapeHTML(
                retirement
                  .projectName
              )}
            </h3>

            <p>
              ${escapeHTML(
                retirement.reason
              )}
            </p>

            <div class="credit-info">
              <div>
                <span>Quantity</span>
                <b>
                  ${formatNumber(
                    retirement
                      .quantity
                  )}
                  Credits
                </b>
              </div>

              <div>
                <span>Impact</span>
                <b>
                  ${formatNumber(
                    retirement
                      .quantity
                  )}
                  tCO₂e
                </b>
              </div>

              <div>
                <span>Vintage</span>
                <b>
                  ${escapeHTML(
                    retirement
                      .vintage
                  )}
                </b>
              </div>

              <div>
                <span>Retired On</span>
                <b>
                  ${formatBuyerDate(
                    retirement
                      .retiredAt
                  )}
                </b>
              </div>
            </div>

            <div
              class="barcode"
              title="${escapeHTML(
                retirement
                  .certificateId
              )}"
            ></div>

            <button
              type="button"
              class="btn ghost"
              data-view-retirement-certificate="${escapeHTML(
                retirement
                  .retirementId
              )}"
            >
              View Retirement Certificate
            </button>
          `;

          retirementGrid.appendChild(
            card
          );
        }
      );
    }
  }
}

/* =========================================================
   CERTIFICATE SYSTEM
========================================================= */

function initializeCertificateSystem() {
  initializeCertificateButtons();
  initializeCertificateModal();
}

/* =========================================================
   CERTIFICATE BUTTON EVENTS
========================================================= */

function initializeCertificateButtons() {
  document.addEventListener(
    "click",
    (event) => {
      const portfolioButton =
        event.target.closest(
          "[data-view-certificate]"
        );

      if (portfolioButton) {
        openPortfolioCertificate(
          portfolioButton.dataset
            .viewCertificate
        );

        return;
      }

      const retirementButton =
        event.target.closest(
          "[data-view-retirement-certificate]"
        );

      if (retirementButton) {
        openRetirementCertificate(
          retirementButton.dataset
            .viewRetirementCertificate
        );
      }
    }
  );
}

/* =========================================================
   OPEN PORTFOLIO CERTIFICATE
========================================================= */

function openPortfolioCertificate(
  portfolioId
) {
  const portfolio =
    getBuyerPortfolio();

  const asset =
    portfolio.find(
      (item) =>
        item.portfolioId ===
        portfolioId
    );

  if (!asset) {
    showBuyerNotification(
      "Certificate data could not be found.",
      "error"
    );

    return;
  }

  populateCertificateModal({
    certificateTitle:
      "Carbon Credit Ownership Certificate",

    certificateId:
      asset.certificateId,

    projectName:
      asset.projectName,

    creditId:
      asset.creditId,

    owner:
      getBuyerDisplayName(),

    quantity:
      asset.quantity,

    status:
      capitalizeBuyerText(
        asset.status
      ),

    date:
      asset.purchasedAt,

    purpose:
      "Verified carbon credit ownership",

    verification:
      asset.certification
  });

  openCertificateModal();
}

/* =========================================================
   OPEN RETIREMENT CERTIFICATE
========================================================= */

function openRetirementCertificate(
  retirementId
) {
  const retirements =
    getBuyerRetirements();

  const retirement =
    retirements.find(
      (item) =>
        item.retirementId ===
        retirementId
    );

  if (!retirement) {
    showBuyerNotification(
      "Retirement certificate could not be found.",
      "error"
    );

    return;
  }

  populateCertificateModal({
    certificateTitle:
      "Carbon Credit Retirement Certificate",

    certificateId:
      retirement.certificateId,

    projectName:
      retirement.projectName,

    creditId:
      retirement.creditId,

    owner:
      getBuyerDisplayName(),

    quantity:
      retirement.quantity,

    status:
      "Permanently Retired",

    date:
      retirement.retiredAt,

    purpose:
      retirement.reason,

    verification:
      "Permanent Retirement Record"
  });

  openCertificateModal();
}

/* =========================================================
   POPULATE CERTIFICATE MODAL
========================================================= */

function populateCertificateModal(
  data
) {
  setBuyerText(
    "certificateTitle",
    data.certificateTitle
  );

  setBuyerText(
    "certificateNumber",
    data.certificateId
  );

  setBuyerText(
    "certificateProject",
    data.projectName
  );

  setBuyerText(
    "certificateCreditId",
    data.creditId
  );

  setBuyerText(
    "certificateOwner",
    data.owner
  );

  setBuyerText(
    "certificateQuantity",
    `${formatNumber(
      data.quantity
    )} Credits`
  );

  setBuyerText(
    "certificateImpact",
    `${formatNumber(
      data.quantity
    )} tCO₂e`
  );

  setBuyerText(
    "certificateStatus",
    data.status
  );

  setBuyerText(
    "certificateDate",
    formatBuyerDate(
      data.date
    )
  );

  setBuyerText(
    "certificatePurpose",
    data.purpose
  );

  setBuyerText(
    "certificateVerification",
    data.verification
  );

  const barcode =
    document.getElementById(
      "certificateBarcode"
    );

  if (barcode) {
    barcode.title =
      data.certificateId;

    barcode.dataset
      .certificateId =
      data.certificateId;
  }

  const qrText =
    document.getElementById(
      "certificateQrText"
    );

  if (qrText) {
    qrText.textContent =
      data.certificateId;
  }
}

/* =========================================================
   OPEN CERTIFICATE MODAL
========================================================= */

function openCertificateModal() {
  const modal =
    document.getElementById(
      "certificateModal"
    );

  if (!modal) {
    console.error(
      "Certificate modal with ID certificateModal was not found."
    );

    return;
  }

  modal.classList.add(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow =
    "hidden";
}

/* =========================================================
   INITIALIZE CERTIFICATE MODAL
========================================================= */

function initializeCertificateModal() {
  const modal =
    document.getElementById(
      "certificateModal"
    );

  if (!modal) {
    return;
  }

  const closeButtons =
    modal.querySelectorAll(
      "[data-close-certificate], .close"
    );

  closeButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        closeCertificateModal
      );
    }
  );

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeCertificateModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "active"
        )
      ) {
        closeCertificateModal();
      }
    }
  );
}

/* =========================================================
   CLOSE CERTIFICATE MODAL
========================================================= */

function closeCertificateModal() {
  const modal =
    document.getElementById(
      "certificateModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "active"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow =
    "";
}

/* =========================================================
   BUYER PROFILE
========================================================= */

function initializeBuyerProfile() {
  renderBuyerProfile();
}

/* =========================================================
   RENDER BUYER PROFILE
========================================================= */

function renderBuyerProfile() {
  const currentUser =
    getBuyerCurrentUser();

  const buyerName =
    currentUser?.name ||
    "Demo Buyer";

  const buyerEmail =
    currentUser?.email ||
    "buyer@karboncred.in";

  const buyerRole =
    currentUser?.role ||
    "buyer";

  const buyerId =
    currentUser?.id ||
    "DEMO-BUYER";

  setBuyerText(
    "profileBuyerName",
    buyerName
  );

  setBuyerText(
    "profileBuyerEmail",
    buyerEmail
  );

  setBuyerText(
    "profileBuyerRole",
    capitalizeBuyerText(
      buyerRole
    )
  );

  setBuyerText(
    "profileBuyerId",
    buyerId
  );

  setBuyerText(
    "profileVerificationStatus",
    currentUser?.verified ===
      false
      ? "Pending"
      : "Verified"
  );

  const initialsElements =
    document.querySelectorAll(
      "[data-buyer-initial]"
    );

  initialsElements.forEach(
    (element) => {
      element.textContent =
        getBuyerInitials(
          buyerName
        );
    }
  );
}

/* =========================================================
   GET CURRENT BUYER
========================================================= */

function getBuyerCurrentUser() {
  try {
    const stored =
      localStorage.getItem(
        "karbonCredCurrentUser"
      );

    return stored
      ? JSON.parse(
          stored
        )
      : null;
  } catch (error) {
    console.error(
      "Unable to read buyer profile:",
      error
    );

    return null;
  }
}

/* =========================================================
   GET BUYER DISPLAY NAME
========================================================= */

function getBuyerDisplayName() {
  const currentUser =
    getBuyerCurrentUser();

  return (
    currentUser?.name ||
    "Demo Buyer"
  );
}

/* =========================================================
   BUYER INITIALS
========================================================= */

function getBuyerInitials(
  name
) {
  if (!name) {
    return "KB";
  }

  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word.charAt(0)
    )
    .join("")
    .toUpperCase();
}

/* =========================================================
   GENERATE RETIREMENT ID
========================================================= */

function generateRetirementId() {
  return (
    "RET-" +
    Date.now()
      .toString(36)
      .toUpperCase() +
    "-" +
    Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")
  );
}

/* =========================================================
   GENERATE RETIREMENT CERTIFICATE ID
========================================================= */

function generateRetirementCertificateId() {
  return (
    "RCERT-KC-" +
    Date.now()
      .toString(36)
      .toUpperCase() +
    "-" +
    Math.floor(
      Math.random() * 100000
    )
      .toString()
      .padStart(5, "0")
  );
}

/* =========================================================
   RETIREMENT MESSAGE
========================================================= */

function showRetirementMessage(
  message,
  type = "success"
) {
  const element =
    document.getElementById(
      "retirementMessage"
    );

  if (!element) {
    return;
  }

  element.textContent =
    message;

  element.style.color =
    type === "error"
      ? "var(--danger)"
      : "var(--primary)";
}

function clearRetirementMessage() {
  const element =
    document.getElementById(
      "retirementMessage"
    );

  if (!element) {
    return;
  }

  element.textContent = "";
}

/* =========================================================
   FINAL PORTFOLIO ACTION BUTTONS

   This appends retirement buttons to portfolio cards.
========================================================= */

const originalRenderPortfolioCards =
  renderPortfolioCards;

renderPortfolioCards =
  function (
    container,
    portfolio
  ) {
    originalRenderPortfolioCards(
      container,
      portfolio
    );

    const cards =
      container.querySelectorAll(
        ".portfolio-credit"
      );

    cards.forEach(
      (card, index) => {
        const asset =
          portfolio[index];

        if (!asset) {
          return;
        }

        const available =
          getAvailableAssetQuantity(
            asset
          );

        const retireButton =
          document.createElement(
            "button"
          );

        retireButton.type =
          "button";

        retireButton.className =
          "btn primary";

        retireButton.dataset
          .retireCredit =
          asset.portfolioId;

        retireButton.textContent =
          available > 0
            ? "Retire Credits"
            : "Fully Retired";

        retireButton.disabled =
          available <= 0;

        card.appendChild(
          retireButton
        );
      }
    );
  };