const API = "http://localhost:3000/api";
const toast = document.getElementById("toast");

function populateBirthFields() {
  const daySelect = document.getElementById("birthDay");
  const monthSelect = document.getElementById("birthMonth");
  const yearSelect = document.getElementById("birthYear");

  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    daySelect.appendChild(opt);
  }

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  months.forEach((month, i) => {
    const opt = document.createElement("option");
    opt.value = i + 1;
    opt.textContent = month;
    monthSelect.appendChild(opt);
  });

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const daySelect = document.getElementById("birthDay");
  const monthSelect = document.getElementById("birthMonth");
  const yearSelect = document.getElementById("birthYear");
  if (daySelect && monthSelect && yearSelect) {
    populateBirthFields();
    const form = document.getElementById("reg-form");
    if (form) {
      form.addEventListener("submit", register);
    }
  }
});

async function register(e) {
  e.preventDefault();
  const form = document.getElementById("reg-form");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) {
    return showToast("Username and password required", "error");
  }
  try {
    const res = await fetch(`${API}/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        username,
        email: document.getElementById("email").value.trim(),
        password,
        birthDate: {
          day: document.getElementById("birthDay").value,
          month: document.getElementById("birthMonth").value,
          year: document.getElementById("birthYear").value,
        },
        gender: document.querySelector('input[name="gender"]:checked')?.value,
      }),
    });
    const data = await res.json();
    if (data.error) {
      if (typeof data.error === 'string' && data.error.includes('duplicate key')) {
        return showToast("Username or email already exists. Please choose another.", "error");
      }
      return showToast("Error: " + data.error, "error");
    }
    showToast("Registered successfully as: " + data.username, "success");
    form.reset();
    window.location.href = "../login/login.html";
  } catch (err) {
    showToast("Request failed: " + err.message, "error");
  }
}

async function login(event) {
  if (event) event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return showToast("Username and password required", "error");
  const res = await fetch(`${API}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: 'include'
  });
  const data = await res.json();
  if (data.error || data.success === false) {
    showToast("Invalid email or password", "error");
    return;
  }
  sessionStorage.setItem('userEmail', email);
  showToast("Welcome, " + (data.user?.username || email), "success");
  window.location.href = "../home/home.html";
}

async function logout() {
  try {
    await fetch(`${API}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
  }
  sessionStorage.removeItem('userEmail');
  showToast("Logged out", "success");
  window.location.href = "../login/login.html";
}

function showToast(message, type = "info", duration = 3000) {
  toast.textContent = message;
  toast.style.backgroundColor =
    type === "error" ? "#e74c3c" :
    type === "success" ? "#9b59b6" :
    "#333";
  toast.className = "show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, duration);
}
