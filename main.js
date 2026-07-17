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

    showMessage(
      messageElement,
      "Account created successfully. Redirecting...",
      "success"
    );

    setTimeout(() => {
      redirectUserByRole(role);
    }, 900);
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

    showMessage(
      messageElement,
      "Login successful. Redirecting...",
      "success"
    );

    setTimeout(() => {
      redirectUserByRole(matchedUser.role);
    }, 700);
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