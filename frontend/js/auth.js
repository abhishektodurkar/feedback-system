const base = "http://localhost:5000/api/auth";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      login();
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      register();
    });
  }
});

async function register() {
  const role = document.getElementById("role").value;
  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role,
  };

  const res = await fetch(`${base}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok) {
    alert(result.message || "Registration failed");
    return;
  }

  alert("Registered successfully. Please login.");
  window.location = "index.html";
}

async function login() {
  const role = document.getElementById("role").value;
  const data = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role,
  };

  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok || !result.token) {
    alert(result.message || "Login failed");
    return;
  }

  localStorage.setItem("token", result.token);
  localStorage.setItem("userName", result.user.name);
  localStorage.setItem("userRole", result.user.role);
  window.location = result.user.role === "admin" ? "dashboard.html" : "feedback.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location = "index.html";
}
