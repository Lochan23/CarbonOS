/* =========================================================
   KARBONCRED SELLER JAVASCRIPT
   File: js/seller.js

   Includes:
   - Seller dashboard navigation
   - IES producer/project form
   - AI carbon-credit calculation
   - Project storage
   - Audit and CCTS workflow
   - Credit listing creation
   - Seller credit inventory
   - Marketplace listing preview
   - Transactions and earnings
   - Seller profile
   - LocalStorage demo integration
========================================================= */

/* =========================================================
   STORAGE KEYS
========================================================= */

const SELLER_PROJECTS_KEY =
  "karbonCredSellerProjects";

const SELLER_CREDITS_KEY =
  "karbonCredSellerCredits";

const SELLER_LISTINGS_KEY =
  "karbonCredSellerListings";

const SELLER_TRANSACTIONS_KEY =
  "karbonCredSellerTransactions";

const SELLER_AUDIT_KEY =
  "karbonCredSellerAuditRecords";

/* =========================================================
   CURRENT STATE
========================================================= */

let currentSellerCalculation = null;
let selectedSellerCredit = null;

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeSellerNavigation();
  initializeSellerProjectForm();
  initializeSellerCalculation();
  initializeAuditActions();
  initializeListingSystem();
  initializeSellerTableActions();

  renderSellerProjects();
  renderSellerCredits();
  renderSellerListings();
  renderSellerTransactions();
  renderSellerAuditRecords();
  renderSellerProfile();
  updateSellerDashboardMetrics();
});

/* =========================================================
   SELLER SIDEBAR NAVIGATION
========================================================= */

function initializeSellerNavigation() {
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

      openSellerSection(targetSectionId);
      updateSellerDashboardHeading(button);
    });
  });
}

/* =========================================================
   OPEN SELLER SECTION
========================================================= */

function openSellerSection(sectionId) {
  const navigationButtons =
    document.querySelectorAll(".side[data-section]");

  const dashboardSections =
    document.querySelectorAll(".dash-section");

  navigationButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );

    if (
      button.dataset.section === sectionId
    ) {
      updateSellerDashboardHeading(button);
    }
  });

  dashboardSections.forEach((section) => {
    section.classList.toggle(
      "active",
      section.id === sectionId
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   UPDATE DASHBOARD HEADING
========================================================= */

function updateSellerDashboardHeading(button) {
  const dashboardTitle =
    document.getElementById("dashboardTitle");

  const dashboardSubtitle =
    document.getElementById("dashboardSubtitle");

  if (dashboardTitle) {
    dashboardTitle.textContent =
      button.dataset.title ||
      button.textContent.trim();
  }

  if (dashboardSubtitle) {
    dashboardSubtitle.textContent =
      button.dataset.subtitle ||
      "Seller Dashboard";
  }
}

/* =========================================================
   PROJECT FORM
========================================================= */

function initializeSellerProjectForm() {
  const projectForm =
    document.getElementById("projectForm");

  if (!projectForm) {
    return;
  }

  projectForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData =
      new FormData(projectForm);

    const projectData = {
      projectId:
        generateSellerProjectId(),

      producerRefId:
        getFormValue(
          formData,
          "producerRefId",
          "producerId"
        ),

      producerName:
        getFormValue(
          formData,
          "producerName"
        ),

      projectName:
        getFormValue(
          formData,
          "projectName"
        ),

      producerType:
        getFormValue(
          formData,
          "producerType",
          "projectType"
        ),

      location:
        getFormValue(
          formData,
          "location"
        ),

      state:
        getFormValue(
          formData,
          "state"
        ),

      capacityKw:
        getNumericFormValue(
          formData,
          "capacityKw",
          "capacity"
        ),

      energyGeneratedKwh:
        getNumericFormValue(
          formData,
          "energyGeneratedKwh",
          "energyGenerated"
        ),

      gridFossilPercent:
        getNumericFormValue(
          formData,
          "gridFossilPercent",
          "fossilPercentage"
        ),

      gridRenewablePercent:
        getNumericFormValue(
          formData,
          "gridRenewablePercent",
          "renewablePercentage"
        ),

      period:
        getFormValue(
          formData,
          "period"
        ),

      methodology:
        getFormValue(
          formData,
          "methodology"
        ) ||
        "Grid Displacement Method",

      documentName:
        getUploadedFileName(
          projectForm,
          "projectDocument"
        ),

      status: "draft",

      auditStatus:
        "not-submitted",

      cctsStatus:
        "not-submitted",

      createdAt:
        new Date().toISOString()
    };

    const validationResult =
      validateSellerProject(projectData);

    if (!validationResult.valid) {
      showSellerFormMessage(
        validationResult.message,
        "error"
      );

      return;
    }

    saveSellerProject(projectData);

    currentSellerCalculation =
      calculateCarbonCredits(projectData);

    saveCalculationToProject(
      projectData.projectId,
      currentSellerCalculation
    );

    updateCalculationResult(
      currentSellerCalculation
    );

    showSellerFormMessage(
      "Project saved and carbon credits calculated successfully.",
      "success"
    );

    projectForm.reset();

    renderSellerProjects();
    updateSellerDashboardMetrics();

    setTimeout(() => {
      openSellerSection(
        "calculationSection"
      );
    }, 500);
  });
}

/* =========================================================
   PROJECT VALIDATION
========================================================= */

function validateSellerProject(project) {
  if (
    !project.producerRefId ||
    !project.producerName ||
    !project.projectName ||
    !project.producerType ||
    !project.location ||
    !project.state ||
    !project.period
  ) {
    return {
      valid: false,
      message:
        "Please fill all required producer and project details."
    };
  }

  if (
    project.capacityKw <= 0
  ) {
    return {
      valid: false,
      message:
        "Project capacity must be greater than zero."
    };
  }

  if (
    project.energyGeneratedKwh <= 0
  ) {
    return {
      valid: false,
      message:
        "Energy generated must be greater than zero."
    };
  }

  if (
    project.gridFossilPercent < 0 ||
    project.gridFossilPercent > 100
  ) {
    return {
      valid: false,
      message:
        "Grid fossil percentage must be between 0 and 100."
    };
  }

  if (
    project.gridRenewablePercent < 0 ||
    project.gridRenewablePercent > 100
  ) {
    return {
      valid: false,
      message:
        "Grid renewable percentage must be between 0 and 100."
    };
  }

  const totalGridPercentage =
    project.gridFossilPercent +
    project.gridRenewablePercent;

  if (
    totalGridPercentage > 100.01
  ) {
    return {
      valid: false,
      message:
        "Fossil and renewable percentages cannot exceed 100%."
    };
  }

  return {
    valid: true,
    message: ""
  };
}

/* =========================================================
   AI CALCULATION
========================================================= */

function initializeSellerCalculation() {
  const calculateButton =
    document.getElementById(
      "calculateCreditsButton"
    );

  if (!calculateButton) {
    return;
  }

  calculateButton.addEventListener(
    "click",
    () => {
      const selectedProjectId =
        document.getElementById(
          "calculationProject"
        )?.value;

      if (!selectedProjectId) {
        showSellerNotification(
          "Please select a project first.",
          "error"
        );

        return;
      }

      const projects =
        getSellerProjects();

      const project =
        projects.find(
          (item) =>
            item.projectId ===
            selectedProjectId
        );

      if (!project) {
        showSellerNotification(
          "Selected project could not be found.",
          "error"
        );

        return;
      }

      const calculation =
        calculateCarbonCredits(project);

      currentSellerCalculation =
        calculation;

      saveCalculationToProject(
        project.projectId,
        calculation
      );

      updateCalculationResult(
        calculation
      );

      showSellerNotification(
        "AI carbon-credit calculation completed.",
        "success"
      );

      renderSellerProjects();
      updateSellerDashboardMetrics();
    }
  );
}

/* =========================================================
   CREDIT CALCULATION FORMULA
========================================================= */

function calculateCarbonCredits(project) {
  const energyGenerated =
    Number(
      project.energyGeneratedKwh
    ) || 0;

  const fossilPercentage =
    Number(
      project.gridFossilPercent
    ) || 0;

  const renewablePercentage =
    Number(
      project.gridRenewablePercent
    ) || 0;

  const fossilFactor =
    fossilPercentage / 100;

  const gridEmissionFactor =
    getGridEmissionFactor(
      project.producerType
    );

  const avoidedEmissionsKg =
    energyGenerated *
    gridEmissionFactor *
    fossilFactor;

  const avoidedEmissionsTonnes =
    avoidedEmissionsKg / 1000;

  const leakagePercentage =
    getLeakagePercentage(
      project.producerType
    );

  const leakageDeduction =
    avoidedEmissionsTonnes *
    leakagePercentage;

  const uncertaintyPercentage =
    0.03;

  const uncertaintyDeduction =
    avoidedEmissionsTonnes *
    uncertaintyPercentage;

  const grossCredits =
    avoidedEmissionsTonnes;

  const netCredits =
    Math.max(
      0,
      grossCredits -
        leakageDeduction -
        uncertaintyDeduction
    );

  const roundedCredits =
    Math.floor(netCredits);

  const renewableContribution =
    energyGenerated *
    (
      renewablePercentage /
      100
    );

  return {
    calculationId:
      generateCalculationId(),

    projectId:
      project.projectId,

    projectName:
      project.projectName,

    energyGeneratedKwh:
      energyGenerated,

    gridEmissionFactor,

    fossilPercentage,

    renewablePercentage,

    fossilDisplacedKwh:
      roundSellerAmount(
        energyGenerated *
        fossilFactor
      ),

    renewableContributionKwh:
      roundSellerAmount(
        renewableContribution
      ),

    grossEmissionsTonnes:
      roundSellerAmount(
        grossCredits
      ),

    leakagePercentage:
      leakagePercentage * 100,

    leakageDeduction:
      roundSellerAmount(
        leakageDeduction
      ),

    uncertaintyPercentage:
      uncertaintyPercentage *
      100,

    uncertaintyDeduction:
      roundSellerAmount(
        uncertaintyDeduction
      ),

    calculatedCredits:
      roundedCredits,

    carbonReductionTonnes:
      roundSellerAmount(
        netCredits
      ),

    confidenceScore:
      calculateConfidenceScore(
        project
      ),

    calculatedAt:
      new Date().toISOString(),

    status: "calculated"
  };
}

/* =========================================================
   GRID EMISSION FACTOR
========================================================= */

function getGridEmissionFactor(
  producerType
) {
  const emissionFactors = {
    rooftop_solar: 0.716,
    solar: 0.716,
    wind: 0.708,
    msme_wind: 0.708,
    biomass: 0.655,
    hydro: 0.68,
    efficiency: 0.62
  };

  return (
    emissionFactors[
      producerType
    ] ||
    0.7
  );
}

/* =========================================================
   LEAKAGE PERCENTAGE
========================================================= */

function getLeakagePercentage(
  producerType
) {
  const leakageFactors = {
    rooftop_solar: 0.01,
    solar: 0.01,
    wind: 0.015,
    msme_wind: 0.015,
    biomass: 0.04,
    hydro: 0.02,
    efficiency: 0.025
  };

  return (
    leakageFactors[
      producerType
    ] ||
    0.02
  );
}

/* =========================================================
   CONFIDENCE SCORE
========================================================= */

function calculateConfidenceScore(
  project
) {
  let score = 80;

  if (
    project.documentName
  ) {
    score += 5;
  }

  if (
    project.producerRefId
      .toUpperCase()
      .startsWith("IES")
  ) {
    score += 5;
  }

  if (
    project.energyGeneratedKwh >
    0
  ) {
    score += 4;
  }

  if (
    project.gridFossilPercent +
      project.gridRenewablePercent <=
    100
  ) {
    score += 3;
  }

  if (
    project.methodology
  ) {
    score += 3;
  }

  return Math.min(
    100,
    score
  );
}

/* =========================================================
   UPDATE CALCULATION RESULT
========================================================= */

function updateCalculationResult(
  calculation
) {
  if (!calculation) {
    return;
  }

  setSellerText(
    "calculatedCredits",
    formatSellerNumber(
      calculation.calculatedCredits
    )
  );

  setSellerText(
    "calculationProjectName",
    calculation.projectName
  );

  setSellerText(
    "grossEmissions",
    `${formatSellerDecimal(
      calculation.grossEmissionsTonnes
    )} tCO₂e`
  );

  setSellerText(
    "fossilDisplaced",
    `${formatSellerNumber(
      calculation.fossilDisplacedKwh
    )} kWh`
  );

  setSellerText(
    "leakageDeduction",
    `${formatSellerDecimal(
      calculation.leakageDeduction
    )} tCO₂e`
  );

  setSellerText(
    "uncertaintyDeduction",
    `${formatSellerDecimal(
      calculation.uncertaintyDeduction
    )} tCO₂e`
  );

  setSellerText(
    "netCarbonReduction",
    `${formatSellerDecimal(
      calculation.carbonReductionTonnes
    )} tCO₂e`
  );

  setSellerText(
    "confidenceScore",
    `${formatSellerNumber(
      calculation.confidenceScore
    )}%`
  );

  setSellerText(
    "gridEmissionFactor",
    `${formatSellerDecimal(
      calculation.gridEmissionFactor
    )} kg CO₂e/kWh`
  );

  const confidenceBar =
    document.getElementById(
      "confidenceBar"
    );

  if (confidenceBar) {
    confidenceBar.style.width =
      `${calculation.confidenceScore}%`;
  }
}

/* =========================================================
   SAVE CALCULATION TO PROJECT
========================================================= */

function saveCalculationToProject(
  projectId,
  calculation
) {
  const projects =
    getSellerProjects();

  const project =
    projects.find(
      (item) =>
        item.projectId ===
        projectId
    );

  if (!project) {
    return;
  }

  project.calculation =
    calculation;

  project.calculatedCredits =
    calculation.calculatedCredits;

  project.status =
    "calculated";

  project.updatedAt =
    new Date().toISOString();

  saveSellerProjects(projects);
}

/* =========================================================
   SAVE PROJECT
========================================================= */

function saveSellerProject(project) {
  const projects =
    getSellerProjects();

  const duplicateProject =
    projects.some(
      (item) =>
        item.producerRefId
          .toLowerCase() ===
        project.producerRefId
          .toLowerCase()
    );

  if (duplicateProject) {
    const index =
      projects.findIndex(
        (item) =>
          item.producerRefId
            .toLowerCase() ===
          project.producerRefId
            .toLowerCase()
      );

    projects[index] = {
      ...projects[index],
      ...project,
      projectId:
        projects[index].projectId
    };
  } else {
    projects.unshift(project);
  }

  saveSellerProjects(projects);
}

/* =========================================================
   PROJECT STORAGE
========================================================= */

function getSellerProjects() {
  return readSellerStorage(
    SELLER_PROJECTS_KEY
  );
}

function saveSellerProjects(projects) {
  writeSellerStorage(
    SELLER_PROJECTS_KEY,
    projects
  );
}

/* =========================================================
   RENDER PROJECTS
========================================================= */

function renderSellerProjects() {
  const tableBody =
    document.getElementById(
      "projectTableBody"
    );

  const projectSelect =
    document.getElementById(
      "calculationProject"
    );

  const auditProjectSelect =
    document.getElementById(
      "auditProject"
    );

  const projects =
    getSellerProjects();

  if (tableBody) {
    tableBody.innerHTML = "";

    if (!projects.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            No projects submitted yet.
          </td>
        </tr>
      `;
    } else {
      projects.forEach((project) => {
        const row =
          document.createElement("tr");

        row.innerHTML = `
          <td>
            ${escapeSellerHTML(
              project.producerRefId
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              project.projectName
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              formatSellerProjectType(
                project.producerType
              )
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              project.state
            )}
          </td>

          <td>
            ${formatSellerNumber(
              project.energyGeneratedKwh
            )} kWh
          </td>

          <td>
            ${formatSellerNumber(
              project.calculatedCredits ||
                0
            )}
          </td>

          <td>
            <span class="pill">
              ${escapeSellerHTML(
                formatSellerStatus(
                  project.status
                )
              )}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="btn ghost"
              data-view-project="${escapeSellerHTML(
                project.projectId
              )}"
            >
              View
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    }
  }

  populateProjectSelect(
    projectSelect,
    projects
  );

  populateProjectSelect(
    auditProjectSelect,
    projects
  );
}

/* =========================================================
   POPULATE PROJECT SELECT
========================================================= */

function populateProjectSelect(
  selectElement,
  projects
) {
  if (!selectElement) {
    return;
  }

  const currentValue =
    selectElement.value;

  selectElement.innerHTML = `
    <option value="">
      Select a project
    </option>
  `;

  projects.forEach((project) => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      project.projectId;

    option.textContent =
      `${project.projectName} (${project.producerRefId})`;

    selectElement.appendChild(
      option
    );
  });

  if (
    projects.some(
      (project) =>
        project.projectId ===
        currentValue
    )
  ) {
    selectElement.value =
      currentValue;
  }
}

/* =========================================================
   VIEW PROJECT ACTION
========================================================= */

function initializeSellerTableActions() {
  document.addEventListener(
    "click",
    (event) => {
      const viewProjectButton =
        event.target.closest(
          "[data-view-project]"
        );

      if (viewProjectButton) {
        showSellerProjectDetails(
          viewProjectButton.dataset
            .viewProject
        );

        return;
      }

      const submitAuditButton =
        event.target.closest(
          "[data-submit-audit]"
        );

      if (submitAuditButton) {
        submitProjectForAudit(
          submitAuditButton.dataset
            .submitAudit
        );

        return;
      }

      const approveAuditButton =
        event.target.closest(
          "[data-approve-audit]"
        );

      if (approveAuditButton) {
        approveProjectAudit(
          approveAuditButton.dataset
            .approveAudit
        );

        return;
      }

      const approveCctsButton =
        event.target.closest(
          "[data-approve-ccts]"
        );

      if (approveCctsButton) {
        approveProjectCCTS(
          approveCctsButton.dataset
            .approveCcts
        );

        return;
      }

      const listCreditButton =
        event.target.closest(
          "[data-list-credit]"
        );

      if (listCreditButton) {
        openListingModal(
          listCreditButton.dataset
            .listCredit
        );

        return;
      }

      const removeListingButton =
        event.target.closest(
          "[data-remove-listing]"
        );

      if (removeListingButton) {
        removeSellerListing(
          removeListingButton.dataset
            .removeListing
        );
      }
    }
  );
}

/* =========================================================
   PROJECT DETAIL PREVIEW
========================================================= */

function showSellerProjectDetails(
  projectId
) {
  const project =
    getSellerProjects().find(
      (item) =>
        item.projectId ===
        projectId
    );

  if (!project) {
    showSellerNotification(
      "Project could not be found.",
      "error"
    );

    return;
  }

  setSellerText(
    "projectDetailName",
    project.projectName
  );

  setSellerText(
    "projectDetailReference",
    project.producerRefId
  );

  setSellerText(
    "projectDetailProducer",
    project.producerName
  );

  setSellerText(
    "projectDetailType",
    formatSellerProjectType(
      project.producerType
    )
  );

  setSellerText(
    "projectDetailLocation",
    `${project.location}, ${project.state}`
  );

  setSellerText(
    "projectDetailCapacity",
    `${formatSellerNumber(
      project.capacityKw
    )} kW`
  );

  setSellerText(
    "projectDetailEnergy",
    `${formatSellerNumber(
      project.energyGeneratedKwh
    )} kWh`
  );

  setSellerText(
    "projectDetailPeriod",
    project.period
  );

  setSellerText(
    "projectDetailCredits",
    formatSellerNumber(
      project.calculatedCredits ||
        0
    )
  );

  setSellerText(
    "projectDetailStatus",
    formatSellerStatus(
      project.status
    )
  );

  const modal =
    document.getElementById(
      "projectDetailModal"
    );

  if (modal) {
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
}

/* =========================================================
   AUDIT ACTIONS
========================================================= */

function initializeAuditActions() {
  const auditForm =
    document.getElementById(
      "auditSubmissionForm"
    );

  if (auditForm) {
    auditForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        const projectId =
          document.getElementById(
            "auditProject"
          )?.value;

        if (!projectId) {
          showSellerNotification(
            "Please select a project for audit.",
            "error"
          );

          return;
        }

        submitProjectForAudit(
          projectId
        );

        auditForm.reset();
      }
    );
  }
}

/* =========================================================
   SUBMIT FOR AUDIT
========================================================= */

function submitProjectForAudit(
  projectId
) {
  const projects =
    getSellerProjects();

  const project =
    projects.find(
      (item) =>
        item.projectId ===
        projectId
    );

  if (!project) {
    showSellerNotification(
      "Project could not be found.",
      "error"
    );

    return;
  }

  if (
    !project.calculation ||
    !project.calculatedCredits
  ) {
    showSellerNotification(
      "Calculate carbon credits before submitting for audit.",
      "error"
    );

    return;
  }

  project.auditStatus =
    "submitted";

  project.status =
    "audit-submitted";

  project.auditSubmittedAt =
    new Date().toISOString();

  saveSellerProjects(projects);

  saveSellerAuditRecord({
    auditId:
      generateAuditId(),

    projectId:
      project.projectId,

    projectName:
      project.projectName,

    stage:
      "manual-audit",

    status:
      "submitted",

    note:
      "Project documents submitted for independent manual audit.",

    createdAt:
      new Date().toISOString()
  });

  renderSellerProjects();
  renderSellerAuditRecords();
  updateSellerDashboardMetrics();

  showSellerNotification(
    "Project submitted for manual audit.",
    "success"
  );

  openSellerSection(
    "auditSection"
  );
}

/* =========================================================
   APPROVE MANUAL AUDIT
========================================================= */

function approveProjectAudit(
  projectId
) {
  const projects =
    getSellerProjects();

  const project =
    projects.find(
      (item) =>
        item.projectId ===
        projectId
    );

  if (!project) {
    return;
  }

  project.auditStatus =
    "approved";

  project.status =
    "audit-approved";

  project.auditApprovedAt =
    new Date().toISOString();

  saveSellerProjects(projects);

  saveSellerAuditRecord({
    auditId:
      generateAuditId(),

    projectId:
      project.projectId,

    projectName:
      project.projectName,

    stage:
      "manual-audit",

    status:
      "approved",

    note:
      "Manual auditor verified the project and calculation.",

    createdAt:
      new Date().toISOString()
  });

  renderSellerProjects();
  renderSellerAuditRecords();
  updateSellerDashboardMetrics();

  showSellerNotification(
    "Manual audit approved.",
    "success"
  );
}

/* =========================================================
   APPROVE CCTS
========================================================= */

function approveProjectCCTS(
  projectId
) {
  const projects =
    getSellerProjects();

  const project =
    projects.find(
      (item) =>
        item.projectId ===
        projectId
    );

  if (!project) {
    return;
  }

  if (
    project.auditStatus !==
    "approved"
  ) {
    showSellerNotification(
      "Manual audit approval is required before CCTS approval.",
      "error"
    );

    return;
  }

  project.cctsStatus =
    "approved";

  project.status =
    "ccts-approved";

  project.cctsApprovedAt =
    new Date().toISOString();

  saveSellerProjects(projects);

  createSellerCreditFromProject(
    project
  );

  saveSellerAuditRecord({
    auditId:
      generateAuditId(),

    projectId:
      project.projectId,

    projectName:
      project.projectName,

    stage:
      "ccts-approval",

    status:
      "approved",

    note:
      "Carbon credits approved and issued under the CCTS workflow.",

    createdAt:
      new Date().toISOString()
  });

  renderSellerProjects();
  renderSellerAuditRecords();
  renderSellerCredits();
  updateSellerDashboardMetrics();

  showSellerNotification(
    "CCTS approval completed and credits issued.",
    "success"
  );
}

/* =========================================================
   AUDIT STORAGE
========================================================= */

function getSellerAuditRecords() {
  return readSellerStorage(
    SELLER_AUDIT_KEY
  );
}

function saveSellerAuditRecord(
  record
) {
  const records =
    getSellerAuditRecords();

  records.unshift(record);

  writeSellerStorage(
    SELLER_AUDIT_KEY,
    records
  );
}

/* =========================================================
   RENDER AUDIT RECORDS
========================================================= */

function renderSellerAuditRecords() {
  const container =
    document.getElementById(
      "auditList"
    );

  if (!container) {
    return;
  }

  const projects =
    getSellerProjects();

  container.innerHTML = "";

  if (!projects.length) {
    container.innerHTML = `
      <div class="panel">
        <h3>No audit records</h3>
        <p>
          Add and calculate a project before starting
          the verification workflow.
        </p>
      </div>
    `;

    return;
  }

  projects.forEach((project) => {
    const article =
      document.createElement(
        "article"
      );

    const statusClass =
      getAuditStatusClass(
        project
      );

    article.className =
      statusClass;

    const actionButton =
      getAuditActionButton(
        project
      );

    article.innerHTML = `
      <b>
        ${getAuditStepNumber(
          project
        )}
      </b>

      <div>
        <h3>
          ${escapeSellerHTML(
            project.projectName
          )}
        </h3>

        <p>
          IES Ref:
          ${escapeSellerHTML(
            project.producerRefId
          )}
          •
          ${formatSellerNumber(
            project.calculatedCredits ||
              0
          )}
          calculated credits
        </p>
      </div>

      <span>
        ${escapeSellerHTML(
          getAuditStatusText(
            project
          )
        )}
      </span>

      ${actionButton}
    `;

    container.appendChild(
      article
    );
  });
}

/* =========================================================
   AUDIT STATUS HELPERS
========================================================= */

function getAuditStatusClass(
  project
) {
  if (
    project.cctsStatus ===
    "approved"
  ) {
    return "done";
  }

  if (
    project.auditStatus ===
    "approved"
  ) {
    return "current";
  }

  if (
    project.auditStatus ===
    "submitted"
  ) {
    return "current";
  }

  return "";
}

function getAuditStatusText(
  project
) {
  if (
    project.cctsStatus ===
    "approved"
  ) {
    return "CCTS Approved";
  }

  if (
    project.auditStatus ===
    "approved"
  ) {
    return "Audit Approved";
  }

  if (
    project.auditStatus ===
    "submitted"
  ) {
    return "Audit In Review";
  }

  if (
    project.calculatedCredits
  ) {
    return "Ready for Audit";
  }

  return "Calculation Pending";
}

function getAuditStepNumber(
  project
) {
  if (
    project.cctsStatus ===
    "approved"
  ) {
    return "✓";
  }

  if (
    project.auditStatus ===
    "approved"
  ) {
    return "3";
  }

  if (
    project.auditStatus ===
    "submitted"
  ) {
    return "2";
  }

  return "1";
}

function getAuditActionButton(
  project
) {
  if (
    project.cctsStatus ===
    "approved"
  ) {
    return `
      <button
        type="button"
        class="btn ghost"
        disabled
      >
        Credits Issued
      </button>
    `;
  }

  if (
    project.auditStatus ===
    "approved"
  ) {
    return `
      <button
        type="button"
        class="btn primary"
        data-approve-ccts="${escapeSellerHTML(
          project.projectId
        )}"
      >
        Approve CCTS
      </button>
    `;
  }

  if (
    project.auditStatus ===
    "submitted"
  ) {
    return `
      <button
        type="button"
        class="btn primary"
        data-approve-audit="${escapeSellerHTML(
          project.projectId
        )}"
      >
        Approve Audit
      </button>
    `;
  }

  if (
    project.calculatedCredits
  ) {
    return `
      <button
        type="button"
        class="btn primary"
        data-submit-audit="${escapeSellerHTML(
          project.projectId
        )}"
      >
        Submit Audit
      </button>
    `;
  }

  return `
    <button
      type="button"
      class="btn ghost"
      disabled
    >
      Calculate First
    </button>
  `;
}

/* =========================================================
   CREATE CREDIT FROM APPROVED PROJECT
========================================================= */

function createSellerCreditFromProject(
  project
) {
  const credits =
    getSellerCredits();

  const existingCredit =
    credits.find(
      (credit) =>
        credit.projectId ===
        project.projectId
    );

  if (existingCredit) {
    return;
  }

  const issuedCredits =
    Number(
      project.calculatedCredits
    ) || 0;

  credits.unshift({
    creditId:
      generateSellerCreditId(),

    projectId:
      project.projectId,

    producerRefId:
      project.producerRefId,

    projectName:
      project.projectName,

    producerName:
      project.producerName,

    projectType:
      project.producerType,

    location:
      `${project.location}, ${project.state}`,

    vintage:
      extractVintage(
        project.period
      ),

    certification:
      "CCTS Approved",

    totalCredits:
      issuedCredits,

    availableCredits:
      issuedCredits,

    listedCredits: 0,

    soldCredits: 0,

    retiredCredits: 0,

    pricePerCredit: 0,

    status:
      "issued",

    certificateId:
      generateSellerCertificateId(),

    issuedAt:
      new Date().toISOString()
  });

  saveSellerCredits(credits);
}

/* =========================================================
   CREDIT STORAGE
========================================================= */

function getSellerCredits() {
  return readSellerStorage(
    SELLER_CREDITS_KEY
  );
}

function saveSellerCredits(
  credits
) {
  writeSellerStorage(
    SELLER_CREDITS_KEY,
    credits
  );
}

/* =========================================================
   RENDER SELLER CREDITS
========================================================= */

function renderSellerCredits() {
  const tableBody =
    document.getElementById(
      "sellerCreditTableBody"
    );

  const creditGrid =
    document.getElementById(
      "sellerCreditGrid"
    );

  const credits =
    getSellerCredits();

  if (tableBody) {
    tableBody.innerHTML = "";

    if (!credits.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9">
            No credits issued yet.
          </td>
        </tr>
      `;
    } else {
      credits.forEach((credit) => {
        const row =
          document.createElement(
            "tr"
          );

        row.innerHTML = `
          <td>
            ${escapeSellerHTML(
              credit.creditId
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              credit.projectName
            )}
          </td>

          <td>
            ${formatSellerNumber(
              credit.totalCredits
            )}
          </td>

          <td>
            ${formatSellerNumber(
              credit.availableCredits
            )}
          </td>

          <td>
            ${formatSellerNumber(
              credit.listedCredits
            )}
          </td>

          <td>
            ${formatSellerNumber(
              credit.soldCredits
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              credit.vintage
            )}
          </td>

          <td>
            <span class="pill">
              ${escapeSellerHTML(
                formatSellerStatus(
                  credit.status
                )
              )}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="btn primary"
              data-list-credit="${escapeSellerHTML(
                credit.creditId
              )}"
              ${
                Number(
                  credit.availableCredits
                ) <= 0
                  ? "disabled"
                  : ""
              }
            >
              List Credits
            </button>
          </td>
        `;

        tableBody.appendChild(
          row
        );
      });
    }
  }

  if (creditGrid) {
    creditGrid.innerHTML = "";

    if (!credits.length) {
      creditGrid.innerHTML = `
        <div class="panel">
          <h3>No issued credits</h3>
          <p>
            Complete audit and CCTS approval to issue credits.
          </p>
        </div>
      `;
    } else {
      credits.forEach((credit) => {
        const card =
          document.createElement(
            "article"
          );

        card.className =
          "listing-preview";

        card.innerHTML = `
          <div class="credit-top">
            <span class="pill">
              ${escapeSellerHTML(
                formatSellerProjectType(
                  credit.projectType
                )
              )}
            </span>

            <small>
              ${escapeSellerHTML(
                credit.creditId
              )}
            </small>
          </div>

          <h3>
            ${escapeSellerHTML(
              credit.projectName
            )}
          </h3>

          <p>
            Verified carbon credits issued after
            manual audit and CCTS approval.
          </p>

          <div class="credit-info">
            <div>
              <span>Total Issued</span>
              <b>
                ${formatSellerNumber(
                  credit.totalCredits
                )}
              </b>
            </div>

            <div>
              <span>Available</span>
              <b>
                ${formatSellerNumber(
                  credit.availableCredits
                )}
              </b>
            </div>

            <div>
              <span>Listed</span>
              <b>
                ${formatSellerNumber(
                  credit.listedCredits
                )}
              </b>
            </div>

            <div>
              <span>Sold</span>
              <b>
                ${formatSellerNumber(
                  credit.soldCredits
                )}
              </b>
            </div>

            <div>
              <span>Vintage</span>
              <b>
                ${escapeSellerHTML(
                  credit.vintage
                )}
              </b>
            </div>

            <div>
              <span>Status</span>
              <b>
                ${escapeSellerHTML(
                  formatSellerStatus(
                    credit.status
                  )
                )}
              </b>
            </div>
          </div>

          <div
            class="barcode"
            title="${escapeSellerHTML(
              credit.certificateId
            )}"
          ></div>

          <button
            type="button"
            class="btn primary"
            data-list-credit="${escapeSellerHTML(
              credit.creditId
            )}"
            ${
              Number(
                credit.availableCredits
              ) <= 0
                ? "disabled"
                : ""
            }
          >
            List on Marketplace
          </button>
        `;

        creditGrid.appendChild(
          card
        );
      });
    }
  }

  populateCreditSelect(
    credits
  );
}

/* =========================================================
   POPULATE CREDIT SELECT
========================================================= */

function populateCreditSelect(
  credits
) {
  const creditSelect =
    document.getElementById(
      "listingCredit"
    );

  if (!creditSelect) {
    return;
  }

  creditSelect.innerHTML = `
    <option value="">
      Select issued credit
    </option>
  `;

  credits
    .filter(
      (credit) =>
        Number(
          credit.availableCredits
        ) > 0
    )
    .forEach((credit) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        credit.creditId;

      option.textContent =
        `${credit.projectName} — ${credit.availableCredits} available`;

      creditSelect.appendChild(
        option
      );
    });
}

/* =========================================================
   LISTING SYSTEM
========================================================= */

function initializeListingSystem() {
  const listingForm =
    document.getElementById(
      "listingForm"
    );

  const listingQuantity =
    document.getElementById(
      "listingQuantity"
    );

  const listingPrice =
    document.getElementById(
      "listingPrice"
    );

  if (listingForm) {
    listingForm.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();

        completeSellerListing();
      }
    );
  }

  if (listingQuantity) {
    listingQuantity.addEventListener(
      "input",
      updateSellerListingPreview
    );
  }

  if (listingPrice) {
    listingPrice.addEventListener(
      "input",
      updateSellerListingPreview
    );
  }

  const listingCredit =
    document.getElementById(
      "listingCredit"
    );

  if (listingCredit) {
    listingCredit.addEventListener(
      "change",
      () => {
        selectedSellerCredit =
          getSellerCredits().find(
            (credit) =>
              credit.creditId ===
              listingCredit.value
          ) || null;

        populateListingCreditData();
        updateSellerListingPreview();
      }
    );
  }

  initializeListingModalControls();
}

/* =========================================================
   OPEN LISTING MODAL
========================================================= */

function openListingModal(
  creditId
) {
  const credit =
    getSellerCredits().find(
      (item) =>
        item.creditId ===
        creditId
    );

  if (!credit) {
    showSellerNotification(
      "Credit record could not be found.",
      "error"
    );

    return;
  }

  if (
    Number(
      credit.availableCredits
    ) <= 0
  ) {
    showSellerNotification(
      "No credits are available for listing.",
      "error"
    );

    return;
  }

  selectedSellerCredit =
    credit;

  const creditSelect =
    document.getElementById(
      "listingCredit"
    );

  if (creditSelect) {
    creditSelect.value =
      credit.creditId;
  }

  populateListingCreditData();
  updateSellerListingPreview();

  const modal =
    document.getElementById(
      "listingModal"
    );

  if (modal) {
    modal.classList.add(
      "active"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";
  } else {
    openSellerSection(
      "listingSection"
    );
  }
}

/* =========================================================
   POPULATE LISTING CREDIT DATA
========================================================= */

function populateListingCreditData() {
  if (!selectedSellerCredit) {
    return;
  }

  setSellerText(
    "listingProjectName",
    selectedSellerCredit.projectName
  );

  setSellerText(
    "listingCreditId",
    selectedSellerCredit.creditId
  );

  setSellerText(
    "listingAvailableCredits",
    `${formatSellerNumber(
      selectedSellerCredit.availableCredits
    )} Credits`
  );

  const quantityInput =
    document.getElementById(
      "listingQuantity"
    );

  if (quantityInput) {
    quantityInput.value = "1";
    quantityInput.min = "1";
    quantityInput.max =
      selectedSellerCredit.availableCredits;
  }

  const priceInput =
    document.getElementById(
      "listingPrice"
    );

  if (
    priceInput &&
    !priceInput.value
  ) {
    priceInput.value = "750";
  }

  clearSellerListingMessage();
}

/* =========================================================
   LISTING PREVIEW
========================================================= */

function updateSellerListingPreview() {
  const quantity =
    Number(
      document.getElementById(
        "listingQuantity"
      )?.value
    ) || 0;

  const price =
    Number(
      document.getElementById(
        "listingPrice"
      )?.value
    ) || 0;

  const totalValue =
    quantity * price;

  setSellerText(
    "previewProjectName",
    selectedSellerCredit
      ?.projectName ||
      "Select a project"
  );

  setSellerText(
    "previewCreditId",
    selectedSellerCredit
      ?.creditId ||
      "KC-CREDIT"
  );

  setSellerText(
    "previewProjectType",
    selectedSellerCredit
      ? formatSellerProjectType(
          selectedSellerCredit
            .projectType
        )
      : "Project Type"
  );

  setSellerText(
    "previewLocation",
    selectedSellerCredit
      ?.location ||
      "Project Location"
  );

  setSellerText(
    "previewQuantity",
    `${formatSellerNumber(
      quantity
    )} Credits`
  );

  setSellerText(
    "previewPrice",
    `₹${formatSellerCurrency(
      price
    )}`
  );

  setSellerText(
    "previewListingValue",
    `₹${formatSellerCurrency(
      totalValue
    )}`
  );
}

/* =========================================================
   COMPLETE LISTING
========================================================= */

function completeSellerListing() {
  if (!selectedSellerCredit) {
    const selectedCreditId =
      document.getElementById(
        "listingCredit"
      )?.value;

    selectedSellerCredit =
      getSellerCredits().find(
        (credit) =>
          credit.creditId ===
          selectedCreditId
      ) || null;
  }

  if (!selectedSellerCredit) {
    showSellerListingMessage(
      "Please select issued credits.",
      "error"
    );

    return;
  }

  const quantity =
    Number(
      document.getElementById(
        "listingQuantity"
      )?.value
    );

  const price =
    Number(
      document.getElementById(
        "listingPrice"
      )?.value
    );

  const available =
    Number(
      selectedSellerCredit
        .availableCredits
    );

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    showSellerListingMessage(
      "Listing quantity must be at least 1 credit.",
      "error"
    );

    return;
  }

  if (
    quantity > available
  ) {
    showSellerListingMessage(
      `Only ${formatSellerNumber(
        available
      )} credits are available.`,
      "error"
    );

    return;
  }

  if (
    !Number.isFinite(price) ||
    price <= 0
  ) {
    showSellerListingMessage(
      "Enter a valid price per credit.",
      "error"
    );

    return;
  }

  const listing = {
    listingId:
      generateListingId(),

    creditId:
      selectedSellerCredit
        .creditId,

    projectId:
      selectedSellerCredit
        .projectId,

    projectName:
      selectedSellerCredit
        .projectName,

    producerName:
      selectedSellerCredit
        .producerName,

    projectType:
      selectedSellerCredit
        .projectType,

    location:
      selectedSellerCredit
        .location,

    vintage:
      selectedSellerCredit
        .vintage,

    certification:
      selectedSellerCredit
        .certification,

    quantity,

    availableQuantity:
      quantity,

    soldQuantity: 0,

    pricePerCredit:
      roundSellerAmount(price),

    listingValue:
      roundSellerAmount(
        quantity * price
      ),

    status: "active",

    listedAt:
      new Date().toISOString()
  };

  const listings =
    getSellerListings();

  listings.unshift(listing);

  saveSellerListings(listings);

  updateCreditAfterListing(
    selectedSellerCredit.creditId,
    quantity,
    price
  );

  saveSellerTransaction({
    transactionId:
      generateSellerTransactionId(),

    type: "listing",

    projectName:
      listing.projectName,

    creditId:
      listing.creditId,

    quantity:
      listing.quantity,

    amount:
      listing.listingValue,

    status:
      "active",

    createdAt:
      listing.listedAt
  });

  renderSellerCredits();
  renderSellerListings();
  renderSellerTransactions();
  updateSellerDashboardMetrics();

  showSellerNotification(
    `${formatSellerNumber(
      quantity
    )} credits listed successfully.`,
    "success"
  );

  closeListingModal();

  openSellerSection(
    "marketplaceSection"
  );
}

/* =========================================================
   UPDATE CREDIT AFTER LISTING
========================================================= */

function updateCreditAfterListing(
  creditId,
  quantity,
  price
) {
  const credits =
    getSellerCredits();

  const credit =
    credits.find(
      (item) =>
        item.creditId ===
        creditId
    );

  if (!credit) {
    return;
  }

  credit.availableCredits =
    Math.max(
      0,
      Number(
        credit.availableCredits
      ) -
        Number(quantity)
    );

  credit.listedCredits =
    Number(
      credit.listedCredits
    ) +
    Number(quantity);

  credit.pricePerCredit =
    Number(price);

  credit.status =
    credit.availableCredits > 0
      ? "partially-listed"
      : "fully-listed";

  saveSellerCredits(credits);
}

/* =========================================================
   LISTING STORAGE
========================================================= */

function getSellerListings() {
  return readSellerStorage(
    SELLER_LISTINGS_KEY
  );
}

function saveSellerListings(
  listings
) {
  writeSellerStorage(
    SELLER_LISTINGS_KEY,
    listings
  );
}

/* =========================================================
   RENDER SELLER LISTINGS
========================================================= */

function renderSellerListings() {
  const grid =
    document.getElementById(
      "sellerListingGrid"
    );

  const tableBody =
    document.getElementById(
      "sellerListingTableBody"
    );

  const listings =
    getSellerListings();

  if (grid) {
    grid.innerHTML = "";

    if (!listings.length) {
      grid.innerHTML = `
        <div class="panel">
          <h3>No marketplace listings</h3>
          <p>
            List issued credits to make them available to buyers.
          </p>
        </div>
      `;
    } else {
      listings.forEach((listing) => {
        const card =
          document.createElement(
            "article"
          );

        card.className =
          "listing-preview";

        card.innerHTML = `
          <div class="credit-top">
            <span class="pill">
              ${escapeSellerHTML(
                formatSellerProjectType(
                  listing.projectType
                )
              )}
            </span>

            <small>
              ${escapeSellerHTML(
                listing.listingId
              )}
            </small>
          </div>

          <h3>
            ${escapeSellerHTML(
              listing.projectName
            )}
          </h3>

          <p>
            ${escapeSellerHTML(
              listing.location
            )}
          </p>

          <div class="credit-info">
            <div>
              <span>Available</span>
              <b>
                ${formatSellerNumber(
                  listing.availableQuantity
                )}
                Credits
              </b>
            </div>

            <div>
              <span>Price</span>
              <b>
                ₹${formatSellerCurrency(
                  listing.pricePerCredit
                )}
              </b>
            </div>

            <div>
              <span>Vintage</span>
              <b>
                ${escapeSellerHTML(
                  listing.vintage
                )}
              </b>
            </div>

            <div>
              <span>Status</span>
              <b>
                ${escapeSellerHTML(
                  formatSellerStatus(
                    listing.status
                  )
                )}
              </b>
            </div>
          </div>

          <div
            class="barcode"
            title="${escapeSellerHTML(
              listing.creditId
            )}"
          ></div>

          <button
            type="button"
            class="btn ghost"
            data-remove-listing="${escapeSellerHTML(
              listing.listingId
            )}"
            ${
              listing.status !==
              "active"
                ? "disabled"
                : ""
            }
          >
            Remove Listing
          </button>
        `;

        grid.appendChild(card);
      });
    }
  }

  if (tableBody) {
    tableBody.innerHTML = "";

    if (!listings.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">
            No active listings available.
          </td>
        </tr>
      `;
    } else {
      listings.forEach((listing) => {
        const row =
          document.createElement(
            "tr"
          );

        row.innerHTML = `
          <td>
            ${escapeSellerHTML(
              listing.listingId
            )}
          </td>

          <td>
            ${escapeSellerHTML(
              listing.projectName
            )}
          </td>

          <td>
            ${formatSellerNumber(
              listing.quantity
            )}
          </td>

          <td>
            ${formatSellerNumber(
              listing.availableQuantity
            )}
          </td>

          <td>
            ₹${formatSellerCurrency(
              listing.pricePerCredit
            )}
          </td>

          <td>
            ₹${formatSellerCurrency(
              listing.listingValue
            )}
          </td>

          <td>
            <span class="pill">
              ${escapeSellerHTML(
                formatSellerStatus(
                  listing.status
                )
              )}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="btn ghost"
              data-remove-listing="${escapeSellerHTML(
                listing.listingId
              )}"
              ${
                listing.status !==
                "active"
                  ? "disabled"
                  : ""
              }
            >
              Remove
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    }
  }
}

/* =========================================================
   REMOVE LISTING
========================================================= */

function removeSellerListing(
  listingId
) {
  const listings =
    getSellerListings();

  const listing =
    listings.find(
      (item) =>
        item.listingId ===
        listingId
    );

  if (
    !listing ||
    listing.status !== "active"
  ) {
    return;
  }

  const remainingQuantity =
    Number(
      listing.availableQuantity
    );

  listing.status =
    "removed";

  listing.removedAt =
    new Date().toISOString();

  const credits =
    getSellerCredits();

  const credit =
    credits.find(
      (item) =>
        item.creditId ===
        listing.creditId
    );

  if (credit) {
    credit.availableCredits =
      Number(
        credit.availableCredits
      ) +
      remainingQuantity;

    credit.listedCredits =
      Math.max(
        0,
        Number(
          credit.listedCredits
        ) -
          remainingQuantity
      );

    credit.status =
      credit.listedCredits > 0
        ? "partially-listed"
        : "issued";

    saveSellerCredits(credits);
  }

  saveSellerListings(listings);

  saveSellerTransaction({
    transactionId:
      generateSellerTransactionId(),

    type:
      "listing-removed",

    projectName:
      listing.projectName,

    creditId:
      listing.creditId,

    quantity:
      remainingQuantity,

    amount: 0,

    status:
      "completed",

    createdAt:
      new Date().toISOString()
  });

  renderSellerCredits();
  renderSellerListings();
  renderSellerTransactions();
  updateSellerDashboardMetrics();

  showSellerNotification(
    "Listing removed and unsold credits returned.",
    "success"
  );
}

/* =========================================================
   LISTING MODAL CONTROLS
========================================================= */

function initializeListingModalControls() {
  const modal =
    document.getElementById(
      "listingModal"
    );

  if (!modal) {
    return;
  }

  modal
    .querySelectorAll(
      "[data-close-listing], .close"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        closeListingModal
      );
    });

  modal.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        closeListingModal();
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
        closeListingModal();
      }
    }
  );
}

function closeListingModal() {
  const modal =
    document.getElementById(
      "listingModal"
    );

  if (modal) {
    modal.classList.remove(
      "active"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  document.body.style.overflow =
    "";

  const listingForm =
    document.getElementById(
      "listingForm"
    );

  if (listingForm) {
    listingForm.reset();
  }

  selectedSellerCredit =
    null;

  clearSellerListingMessage();
}

/* =========================================================
   SELLER TRANSACTIONS
========================================================= */

function getSellerTransactions() {
  return readSellerStorage(
    SELLER_TRANSACTIONS_KEY
  );
}

function saveSellerTransaction(
  transaction
) {
  const transactions =
    getSellerTransactions();

  transactions.unshift(
    transaction
  );

  writeSellerStorage(
    SELLER_TRANSACTIONS_KEY,
    transactions
  );
}

/* =========================================================
   RENDER SELLER TRANSACTIONS
========================================================= */

function renderSellerTransactions() {
  const tableBody =
    document.getElementById(
      "sellerTransactionTableBody"
    );

  const activityList =
    document.getElementById(
      "sellerActivityList"
    );

  const transactions =
    getSellerTransactions();

  if (tableBody) {
    tableBody.innerHTML = "";

    if (!transactions.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            No seller transactions available.
          </td>
        </tr>
      `;
    } else {
      transactions.forEach(
        (transaction) => {
          const row =
            document.createElement(
              "tr"
            );

          row.innerHTML = `
            <td>
              ${escapeSellerHTML(
                transaction.transactionId
              )}
            </td>

            <td>
              ${formatSellerDate(
                transaction.createdAt
              )}
            </td>

            <td>
              ${escapeSellerHTML(
                formatSellerStatus(
                  transaction.type
                )
              )}
            </td>

            <td>
              ${escapeSellerHTML(
                transaction.projectName
              )}
            </td>

            <td>
              ${formatSellerNumber(
                transaction.quantity
              )}
            </td>

            <td>
              ₹${formatSellerCurrency(
                transaction.amount
              )}
            </td>

            <td>
              <span class="pill">
                ${escapeSellerHTML(
                  formatSellerStatus(
                    transaction.status
                  )
                )}
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

  if (activityList) {
    activityList.innerHTML = "";

    const recentTransactions =
      transactions.slice(0, 5);

    if (!recentTransactions.length) {
      activityList.innerHTML = `
        <div>
          <span>Welcome</span>
          <p>
            Your recent seller activity will appear here.
          </p>
          <b>Now</b>
        </div>
      `;
    } else {
      recentTransactions.forEach(
        (transaction) => {
          const item =
            document.createElement(
              "div"
            );

          item.innerHTML = `
            <span>
              ${escapeSellerHTML(
                getSellerActivityLabel(
                  transaction.type
                )
              )}
            </span>

            <p>
              ${formatSellerNumber(
                transaction.quantity
              )}
              credits —
              ${escapeSellerHTML(
                transaction.projectName
              )}
            </p>

            <b>
              ${formatSellerDate(
                transaction.createdAt
              )}
            </b>
          `;

          activityList.appendChild(
            item
          );
        }
      );
    }
  }
}

/* =========================================================
   DASHBOARD METRICS
========================================================= */

function updateSellerDashboardMetrics() {
  const projects =
    getSellerProjects();

  const credits =
    getSellerCredits();

  const listings =
    getSellerListings();

  const transactions =
    getSellerTransactions();

  const totalIssued =
    credits.reduce(
      (total, credit) =>
        total +
        (
          Number(
            credit.totalCredits
          ) || 0
        ),
      0
    );

  const totalAvailable =
    credits.reduce(
      (total, credit) =>
        total +
        (
          Number(
            credit.availableCredits
          ) || 0
        ),
      0
    );

  const totalListed =
    listings
      .filter(
        (listing) =>
          listing.status ===
          "active"
      )
      .reduce(
        (total, listing) =>
          total +
          (
            Number(
              listing.availableQuantity
            ) || 0
          ),
        0
      );

  const totalSold =
    credits.reduce(
      (total, credit) =>
        total +
        (
          Number(
            credit.soldCredits
          ) || 0
        ),
      0
    );

  const earnings =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
          "sale"
      )
      .reduce(
        (total, transaction) =>
          total +
          (
            Number(
              transaction.amount
            ) || 0
          ),
        0
      );

  const approvedProjects =
    projects.filter(
      (project) =>
        project.cctsStatus ===
        "approved"
    ).length;

  setSellerText(
    "dashboardProjectCount",
    formatSellerNumber(
      projects.length
    )
  );

  setSellerText(
    "dashboardIssuedCredits",
    formatSellerNumber(
      totalIssued
    )
  );

  setSellerText(
    "dashboardListedCredits",
    formatSellerNumber(
      totalListed
    )
  );

  setSellerText(
    "dashboardSellerEarnings",
    `₹${formatSellerCurrency(
      earnings
    )}`
  );

  setSellerText(
    "totalProjects",
    formatSellerNumber(
      projects.length
    )
  );

  setSellerText(
    "issuedCredits",
    formatSellerNumber(
      totalIssued
    )
  );

  setSellerText(
    "availableCredits",
    formatSellerNumber(
      totalAvailable
    )
  );

  setSellerText(
    "listedCredits",
    formatSellerNumber(
      totalListed
    )
  );

  setSellerText(
    "soldCredits",
    formatSellerNumber(
      totalSold
    )
  );

  setSellerText(
    "sellerEarnings",
    `₹${formatSellerCurrency(
      earnings
    )}`
  );

  setSellerText(
    "approvedProjectCount",
    formatSellerNumber(
      approvedProjects
    )
  );
}

/* =========================================================
   SELLER PROFILE
========================================================= */

function renderSellerProfile() {
  const user =
    getCurrentSellerUser();

  const sellerName =
    user?.name ||
    "Demo Seller";

  const sellerEmail =
    user?.email ||
    "seller@karboncred.in";

  const sellerRole =
    user?.role ||
    "seller";

  const sellerId =
    user?.id ||
    "DEMO-SELLER";

  setSellerText(
    "profileSellerName",
    sellerName
  );

  setSellerText(
    "profileSellerEmail",
    sellerEmail
  );

  setSellerText(
    "profileSellerRole",
    formatSellerStatus(
      sellerRole
    )
  );

  setSellerText(
    "profileSellerId",
    sellerId
  );

  setSellerText(
    "profileSellerVerification",
    user?.verified === false
      ? "Pending"
      : "Verified"
  );

  document
    .querySelectorAll(
      "[data-seller-initial]"
    )
    .forEach((element) => {
      element.textContent =
        getSellerInitials(
          sellerName
        );
    });
}

/* =========================================================
   CURRENT SELLER USER
========================================================= */

function getCurrentSellerUser() {
  try {
    const storedUser =
      localStorage.getItem(
        "karbonCredCurrentUser"
      );

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error(
      "Unable to read seller profile:",
      error
    );

    return null;
  }
}

/* =========================================================
   FORM MESSAGE
========================================================= */

function showSellerFormMessage(
  message,
  type = "success"
) {
  const element =
    document.getElementById(
      "projectFormMessage"
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

/* =========================================================
   LISTING MESSAGE
========================================================= */

function showSellerListingMessage(
  message,
  type = "success"
) {
  const element =
    document.getElementById(
      "listingMessage"
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

function clearSellerListingMessage() {
  const element =
    document.getElementById(
      "listingMessage"
    );

  if (element) {
    element.textContent = "";
  }
}

/* =========================================================
   SELLER NOTIFICATION
========================================================= */

function showSellerNotification(
  message,
  type = "success"
) {
  let notification =
    document.getElementById(
      "sellerNotification"
    );

  if (!notification) {
    notification =
      document.createElement(
        "div"
      );

    notification.id =
      "sellerNotification";

    notification.style.position =
      "fixed";

    notification.style.top =
      "24px";

    notification.style.right =
      "24px";

    notification.style.zIndex =
      "4000";

    notification.style.maxWidth =
      "360px";

    notification.style.padding =
      "15px 18px";

    notification.style.borderRadius =
      "14px";

    notification.style.fontWeight =
      "850";

    notification.style.boxShadow =
      "0 18px 50px rgba(0,0,0,.35)";

    notification.style.transition =
      "opacity .25s ease, transform .25s ease";

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

  notification.style.opacity =
    "1";

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
   LOCAL STORAGE HELPERS
========================================================= */

function readSellerStorage(key) {
  try {
    const stored =
      localStorage.getItem(key);

    const parsed =
      stored
        ? JSON.parse(stored)
        : [];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error
    );

    return [];
  }
}

function writeSellerStorage(
  key,
  data
) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error
    );
  }
}

/* =========================================================
   FORM VALUE HELPERS
========================================================= */

function getFormValue(
  formData,
  ...names
) {
  for (const name of names) {
    const value =
      formData.get(name);

    if (
      value !== null &&
      String(value).trim()
    ) {
      return String(
        value
      ).trim();
    }
  }

  return "";
}

function getNumericFormValue(
  formData,
  ...names
) {
  return Number(
    getFormValue(
      formData,
      ...names
    )
  ) || 0;
}

function getUploadedFileName(
  form,
  inputName
) {
  const input =
    form.querySelector(
      `[name="${inputName}"]`
    );

  return (
    input?.files?.[0]?.name ||
    ""
  );
}

/* =========================================================
   TEXT SETTER
========================================================= */

function setSellerText(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent =
      value;
  }
}

/* =========================================================
   PROJECT TYPE FORMAT
========================================================= */

function formatSellerProjectType(
  projectType
) {
  const projectTypes = {
    rooftop_solar:
      "Rooftop Solar",

    solar:
      "Solar Energy",

    msme_wind:
      "MSME Wind",

    wind:
      "Wind Energy",

    biomass:
      "Biomass Energy",

    hydro:
      "Hydro Energy",

    efficiency:
      "Energy Efficiency"
  };

  return (
    projectTypes[
      projectType
    ] ||
    formatSellerStatus(
      projectType
    )
  );
}

/* =========================================================
   GENERAL STATUS FORMAT
========================================================= */

function formatSellerStatus(
  value
) {
  if (!value) {
    return "Not Available";
  }

  return String(value)
    .split(/[\s_-]+/)
    .map(
      (word) =>
        word.charAt(0)
          .toUpperCase() +
        word.slice(1)
          .toLowerCase()
    )
    .join(" ");
}

/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatSellerNumber(
  value
) {
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
      maximumFractionDigits: 2
    }
  );
}

/* =========================================================
   DECIMAL FORMAT
========================================================= */

function formatSellerDecimal(
  value
) {
  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return "0.00";
  }

  return numericValue.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatSellerCurrency(
  value
) {
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
   DATE FORMAT
========================================================= */

function formatSellerDate(
  dateValue
) {
  if (!dateValue) {
    return "Not Available";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not Available";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

/* =========================================================
   ROUND AMOUNT
========================================================= */

function roundSellerAmount(
  value
) {
  return Math.round(
    (
      Number(value) +
      Number.EPSILON
    ) *
      100
  ) / 100;
}

/* =========================================================
   EXTRACT VINTAGE
========================================================= */

function extractVintage(
  period
) {
  const yearMatch =
    String(period).match(
      /\b(20\d{2})\b/
    );

  return yearMatch
    ? yearMatch[1]
    : String(
        new Date().getFullYear()
      );
}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeSellerHTML(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}

/* =========================================================
   INITIALS
========================================================= */

function getSellerInitials(
  name
) {
  if (!name) {
    return "KS";
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
   ACTIVITY LABEL
========================================================= */

function getSellerActivityLabel(
  type
) {
  const labels = {
    listing:
      "Listed",

    sale:
      "Sold",

    "listing-removed":
      "Removed",

    issuance:
      "Issued"
  };

  return (
    labels[type] ||
    formatSellerStatus(type)
  );
}

/* =========================================================
   ID GENERATORS
========================================================= */

function generateSellerProjectId() {
  return createSellerId(
    "PROJ"
  );
}

function generateCalculationId() {
  return createSellerId(
    "CALC"
  );
}

function generateAuditId() {
  return createSellerId(
    "AUDIT"
  );
}

function generateSellerCreditId() {
  return createSellerId(
    "KC"
  );
}

function generateSellerCertificateId() {
  return createSellerId(
    "CERT"
  );
}

function generateListingId() {
  return createSellerId(
    "LIST"
  );
}

function generateSellerTransactionId() {
  return createSellerId(
    "TXN"
  );
}

function createSellerId(prefix) {
  return (
    prefix +
    "-" +
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
//populateDashboardProjectSelector();
//renderDashboardProjectStatusTable();

const selectedProject =
  document.getElementById(
    "dashboardProjectSelector"
  )?.value;

if (selectedProject) {
  //renderSelectedProjectProcess(
  //  selectedProject
  //);
}
