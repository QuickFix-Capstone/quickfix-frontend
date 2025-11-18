
const USERS_KEY = "quickfix_users";
const CURRENT_USER_KEY = "quickfix_currentUser";
const RESET_EMAIL_KEY = "quickfix_resetEmail";

export function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function logoutUser() {
  setCurrentUser(null);
}

export function registerUser({ name, email, password, role, extra = {} }) {
  const users = getAllUsers();
  const exists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.role === role
  );

  if (exists) {
    throw new Error("An account with this email already exists for this role.");
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role, // "customer" | "provider"
    ...extra,
  };

  users.push(newUser);
  saveAllUsers(users);
  setCurrentUser(newUser);
  return newUser;
}

export function loginUser(email, password, role) {
  const users = getAllUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password &&
      u.role === role
  );

  if (!user) {
    throw new Error("Invalid email, password, or role.");
  }

  setCurrentUser(user);
  return user;
}

// ---- RESET PASSWORD (demo, no real email) ----

export function requestPasswordReset(email) {
  const users = getAllUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (!user) {
    return false;
  }

  localStorage.setItem(RESET_EMAIL_KEY, email.toLowerCase());
  return true;
}

export function getResetEmail() {
  return localStorage.getItem(RESET_EMAIL_KEY);
}

export function resetPassword(newPassword) {
  const email = getResetEmail();
  if (!email) {
    throw new Error("No reset request in progress.");
  }

  const users = getAllUsers();
  const idx = users.findIndex(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) {
    throw new Error("User not found.");
  }

  const updated = { ...users[idx], password: newPassword };
  users[idx] = updated;
  saveAllUsers(users);
  localStorage.removeItem(RESET_EMAIL_KEY);
  return updated;
}
