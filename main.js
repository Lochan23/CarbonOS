/* =========================================================
   KARBONCRED COMMON JAVASCRIPT
   File: js/main.js

   Used for:
   - Login / Signup tabs
   - Buyer / Seller role selection
   - Demo account storage
   - Login redirection
   - Logout
   - Common user information
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeThemeToggle();
  syncAuthenticatedUserTheme();
  initializeAuthTabs();
  initializeRoleSelection();
  initializeSignupForm();
  initializeLoginForm();
  initializeLogoutButtons();
  displayLoggedInUser();
});

/* =========================================================
   AUTH PAGE TABS
========================================================= */

function initializeAuthTabs() {
  const tabButtons = document.querySelectorAll(".tab");
  const authPanels = document.querySelectorAll(".auth-panel");

  if (!tabButtons.length || !authPanels.length) {
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetPanelId = button.dataset.target;

      tabButtons.forEach((tab) => {
        tab.classList.remove("active");
      });

      authPanels.forEach((panel) => {
        panel.classList.remove("active");
      });

      button.classList.add("active");

      const targetPanel = document.getElementById(targetPanelId);

      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
}

/* =========================================================
   ROLE SELECTION
========================================================= */

function initializeRoleSelection() {
  const roleCards = document.querySelectorAll(".role");

  if (!roleCards.length) {
    return;
  }

  roleCards.forEach((card) => {
    card.addEventListener("click", () => {
      const radioButton = card.querySelector(
        'input[type="radio"]'
      );

      const roleGroupName = radioButton
        ? radioButton.name
        : null;

      roleCards.forEach((roleCard) => {
        const currentRadio =
          roleCard.querySelector('input[type="radio"]');

        if (
          !roleGroupName ||
          !currentRadio ||
          currentRadio.name === roleGroupName
        ) {
          roleCard.classList.remove("selected");
        }
      });

      card.classList.add("selected");

      if (radioButton) {
        radioButton.checked = true;
      }
    });
  });
}

/* =========================================================
   SIGNUP
========================================================= */

function initializeSignupForm() {
  const signupForm =
    document.getElementById("signupForm");

  if (!signupForm) {
    return;
  }

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput =
      signupForm.querySelector(
        '[name="name"], #signupName'
      );

    const emailInput =
      signupForm.querySelector(
        '[name="email"], #signupEmail'
      );

    const passwordInput =
      signupForm.querySelector(
        '[name="password"], #signupPassword'
      );

    const confirmPasswordInput =
      signupForm.querySelector(
        '[name="confirmPassword"], #confirmPassword'
      );

    const selectedRole =
      signupForm.querySelector(
        'input[name="signupRole"]:checked'
      ) ||
      signupForm.querySelector(
        'input[name="role"]:checked'
      );

    const messageElement =
      signupForm.querySelector(".msg") ||
      document.getElementById("signupMessage");

    const name =
      nameInput?.value.trim() || "";

    const email =
      emailInput?.value.trim().toLowerCase() || "";

    const password =
      passwordInput?.value || "";

    const confirmPassword =
      confirmPasswordInput?.value || "";

    const role =
      selectedRole?.value || "";

    clearMessage(messageElement);

    if (!name || !email || !password || !role) {
      showMessage(
        messageElement,
        "Please fill all required fields.",
        "error"
      );

      return;
    }

    if (!isValidEmail(email)) {
      showMessage(
        messageElement,
        "Please enter a valid email address.",
        "error"
      );

      return;
    }

    if (password.length < 6) {
      showMessage(
        messageElement,
        "Password must contain at least 6 characters.",
        "error"
      );

      return;
    }

    if (
      confirmPasswordInput &&
      password !== confirmPassword
    ) {
      showMessage(
        messageElement,
        "Passwords do not match.",
        "error"
      );

      return;
    }

    const existingUsers = getUsers();

    const accountAlreadyExists =
      existingUsers.some(
        (user) => user.email === email
      );

    if (accountAlreadyExists) {
      showMessage(
        messageElement,
        "An account with this email already exists.",
        "error"
      );

      return;
    }

    const newUser = {
      id: generateUserId(),
      name,
      email,
      password,
      role,
      verified: true,
      createdAt:
        new Date().toISOString()
    };

    existingUsers.push(newUser);

    saveUsers(existingUsers);
    saveCurrentUser(newUser);

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    supabaseMock.updateThemePreference(newUser.id, currentTheme).then(() => {
      showMessage(
        messageElement,
        "Account created successfully. Redirecting...",
        "success"
      );

      setTimeout(() => {
        redirectUserByRole(role);
      }, 900);
    });
  });
}

/* =========================================================
   LOGIN
========================================================= */

function initializeLoginForm() {
  const loginForm =
    document.getElementById("loginForm");

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput =
      loginForm.querySelector(
        '[name="email"], #loginEmail'
      );

    const passwordInput =
      loginForm.querySelector(
        '[name="password"], #loginPassword'
      );

    const selectedRole =
      loginForm.querySelector(
        'input[name="loginRole"]:checked'
      ) ||
      loginForm.querySelector(
        'input[name="role"]:checked'
      );

    const messageElement =
      loginForm.querySelector(".msg") ||
      document.getElementById("loginMessage");

    const email =
      emailInput?.value.trim().toLowerCase() || "";

    const password =
      passwordInput?.value || "";

    const selectedRoleValue =
      selectedRole?.value || "";

    clearMessage(messageElement);

    if (!email || !password) {
      showMessage(
        messageElement,
        "Please enter your email and password.",
        "error"
      );

      return;
    }

    if (!isValidEmail(email)) {
      showMessage(
        messageElement,
        "Please enter a valid email address.",
        "error"
      );

      return;
    }

    const users = getUsers();

    const matchedUser =
      users.find(
        (user) =>
          user.email === email &&
          user.password === password
      );

    if (!matchedUser) {
      showMessage(
        messageElement,
        "Incorrect email or password.",
        "error"
      );

      return;
    }

    if (
      selectedRoleValue &&
      matchedUser.role !== selectedRoleValue
    ) {
      showMessage(
        messageElement,
        `This account is registered as a ${capitalizeWord(
          matchedUser.role
        )}.`,
        "error"
      );

      return;
    }

    saveCurrentUser(matchedUser);

    supabaseMock.getThemePreference(matchedUser.id).then(theme => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('carbonOS_theme', theme);
      
      showMessage(
        messageElement,
        "Login successful. Redirecting...",
        "success"
      );

      setTimeout(() => {
        redirectUserByRole(matchedUser.role);
      }, 700);
    });
  });
}

/* =========================================================
   LOGOUT
========================================================= */

function initializeLogoutButtons() {
  const logoutButtons =
    document.querySelectorAll(
      ".logout, [data-logout]"
    );

  if (!logoutButtons.length) {
    return;
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem(
        "karbonCredCurrentUser"
      );

      window.location.href =
        "auth.html";
    });
  });
}

/* =========================================================
   DISPLAY CURRENT USER
========================================================= */

function displayLoggedInUser() {
  const currentUser =
    getCurrentUser();

  if (!currentUser) {
    return;
  }

  const userNameElements =
    document.querySelectorAll(
      "[data-user-name]"
    );

  const userEmailElements =
    document.querySelectorAll(
      "[data-user-email]"
    );

  const userRoleElements =
    document.querySelectorAll(
      "[data-user-role]"
    );

  const userInitialElements =
    document.querySelectorAll(
      "[data-user-initial]"
    );

  userNameElements.forEach((element) => {
    element.textContent =
      currentUser.name;
  });

  userEmailElements.forEach((element) => {
    element.textContent =
      currentUser.email;
  });

  userRoleElements.forEach((element) => {
    element.textContent =
      capitalizeWord(currentUser.role);
  });

  userInitialElements.forEach((element) => {
    element.textContent =
      getInitials(currentUser.name);
  });
}

/* =========================================================
   LOCAL STORAGE FUNCTIONS
========================================================= */

function getUsers() {
  try {
    const storedUsers =
      localStorage.getItem(
        "karbonCredUsers"
      );

    return storedUsers
      ? JSON.parse(storedUsers)
      : [];
  } catch (error) {
    console.error(
      "Unable to read users:",
      error
    );

    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(
    "karbonCredUsers",
    JSON.stringify(users)
  );
}

function getCurrentUser() {
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
      "Unable to read current user:",
      error
    );

    return null;
  }
}

function saveCurrentUser(user) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    verified:
      user.verified ?? true,
    createdAt:
      user.createdAt
  };

  localStorage.setItem(
    "karbonCredCurrentUser",
    JSON.stringify(safeUser)
  );
}

/* =========================================================
   REDIRECTION
========================================================= */

function redirectUserByRole(role) {
  const normalizedRole =
    String(role).toLowerCase();

  if (normalizedRole === "buyer") {
    window.location.href =
      "buyer.html";

    return;
  }

  if (normalizedRole === "seller") {
    window.location.href =
      "seller.html";

    return;
  }

  window.location.href =
    "index.html";
}

/* =========================================================
   COMMON VALIDATION
========================================================= */

function isValidEmail(email) {
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
}

/* =========================================================
   MESSAGE FUNCTIONS
========================================================= */

function showMessage(
  element,
  message,
  type = "success"
) {
  if (!element) {
    return;
  }

  element.textContent = message;

  if (type === "error") {
    element.style.color =
      "var(--danger)";
  } else {
    element.style.color =
      "var(--primary)";
  }
}

function clearMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
}

/* =========================================================
   GENERAL HELPER FUNCTIONS
========================================================= */

function generateUserId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    "KC-" +
    Date.now() +
    "-" +
    Math.floor(
      Math.random() * 100000
    )
  );
}

function getInitials(name) {
  if (!name) {
    return "KC";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function capitalizeWord(word) {
  if (!word) {
    return "";
  }

  return (
    word.charAt(0).toUpperCase() +
    word.slice(1).toLowerCase()
  );
}

/* =========================================================
   MOCK SUPABASE DB WRAPPER & THEME HANDLERS
   ========================================================= */
const supabaseMock = {
  async updateThemePreference(userId, theme) {
    console.log(`[Supabase] Asynchronously syncing theme preference "${theme}" for user ID: ${userId} via atomic update...`);
    try {
      const users = JSON.parse(localStorage.getItem("karbonCredUsers")) || [];
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].theme_preference = theme;
        localStorage.setItem("karbonCredUsers", JSON.stringify(users));
      }
      
      const currentUser = JSON.parse(localStorage.getItem("karbonCredCurrentUser"));
      if (currentUser && currentUser.id === userId) {
        currentUser.theme_preference = theme;
        localStorage.setItem("karbonCredCurrentUser", JSON.stringify(currentUser));
      }
    } catch (e) {
      console.error("[Supabase Mock] Error syncing theme preference:", e);
    }
    return { success: true };
  },

  async getThemePreference(userId) {
    console.log(`[Supabase] Fetching theme preference for user ID: ${userId}...`);
    try {
      const users = JSON.parse(localStorage.getItem("karbonCredUsers")) || [];
      const user = users.find(u => u.id === userId);
      return user ? user.theme_preference || 'dark' : 'dark';
    } catch (e) {
      console.error("[Supabase Mock] Error fetching theme preference:", e);
      return 'dark';
    }
  }
};

function initializeThemeToggle() {
  const themeToggleBtn = document.getElementById("themeToggle");
  if (!themeToggleBtn) {
    return;
  }

  themeToggleBtn.addEventListener("click", async () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Apply layout change instantly
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('carbonOS_theme', newTheme);
    console.log(`[Theme] Local storage updated: carbonOS_theme = ${newTheme}`);

    // Sync theme choice to Supabase asynchronously if authenticated
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id) {
      try {
        await supabaseMock.updateThemePreference(currentUser.id, newTheme);
      } catch (err) {
        console.error("[Theme] Failed to update preference in Supabase:", err);
      }
    }
  });
}

function syncAuthenticatedUserTheme() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id) {
    supabaseMock.getThemePreference(currentUser.id).then(savedTheme => {
      const currentLocalTheme = localStorage.getItem('carbonOS_theme') || 'dark';
      if (savedTheme !== currentLocalTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        localStorage.setItem('carbonOS_theme', savedTheme);
        console.log(`[Theme] Aligned theme with Supabase: ${savedTheme}`);
      }
    });
  }
}