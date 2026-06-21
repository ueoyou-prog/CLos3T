const DB_KEY = "muse_closet_db_v1";
const SESSION_KEY = "muse_closet_session";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  user: null,
  closet: [],
  weather: { temp: 20, min: 17, max: 24, sky: "맑음", source: "demo" },
};

const colorRules = {
  블랙: ["화이트", "그레이", "블랙", "베이지", "브라운"],
  화이트: ["블랙", "네이비", "블루", "베이지", "그레이"],
  그레이: ["블랙", "화이트", "네이비", "블루"],
  네이비: ["화이트", "그레이", "베이지", "브라운"],
  베이지: ["화이트", "브라운", "네이비", "카키", "블랙"],
  브라운: ["베이지", "화이트", "카키", "블랙"],
  블루: ["화이트", "그레이", "네이비", "베이지"],
  레드: ["블랙", "화이트", "그레이", "네이비"],
  그린: ["베이지", "화이트", "브라운", "블랙"],
  카키: ["베이지", "브라운", "블랙", "화이트"],
  핑크: ["화이트", "그레이", "블랙", "네이비"],
};

function loadDB() {
  return JSON.parse(localStorage.getItem(DB_KEY) || JSON.stringify({ users: {}, closet: {}, history: {} }));
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getChecked(containerSelector) {
  return $$(`${containerSelector} input:checked`).map((el) => el.value);
}

function validateUser(id, password) {
  if (!id || id.length < 4) return "아이디는 4자 이상이어야 해.";
  if (!password || password.length < 8) return "비밀번호는 8자 이상이어야 해.";
  if (!/[!@#$%^&*(),.?\":{}|<>_\-+=~`]/.test(password)) return "비밀번호에 특수문자 하나 이상 넣어줘.";
  return "";
}

function showPage(isLoggedIn) {
  $("#authPage").classList.toggle("hidden", isLoggedIn);
  $("#mainPage").classList.toggle("hidden", !isLoggedIn);
}

function boot() {
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
    const db = loadDB();
    state.user = db.users[session];
    state.closet = db.closet[session] || [];
    if (state.user) {
      showPage(true);
      $("#helloText").textContent = `${state.user.id}의 오늘 옷장`;
      renderCloset();
      fetchWeather();
      return;
    }
  }
  showPage(false);
}

$("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = $("#userId").value.trim();
  const password = $("#password").value;
  const message = validateUser(id, password);
  if (message) return $("#authError").textContent = message;

  const profile = {
    id,
    password,
    gender: $("#gender").value,
    height: Number($("#height").value),
    weight: Number($("#weight").value),
    bodyType: $("#bodyType").value,
    preferredStyles: getChecked("#styleChips"),
    createdAt: new Date().toISOString(),
  };

  if (!profile.preferredStyles.length) {
    return $("#authError").textContent = "선호 스타일을 하나 이상 골라줘.";
  }

  const db = loadDB();
  db.users[id] = profile;
  db.closet[id] = db.closet[id] || seedCloset();
  db.history[id] = db.history[id] || [];
  saveDB(db);
  localStorage.setItem(SESSION_KEY, id);

  state.user = profile;
  state.closet = db.closet[id];
  $("#authError").textContent = "";
  $("#helloText").textContent = `${id}의 오늘 옷장`;
  showPage(true);
  renderCloset();
  fetchWeather();
});

$("#logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

$("#imageInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    $("#preview").src = reader.result;
    $("#preview").style.display = "block";
    $(".upload-box span").style.display = "none";
  };
  reader.readAsDataURL(file);
});

$("#closetForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const imageUrl = $("#preview").src;
  if (!imageUrl) return alert("이미지를 먼저 선택해줘.");

  const item = {
    id: crypto.randomUUID(),
    imageUrl: await removeBackgroundDemo(imageUrl),
    category: $("#category").value,
    color: $("#color").value,
    thickness: $("#thickness").value,
    season: $("#season").value,
    styles: getChecked("#itemStyleChips"),
    createdAt: new Date().toISOString(),
  };

  if (!item.styles.length) item.styles = ["캐주얼"];
  state.closet.unshift(item);
  persistCloset();
  renderCloset();
  event.target.reset();
  $("#preview").removeAttribute("src");
  $("#preview").style.display = "none";
  $(".upload-box span").style.display = "block";
});

async function removeBackgroundDemo(imageUrl) {
  // 실제 배포형 백엔드 예시:
  // const formData = new FormData(); formData.append("image", file);
  // const res = await fetch("/api/remove-bg", { method: "POST", body: formData });
  // return (await res.json()).transparentImageUrl;
  // 서버에서 Python rembg 또는 remove.bg류 API를 연결하면 됨.
  return imageUrl;
}

function persistCloset() {
  const db = loadDB();
  db.closet[state.user.id] = state.closet;
  saveDB(db);
}

$("#filterCategory").addEventListener("change", renderCloset);

function renderCloset() {
  const filter = $("#filterCategory").value;
  const items = filter === "전체" ? state.closet : state.closet.filter((item) => item.category === filter);
  const grid = $("#closetGrid");
  if (!items.length) {
    grid.className = "closet-grid empty";
    grid.textContent = "이 카테고리에 등록된 옷이 없어요.";
    return;
  }
  grid.className = "closet-grid";
  grid.innerHTML = items.map(item => `
    <article class="item-card">
      <img src="${item.imageUrl}" alt="${item.category} ${item.color}">
      <div class="item-meta">
        <strong>${item.category} · ${item.color}</strong>
        <p class="tags">${item.thickness} · ${item.season}<br>${item.styles.join(" · ")}</p>
        <button class="delete" onclick="deleteItem('${item.id}')">삭제</button>
      </div>
    </article>
  `).join("");
}

window.deleteItem = (id) => {
  state.closet = state.closet.filter((item) => item.id !== id);
  persistCloset();
  renderCloset();
  createRecommendations();
};

$("#refreshWeather").addEventListener("click", fetchWeather);

async function fetchWeather() {
  $("#weatherTitle").textContent = "날씨 확인 중";
  if (!navigator.geolocation) {
    updateWeatherCard("브라우저 위치 기능 없음", "데모 기온 20℃ 기준으로 추천해요.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    // GitHub Pages 정적 배포라 API 키 없이 Open-Meteo를 사용. 과제에서 기상청 API를 쓰려면 이 부분만 교체.
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      state.weather = {
        temp: Math.round(data.current.temperature_2m),
        min: Math.round(data.daily.temperature_2m_min[0]),
        max: Math.round(data.daily.temperature_2m_max[0]),
        sky: weatherCodeToText(data.current.weather_code),
        source: "live",
      };
      updateWeatherCard(`${state.weather.temp}℃ · ${state.weather.sky}`, `오늘 최저 ${state.weather.min}℃ / 최고 ${state.weather.max}℃ 기준으로 옷을 골라요.`);
      createRecommendations();
    } catch {
      state.weather = { temp: 20, min: 17, max: 24, sky: "맑음", source: "demo" };
      updateWeatherCard("20℃ · 데모 날씨", "날씨 호출 실패로 기본값을 사용했어요.");
    }
  }, () => {
    state.weather = { temp: 20, min: 17, max: 24, sky: "맑음", source: "demo" };
    updateWeatherCard("20℃ · 위치 권한 없음", "기본 기온 20℃ 기준으로 추천해요.");
    createRecommendations();
  });
}

function weatherCodeToText(code) {
  if ([0, 1].includes(code)) return "맑음";
  if ([2, 3, 45, 48].includes(code)) return "흐림";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "비";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "눈";
  return "변덕스러움";
}

function updateWeatherCard(title, desc) {
  $("#weatherTitle").textContent = title;
  $("#weatherDesc").textContent = desc;
}

$("#recommendBtn").addEventListener("click", createRecommendations);

function thicknessByTemp(temp, category) {
  if (temp <= 5) return category === "아우터" ? ["두꺼움"] : ["두꺼움", "보통"];
  if (temp <= 15) return category === "아우터" ? ["보통", "두꺼움"] : ["보통", "두꺼움"];
  if (temp <= 22) return category === "아우터" ? ["얇음", "보통"] : ["얇음", "보통"];
  return category === "아우터" ? [] : ["얇음"];
}

function filterByCategory(category) {
  const allowed = thicknessByTemp(state.weather.temp, category);
  return state.closet.filter((item) => {
    const styleHit = item.styles.some((tag) => state.user.preferredStyles.includes(tag));
    return item.category === category && allowed.includes(item.thickness) && styleHit;
  });
}

function pickRandom(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function matchByColor(items, baseColor) {
  const goodColors = colorRules[baseColor] || [];
  const matched = items.filter((item) => goodColors.includes(item.color));
  return matched.length ? matched : items;
}

function createRecommendations() {
  const tops = filterByCategory("상의");
  const bottoms = filterByCategory("하의");
  const outerPool = filterByCategory("아우터");
  const needOuter = state.weather.temp <= 22;

  const wrap = $("#recommendations");
  if (!tops.length || !bottoms.length || (needOuter && !outerPool.length)) {
    wrap.className = "recommendations empty";
    wrap.textContent = "기온/스타일 조건에 맞는 상의·하의가 부족해요. 옷을 조금 더 등록해줘.";
    return;
  }

  const sets = [];
  for (let i = 0; i < 3; i++) {
    const top = pickRandom(tops);
    const bottom = pickRandom(matchByColor(bottoms, top.color));
    const outer = needOuter ? pickRandom(matchByColor(outerPool, top.color)) : null;
    sets.push({ id: crypto.randomUUID(), top, bottom, outer, date: new Date().toISOString().slice(0, 10) });
  }

  wrap.className = "recommendations";
  wrap.innerHTML = sets.map((set, index) => `
    <article class="set-card">
      <div class="set-images">
        <img src="${set.top.imageUrl}" alt="상의">
        <img src="${set.bottom.imageUrl}" alt="하의">
        ${set.outer ? `<img src="${set.outer.imageUrl}" alt="아우터">` : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23f4efe7'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23746d65' font-size='16'%3ENo Outer%3C/text%3E%3C/svg%3E" alt="아우터 없음">`}
      </div>
      <p class="eyebrow">Look ${index + 1}</p>
      <h4>${set.top.color} 상의 + ${set.bottom.color} 하의</h4>
      <p class="tags">${state.weather.temp}℃ · ${set.top.styles.join("/")} mood</p>
      <button class="wear" onclick='saveHistory(${JSON.stringify(JSON.stringify(set))})'>착용 완료</button>
    </article>
  `).join("");
}

window.saveHistory = (setJson) => {
  const set = JSON.parse(setJson);
  const db = loadDB();
  db.history[state.user.id] = db.history[state.user.id] || [];
  db.history[state.user.id].push({
    date: set.date,
    outfitId: set.id,
    itemIds: [set.top.id, set.bottom.id, set.outer?.id].filter(Boolean),
  });
  saveDB(db);
  alert("오늘의 착용 기록 저장 완료.");
};

function seedCloset() {
  const svg = (label, bg) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='520'%3E%3Crect width='100%25' height='100%25' fill='${bg.replace("#", "%23")}'/%3E%3Ccircle cx='200' cy='210' r='92' fill='rgba(255,255,255,.35)'/%3E%3Ctext x='50%25' y='72%25' dominant-baseline='middle' text-anchor='middle' fill='%23171412' font-family='Arial' font-size='32' font-weight='700'%3E${encodeURIComponent(label)}%3C/text%3E%3C/svg%3E`;
  return [
    { id: crypto.randomUUID(), imageUrl: svg("White Tee", "#f7f4ef"), category: "상의", color: "화이트", thickness: "얇음", season: "여름", styles: ["미니멀", "캐주얼"], createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), imageUrl: svg("Navy Knit", "#d8dce2"), category: "상의", color: "네이비", thickness: "보통", season: "가을", styles: ["미니멀", "클래식"], createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), imageUrl: svg("Black Pants", "#d7d2ca"), category: "하의", color: "블랙", thickness: "보통", season: "사계절", styles: ["미니멀", "시티보이"], createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), imageUrl: svg("Beige Pants", "#e8dbc7"), category: "하의", color: "베이지", thickness: "얇음", season: "봄", styles: ["캐주얼", "시티보이"], createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), imageUrl: svg("Brown Coat", "#cbb69f"), category: "아우터", color: "브라운", thickness: "두꺼움", season: "겨울", styles: ["클래식", "미니멀"], createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), imageUrl: svg("Gray Jacket", "#d6d2cc"), category: "아우터", color: "그레이", thickness: "보통", season: "봄", styles: ["미니멀", "캐주얼"], createdAt: new Date().toISOString() },
  ];
}

boot();
