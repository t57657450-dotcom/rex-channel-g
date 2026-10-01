async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "خطایی رخ داد");
  }

  return data;
}

async function checkAdmin() {
  try {
    const data = await api("/api/admin/users");
    renderUsers(data.users || []);
    loadCountries();
    loadSettings();

    document.getElementById("adminMessage").innerHTML =
      `<span class="success">ورود به پنل مدیریت موفق بود.</span>`;
  } catch (err) {
    document.getElementById("adminMessage").innerHTML =
      `<span class="error">${err.message}</span>`;

    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }
}

async function loadUsers() {
  try {
    const data = await api("/api/admin/users");
    renderUsers(data.users || []);
  } catch (err) {
    showError(err.message);
  }
}

function renderUsers(users) {
  const box = document.getElementById("users");

  if (!users.length) {
    box.innerHTML = "<p>کاربری وجود ندارد.</p>";
    return;
  }

  box.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>نام کاربری</th>
          <th>کشور</th>
          <th>پول</th>
          <th>عملیات</th>
        </tr>
      </thead>

      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.id}</td>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.country)}</td>
            <td>${user.money}</td>

            <td>
              <button onclick="giveMoney(${user.id})">
                💰 افزودن پول
              </button>

              <button onclick="deleteUser(${user.id})">
                🗑️ حذف
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function giveMoney(id) {
  const amount = prompt("مقدار پول را وارد کنید:");

  if (!amount) return;

  const value = Number(amount);

  if (!Number.isFinite(value)) {
    alert("مقدار وارد شده معتبر نیست.");
    return;
  }

  try {
    await api("/api/admin/give-money", {
      method: "POST",
      body: JSON.stringify({
        userId: id,
        amount: value
      })
    });

    alert("پول با موفقیت تغییر کرد.");
    loadUsers();

  } catch (err) {
    alert(err.message);
  }
}

async function deleteUser(id) {
  const ok = confirm(
    "آیا مطمئنی می‌خواهی این کاربر حذف شود؟"
  );

  if (!ok) return;

  try {
    await api("/api/admin/delete-user", {
      method: "POST",
      body: JSON.stringify({
        userId: id
      })
    });

    loadUsers();

  } catch (err) {
    alert(err.message);
  }
}

async function loadCountries() {
  try {
    const data = await api("/api/countries");

    renderCountries(data.countries || []);

  } catch (err) {
    showError(err.message);
  }
}

function renderCountries(countries) {
  const box = document.getElementById("countries");

  box.innerHTML = `
    <div class="country-grid">

      ${countries.map(country => `
        <div class="country ${country.active ? "active" : "inactive"}">

          <h3>${escapeHtml(country.name)}</h3>

          <p>
            وضعیت:
            ${
              country.active
                ? "🟢 دارای بازیکن"
                : "⚪ آزاد"
            }
          </p>

          ${
            country.owner
              ? `<p>مالک: ${escapeHtml(country.owner)}</p>`
              : `<p>مالک ندارد</p>`
          }

        </div>
      `).join("")}

    </div>
  `;
}

async function loadSettings() {
  try {
    const data = await api("/api/admin/settings");

    const input =
      document.getElementById("allowedDifference");

    if (input && data.settings) {
      input.value =
        data.settings.allowed_difference || 500;
    }

  } catch (err) {
    showError(err.message);
  }
}

async function saveSettings() {
  const value =
    Number(
      document.getElementById("allowedDifference").value
    );

  if (!Number.isFinite(value) || value < 0) {
    alert("عدد معتبر وارد کنید.");
    return;
  }

  try {
    await api("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify({
        allowedDifference: value
      })
    });

    document.getElementById("settingsMessage").innerHTML =
      `<span class="success">
        تنظیمات با موفقیت ذخیره شد.
      </span>`;

  } catch (err) {
    document.getElementById("settingsMessage").innerHTML =
      `<span class="error">${err.message}</span>`;
  }
}

async function changeAdminPassword() {
  const password =
    document.getElementById("newAdminPassword").value;

  if (!password || password.length < 4) {
    alert("رمز باید حداقل ۴ کاراکتر باشد.");
    return;
  }

  /*
    فعلاً چون API تغییر رمز ادمین
    در server.js ساخته نشده، این بخش
    بعد از اضافه شدن API فعال می‌شود.
  */

  document.getElementById("passwordMessage").innerHTML =
    `<span class="warning">
      API تغییر رمز ادمین هنوز در server.js فعال نشده است.
    </span>`;
}

async function logoutAdmin() {
  try {
    await api("/api/logout", {
      method: "POST"
    });
  } catch (e) {}

  window.location.href = "/";
}

function showError(message) {
  document.getElementById("adminMessage").innerHTML =
    `<span class="error">${escapeHtml(message)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

checkAdmin();
