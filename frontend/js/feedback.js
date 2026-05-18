const base = "http://localhost:5000/api/feedback";
const token = localStorage.getItem("token");

if (!token) {
  window.location = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadForm();
  loadHistory();
});

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function loadForm() {
  const res = await fetch(`${base}/form`, { headers: authHeaders() });
  const form = await res.json();

  document.getElementById("formTitle").textContent = form.title;
  document.getElementById("formVersion").textContent = `Active form v${form.version}`;
  fillSelect("category", form.categories);
  fillSelect("channel", form.channels);
}

function fillSelect(id, options) {
  const select = document.getElementById(id);
  select.innerHTML = options.map((item) => `<option value="${item}">${item}</option>`).join("");
}

async function submitFeedback() {
  const payload = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    channel: document.getElementById("channel").value,
    rating: document.getElementById("rating").value,
    message: document.getElementById("message").value,
  };

  const res = await fetch(base, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (!res.ok) {
    alert(result.message || "Could not submit feedback");
    return;
  }

  document.getElementById("notice").innerHTML = '<div class="notice">Feedback submitted successfully.</div>';
  document.getElementById("title").value = "";
  document.getElementById("message").value = "";
  loadHistory();
}

async function loadHistory() {
  const res = await fetch(`${base}/mine`, { headers: authHeaders() });
  const feedbacks = await res.json();
  const list = document.getElementById("historyList");

  if (!feedbacks.length) {
    list.innerHTML = '<p class="muted">No feedback submitted yet.</p>';
    return;
  }

  list.innerHTML = feedbacks.map((fb) => `
    <article class="feedback-card">
      <div class="feedback-head">
        <div>
          <h3>${fb.title || "General feedback"}</h3>
          <div class="meta">
            <span class="pill ${fb.status}">${fb.status}</span>
            <span class="pill">Rating ${fb.rating}/5</span>
            <span class="pill">Form v${fb.formVersion}</span>
          </div>
        </div>
        <span class="muted">${new Date(fb.createdAt).toLocaleDateString()}</span>
      </div>
      <p class="message">${fb.message}</p>
      ${fb.adminNote ? `<p class="notice">${fb.adminNote}</p>` : ""}
    </article>
  `).join("");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  window.location = "index.html";
}
