const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const db = new Database("game.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static("public"));

/* ================= DATABASE ================= */

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  country TEXT UNIQUE NOT NULL,
  money INTEGER DEFAULT 1000000,
  coins INTEGER DEFAULT 100,
  resources INTEGER DEFAULT 500,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  UNIQUE(user_id,item)
);

CREATE TABLE IF NOT EXISTS wars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attacker INTEGER NOT NULL,
  defender INTEGER NOT NULL,
  attacker_power INTEGER,
  defender_power INTEGER,
  result TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

const defaultSettings = {
  maxPowerDifference: "500",
  income: "200",
  incomeInterval: "150"
};

for (const [key, value] of Object.entries(defaultSettings)) {
  db.prepare(
    "INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)"
  ).run(key, value);
}

/* ================= COUNTRIES ================= */

const countries = [
  ["iran","🇮🇷","ایران",720],
  ["usa","🇺🇸","آمریکا",1000],
  ["russia","🇷🇺","روسیه",900],
  ["china","🇨🇳","چین",950],
  ["india","🇮🇳","هند",760],
  ["pakistan","🇵🇰","پاکستان",550],
  ["afghanistan","🇦🇫","افغانستان",300],
  ["turkey","🇹🇷","ترکیه",610],
  ["iraq","🇮🇶","عراق",390],
  ["saudi","🇸🇦","عربستان سعودی",560],
  ["uae","🇦🇪","امارات",450],
  ["qatar","🇶🇦","قطر",330],
  ["kuwait","🇰🇼","کویت",300],
  ["oman","🇴🇲","عمان",310],
  ["israel","🇮🇱","اسرائیل",620],
  ["egypt","🇪🇬","مصر",500],
  ["germany","🇩🇪","آلمان",770],
  ["france","🇫🇷","فرانسه",790],
  ["uk","🇬🇧","بریتانیا",810],
  ["italy","🇮🇹","ایتالیا",650],
  ["spain","🇪🇸","اسپانیا",610],
  ["ukraine","🇺🇦","اوکراین",500],
  ["poland","🇵🇱","لهستان",520],
  ["japan","🇯🇵","ژاپن",700],
  ["south-korea","🇰🇷","کره جنوبی",670],
  ["north-korea","🇰🇵","کره شمالی",450],
  ["indonesia","🇮🇩","اندونزی",420],
  ["australia","🇦🇺","استرالیا",500],
  ["canada","🇨🇦","کانادا",600],
  ["mexico","🇲🇽","مکزیک",430],
  ["brazil","🇧🇷","برزیل",530],
  ["argentina","🇦🇷","آرژانتین",400],
  ["south-africa","🇿🇦","آفریقای جنوبی",360]
];

const units = {
  bomber: {
    name: "💣 یگان بمب‌افکن",
    price: 40000,
    attack: 40,
    defense: 10
  },
  mineLayer: {
    name: "🧨 یگان مین‌گذار",
    price: 20000,
    attack: 12,
    defense: 5
  },
  antiBomber: {
    name: "🛡️ یگان ضدبمب",
    price: 30000,
    attack: 10,
    defense: 35
  },
  antiMine: {
    name: "🛡️ یگان ضد‌مین",
    price: 25000,
    attack: 8,
    defense: 30
  },
  tank: {
    name: "🪖 تانک",
    price: 50000,
    attack: 50,
    defense: 55
  },
  plane: {
    name: "✈️ هواپیما",
    price: 80000,
    attack: 80,
    defense: 35
  },
  drone: {
    name: "🚁 پهپاد",
    price: 30000,
    attack: 30,
    defense: 20
  },
  special: {
    name: "⚔️ نیروی ویژه",
    price: 45000,
    attack: 45,
    defense: 40
  },
  vip: {
    name: "👑 تجهیزات VIP",
    price: 250000,
    attack: 150,
    defense: 150
  }
};

/* ================= HELPERS ================= */

function getUser() {
  if (!reqSessionUser) return null;
}

function requireLogin(req,res,next) {
  if (!req.session.userId) {
    return res.status(401).json({error:"ابتدا وارد حساب شوید."});
  }
  next();
}

function requireAdmin(req,res,next) {
  if (!req.session.admin) {
    return res.status(403).json({error:"دسترسی ادمین ندارید."});
  }
  next();
}

function countryInfo(id) {
  return countries.find(c => c[0] === id);
}

function getPower(userId) {
  const user = db.prepare(
    "SELECT * FROM users WHERE id=?"
  ).get(userId);

  if (!user) return null;

  const country = countryInfo(user.country);
  let attack = country ? country[3] : 0;
  let defense = Math.floor(attack * 0.8);

  const inv = db.prepare(
    "SELECT item,amount FROM inventory WHERE user_id=?"
  ).all(userId);

  let value = 0;
  let totalUnits = 0;

  for (const x of inv) {
    const unit = units[x.item];
    if (!unit) continue;

    attack += unit.attack * x.amount;
    defense += unit.defense * x.amount;
    value += unit.price * x.amount;
    totalUnits += x.amount;
  }

  return {
    attack,
    defense,
    total: attack + defense,
    value,
    units: totalUnits
  };
}

/* ================= REGISTER ================= */

app.post("/api/register", (req,res) => {
  const {username,password,country} = req.body;

  if (!username || !password || !country) {
    return res.status(400).json({
      error:"تمام فیلدها را وارد کنید."
    });
  }

  if (!
