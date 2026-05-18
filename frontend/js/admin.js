const authBase = "http://localhost:5000/api/auth";
const feedbackBase = "http://localhost:5000/api/feedback";
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("feedbackList")) {
    if (!token) window.location = "index.html";
    loadDashboard();
  }
});

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function adminLogin() {
  const data = {
    email: document.getElementById("adminEmail").value,
    password: document.getElementById("adminPassword").value,
  };

  const res = await fetch(`${authBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok || !result.token || result.user.role !== "admin") {
    alert(result.message || "Access denied");
    return;
  }

  localStorage.setItem("token", result.token);
  localStorage.setItem("adminName", result.user.name);
  window.location = "dashboard.html";
}

async function loadDashboard() {
  await Promise.all([loadAnalytics(), loadFeedbacks(), loadAuditLogs()]);
}

async function loadAnalytics() {
  const res = await fetch(`${feedbackBase}/analytics`, { headers: authHeaders() });
  if (!res.ok) {
    document.getElementById("totalFeedback").textContent = "-";
    document.getElementById("averageRating").textContent = "-";
    document.getElementById("highPriority").textContent = "-";
    document.getElementById("openItems").textContent = "-";
    listError("charts", "Analytics are available only after admin login.");
    return;
  }

  const analytics = await res.json();

  document.getElementById("totalFeedback").textContent = analytics.total;
  document.getElementById("averageRating").textContent = analytics.averageRating;
  document.getElementById("highPriority").textContent = analytics.highPriority;
  document.getElementById("openItems").textContent =
    (analytics.byStatus.pending || 0) + (analytics.byStatus.reviewed || 0);

  const chartData = [
    ["Status", analytics.byStatus],
    ["Category", analytics.byCategory],
    ["Rating", analytics.byRating],
  ];

  document.getElementById("charts").innerHTML = chartData.map(([title, data]) => {
    const max = Math.max(...Object.values(data), 1);
    const rows = Object.entries(data).map(([label, value]) => `
      <div class="bar-row">
        <span>${label}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${(value / max) * 100}%"></span></span>
        <span>${value}</span>
      </div>
    `).join("");

    return `<div><h3>${title}</h3><div class="chart-list">${rows || '<p class="muted">No data yet.</p>'}</div></div>`;
  }).join("");
}

async function loadFeedbacks() {
  const res = await fetch(`${feedbackBase}/all`, { headers: authHeaders() });
  if (!res.ok) {
    listError("feedbackList", "Could not load feedback. Please login with an admin account.");
    return;
  }

  const feedbacks = await res.json();
  const list = document.getElementById("feedbackList");

  if (!feedbacks.length) {
    list.innerHTML = '<p class="muted">No feedback submitted yet.</p>';
    return;
  }

  list.innerHTML = feedbacks.map((fb) => `
    <article class="feedback-card">
      <div class="feedback-head">
        <div>
          <h3>${fb.title || "General feedback"}</h3>
          <p class="muted">${fb.user?.name || fb.userName || "Unknown user"} - ${fb.user?.email || fb.userEmail || "No email"}</p>
        </div>
        <span class="pill ${fb.status}">${fb.status}</span>
      </div>
      <div class="meta">
        <span class="pill">Rating ${fb.rating}/5</span>
        <span class="pill">${fb.category}</span>
        <span class="pill">${fb.channel}</span>
        <span class="pill ${fb.priority}">${fb.priority} priority</span>
        <span class="pill">Form v${fb.formVersion}</span>
      </div>
      <p class="message">${fb.message}</p>
      <div class="compact-form">
        <div class="two-cols">
          <label>Status
            <select id="status-${fb._id}">
              ${["pending", "reviewed", "resolved", "rejected"].map((status) =>
                `<option value="${status}" ${status === fb.status ? "selected" : ""}>${status}</option>`
              ).join("")}
            </select>
          </label>
          <label>Admin note
            <input id="note-${fb._id}" value="${fb.adminNote || ""}" placeholder="Add note for user" />
          </label>
        </div>
        <button onclick="updateStatus('${fb._id}')">Update Status</button>
      </div>
    </article>
  `).join("");
}

function listError(id, message) {
  document.getElementById(id).innerHTML = `<p class="notice">${message}</p>`;
}

async function updateStatus(id) {
  const status = document.getElementById(`status-${id}`).value;
  const adminNote = document.getElementById(`note-${id}`).value;

  const res = await fetch(`${feedbackBase}/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status, adminNote }),
  });

  if (!res.ok) {
    alert("Status update failed");
    return;
  }

  loadDashboard();
}

async function saveFormVersion() {
  const categories = document.getElementById("newCategories").value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const channels = document.getElementById("newChannels").value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const res = await fetch(`${feedbackBase}/form`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      title: document.getElementById("newFormTitle").value || "Feedback Form",
      categories,
      channels,
    }),
  });

  if (!res.ok) {
    alert("Could not create form version");
    return;
  }

  alert("New form version created");
  document.getElementById("newFormTitle").value = "";
  document.getElementById("newCategories").value = "";
  document.getElementById("newChannels").value = "";
  loadAuditLogs();
}

async function loadAuditLogs() {
  const res = await fetch(`${feedbackBase}/audit`, { headers: authHeaders() });
  if (!res.ok) {
    listError("auditList", "Audit logs are available only after admin login.");
    return;
  }

  const logs = await res.json();

  document.getElementById("auditList").innerHTML = logs.slice(0, 8).map((log) => `
    <div class="feedback-card">
      <strong>${log.action}</strong>
      <p class="muted">${log.userEmail} - ${new Date(log.createdAt).toLocaleString()}</p>
      <p class="message">${log.details}</p>
    </div>
  `).join("") || '<p class="muted">No audit activity yet.</p>';
}

function exportFeedback(format) {
  fetch(`${feedbackBase}/export?format=${format}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Export failed");
      return res.blob();
    })
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback_export.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(() => alert("Failed to export feedback"));
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminName");
  window.location = "index.html";
}
