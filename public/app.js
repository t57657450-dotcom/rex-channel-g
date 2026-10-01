let me = null;
let countries = [];

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "خطایی رخ داد");
    }

    return data;
}

/* =========================
   AUTH
========================= */

async function register() {
    try {
        await api("/api/register", {
            method: "POST",
            body: JSON.stringify({
                username: document.getElementById("regUser").value,
                password: document.getElementById("regPass").value,
                country: document.getElementById("regCountry").value
            })
        });

        alert("حساب با موفقیت ساخته شد.");
        await startGame();

    } catch (error) {
        document.getElementById("authMessage").innerText = error.message;
    }
}

async function login() {
    try {
        await api("/api/login", {
            method: "POST",
            body: JSON.stringify({
                username: document.getElementById("loginUser").value,
                password: document.getElementById("loginPass").value
            })
        });

        await startGame();

    } catch (error) {
        document.getElementById("authMessage").innerText = error.message;
    }
}

async function adminLogin() {
    try {
        await api("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({
                username: document.getElementById("adminUser").value,
                password: document.getElementById("adminPass").value
            })
        });

        alert("ورود ادمین موفق بود.");

        window.location.href = "/admin.html";

    } catch (error) {
        alert(error.message);
    }
}

async function logout() {
    await api("/api/logout", {
        method: "POST"
    });

    location.reload();
}

/* =========================
   START GAME
========================= */

async function startGame() {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("nav").classList.remove("hidden");

    await loadCountries();
    await refresh();

    page("home");
}

/* =========================
   REFRESH
========================= */

async function refresh() {
    me = await api("/api/me");

    renderStats();
    renderHome();
    renderAssets();
    renderShop();
    renderWar();
    renderMap();
    renderSettings();
}

/* =========================
   NAVIGATION
========================= */

function page(id) {
    document.querySelectorAll(".page").forEach(element => {
        element.classList.add("hidden");
    });

    const target = document.getElementById(id);

    if (target) {
        target.classList.remove("hidden");
    }
}

/* =========================
   STATS
========================= */

function renderStats() {
    const stats = document.getElementById("stats");

    stats.innerHTML = `
        <div class="stat">
            💰 میل
            <b>${me.user.money.toLocaleString()}</b>
        </div>

        <div class="stat">
            🪙 سکه
            <b>${me.user.coins.toLocaleString()}</b>
        </div>

        <div class="stat">
            ⚔️ قدرت هجومی
            <b>${me.power.attack.toLocaleString()}</b>
        </div>

        <div class="stat">
            🛡️ قدرت دفاعی
            <b>${me.power.defense.toLocaleString()}</b>
        </div>

        <div class="stat">
            ⚡ قدرت کل
            <b>${me.power.total.toLocaleString()}</b>
        </div>
    `;
}

/* =========================
   HOME
========================= */

function renderHome() {
    const home = document.getElementById("home");
    const country = me.country;

    home.innerHTML = `
        <div class="card">

            <h2>
                ${country[1]} ${country[2]}
            </h2>

            <p>
                👤 بازیکن:
                <b>${me.user.username}</b>
            </p>

            <p>
                🪖 تعداد واحدها:
                ${me.power.units.toLocaleString()}
            </p>

            <p>
                💰 ارزش تجهیزات:
                ${me.power.value.toLocaleString()} میل
            </p>

            <p>
                ⚔️ قدرت هجومی:
                ${me.power.attack.toLocaleString()}
            </p>

            <p>
                🛡️ قدرت دفاعی:
                ${me.power.defense.toLocaleString()}
            </p>

            <p>
                ⚡ قدرت کل:
                ${me.power.total.toLocaleString()}
            </p>

            <div class="notice">
                هر خرید فقط در صورت داشتن موجودی کافی انجام می‌شود
                و پس از خرید مستقیماً به بخش «دارایی من» اضافه خواهد شد.
            </div>

        </div>
    `;
}

/* =========================
   ASSETS
========================= */

function renderAssets() {
    const assets = document.getElementById("assets");

    assets.innerHTML = `
        <div class="card">

            <h2>🎒 دارایی من</h2>

            <div class="grid">

                ${
                    me.inventory.length
                    ?
                    me.inventory.map(item => {

                        const unit = me.units[item.item];

                        return `
                            <div class="item">

                                <h3>${unit.name}</h3>

                                <p>
                                    📦 تعداد:
                                    <b>${item.amount.toLocaleString()}</b>
                                </p>

                                <p>
                                    ⚔️ قدرت هجومی:
                                    ${(unit.attack * item.amount).toLocaleString()}
                                </p>

                                <p>
                                    🛡️ قدرت دفاعی:
                                    ${(unit.defense * item.amount).toLocaleString()}
                                </p>

                                <p>
                                    💰 ارزش:
                                    ${(unit.price * item.amount).toLocaleString()}
                                </p>

                            </div>
                        `;

                    }).join("")
                    :
                    `
                        <div class="notice">
                            هنوز تجهیزاتی در دارایی شما وجود ندارد.
                        </div>
                    `
                }

            </div>

        </div>
    `;
}

/* =========================
   SHOP
========================= */

function renderShop() {
    const shop = document.getElementById("shop");

    shop.innerHTML = `
        <div class="card">

            <h2>🛒 فروشگاه تجهیزات</h2>

            <div class="grid">

                ${
                    Object.entries(me.units).map(([key, unit]) => {

                        return `
                            <div class="item">

                                <h3>${unit.name}</h3>

                                <p>
                                    ⚔️ حمله:
                                    ${unit.attack}
                                </p>

                                <p>
                                    🛡️ دفاع:
                                    ${unit.defense}
                                </p>

                                <p>
                                    💰 قیمت:
                                    ${unit.price.toLocaleString()} میل
                                </p>

                                <input
                                    id="amount_${key}"
                                    type="number"
                                    min="1"
                                    value="1"
                                >

                                <button onclick="buy('${key}')">
                                    خرید
                                </button>

                            </div>
                        `;

                    }).join("")
                }

            </div>

        </div>
    `;
}

/* =========================
   BUY
========================= */

async function buy(item) {
    const input = document.getElementById("amount_" + item);
    const amount = Number(input.value);

    if (!Number.isInteger(amount) || amount <= 0) {
        alert("تعداد واردشده صحیح نیست.");
        return;
    }

    try {

        const result = await api("/api/buy", {
            method: "POST",

            body: JSON.stringify({
                item,
                amount
            })
        });

        alert(result.message);

        await refresh();

        page("assets");

    } catch (error) {
        alert(error.message);
    }
}

/* =========================
   COUNTRIES
========================= */

async function loadCountries() {
    countries = await api("/api/countries");

    const select = document.getElementById("regCountry");

    if (!select) return;

    select.innerHTML = countries.map(country => {

        return `
            <option
                value="${country.id}"
                ${country.active ? "disabled" : ""}
            >
                ${country.flag}
                ${country.name}
                ${country.active ? " — گرفته شده" : ""}
            </option>
        `;

    }).join("");
}

/* =========================
   WAR
========================= */

function renderWar() {
    const war = document.getElementById("war");

    const availableCountries = countries.filter(country => {
        return country.active &&
               country.id !== me.user.country;
    });

    war.innerHTML = `
        <div class="card">

            <h2>⚔️ اعلام جنگ</h2>

            <p>
                قدرت کشور شما:
                <b>${me.power.total.toLocaleString()}</b>
            </p>

            <div class="map">

                ${
                    availableCountries.length
                    ?
                    availableCountries.map(country => {

                        const difference = Math.abs(
                            me.power.total -
                            country.power.total
                        );

                        return `
                            <div class="country">

                                <h3>
                                    ${country.flag}
                                    ${country.name}
                                </h3>

                                <p>
                                    👤
                                    ${country.username}
                                </p>

                                <p>
                                    ⚔️ حمله:
                                    ${country.power.attack.toLocaleString()}
                                </p>

                                <p>
                                    🛡️ دفاع:
                                    ${country.power.defense.toLocaleString()}
                                </p>

                                <p>
                                    ⚡ قدرت کل:
                                    ${country.power.total.toLocaleString()}
                                </p>

                                <p>
                                    📊 اختلاف:
                                    ${difference.toLocaleString()}
                                </p>

                                <button
                                    onclick="prepareWar('${country.id}')"
                                >
                                    بررسی جنگ
                                </button>

                            </div>
                        `;

                    }).join("")
                    :
                    `
                        <div class="notice">
                            فعلاً کشور فعال دیگری برای جنگ وجود ندارد.
                        </div>
                    `
                }

            </div>

            <div id="warConfirm"></div>

        </div>
    `;
}

function prepareWar(targetId) {
    const target = countries.find(
        country => country.id === targetId
    );

    if (!target) return;

    const difference = Math.abs(
        me.power.total -
        target.power.total
    );

    const allowedDifference = 500;

    const possible = difference <= allowedDifference;

    document.getElementById("warConfirm").innerHTML = `
        <div class="notice">

            <h3>
                ${me.country[1]}
                ${me.country[2]}

                ⚔️

                ${target.flag}
                ${target.name}
            </h3>

            <p>
                ⚔️ قدرت هجومی شما:
                <b>${me.power.attack.toLocaleString()}</b>
            </p>

            <p>
                🛡️ قدرت دفاعی شما:
                <b>${me.power.defense.toLocaleString()}</b>
            </p>

            <p>
                ⚔️ قدرت کشور هدف:
                <b>${target.power.attack.toLocaleString()}</b>
            </p>

            <p>
                🛡️ دفاع کشور هدف:
                <b>${target.power.defense.toLocaleString()}</b>
            </p>

            <p>
                ⚡ قدرت کل شما:
                <b>${me.power.total.toLocaleString()}</b>
            </p>

            <p>
                ⚡ قدرت کل هدف:
                <b>${target.power.total.toLocaleString()}</b>
            </p>

            <p>
                📊 اختلاف:
                <b>${difference.toLocaleString()}</b>
            </p>

            ${
                possible
                ?
                `
                    <p class="good">
                        ✅ جنگ از نظر قدرت مجاز است.
                    </p>

                    <button onclick="declareWar('${targetId}')">
                        ⚔️ تأیید و اعلام جنگ
                    </button>
                `
                :
                `
                    <p class="bad">
                        ⚠️ جنگ نامتوازن است و امکان اعلام آن وجود ندارد.
                    </p>
                `
            }

        </div>
    `;
}

/* =========================
   DECLARE WAR
========================= */

async function declareWar(targetId) {

    try {

        const result = await api("/api/war", {
            method: "POST",

            body: JSON.stringify({
                targetId,
                selectedUnits: {}
            })
        });

        alert(
            "نتیجه جنگ: " +
            result.result
        );

        await loadCountries();
        await refresh();

        page("war");

    } catch (error) {
        alert(error.message);
    }
}

/* =========================
   MAP
========================= */

function renderMap() {

    const map = document.getElementById("map");

    map.innerHTML = `
        <div class="card">

            <h2>🌍 نقشه کشورها</h2>

            <div class="map">

                ${
                    countries.map(country => {

                        return `
                            <div class="country">

                                <h3>
                                    ${country.flag}
                                    ${country.name}
                                </h3>

                                <span class="badge">
                                    ${
                                        country.active
                                        ?
                                        "🟢 فعال"
                                        :
                                        "⚪ بدون بازیکن"
                                    }
                                </span>

                                ${
                                    country.active
                                    ?
                                    `
                                        <p>
                                            👤
                                            ${country.username}
                                        </p>

                                        <p>
                                            ⚡
                                            ${country.power.total.toLocaleString()}
                                        </p>
                                    `
                                    :
                                    `
                                        <p>
                                            این کشور هنوز بازیکن ندارد.
                                        </p>
                                    `
                                }

                            </div>
                        `;

                    }).join("")
                }

            </div>

        </div>
    `;
}

/* =========================
   SETTINGS
========================= */

function renderSettings() {

    const settings = document.getElementById("settings");

    settings.innerHTML = `
        <div class="card">

            <h2>⚙️ تنظیمات حساب</h2>

            <input
                id="oldPassword"
                type="password"
                placeholder="رمز عبور فعلی"
            >

            <input
                id="newPassword"
                type="password"
                placeholder="رمز عبور جدید"
            >

            <button onclick="changePassword()">
                🔐 تغییر رمز عبور
            </button>

        </div>
    `;
}

/* =========================
   CHANGE PASSWORD
========================= */

async function changePassword() {

    const oldPassword =
        document.getElementById("oldPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    try {

        await api("/api/change-password", {
            method: "POST",

            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });

        alert("رمز عبور با موفقیت تغییر کرد.");

        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";

    } catch (error) {
        alert(error.message);
    }
}

/* =========================
   AUTO CHECK
========================= */

(async function () {

    try {

        await loadCountries();

    } catch (error) {

        console.log(
            "Server هنوز اجرا نشده است."
        );

    }

})();
