/* ==========================================================================
   Neo Epic – JS (بدون مكتبات)
   وظائف: سلايدر الهيرو + بحث + فلترة + ترتيب + مودال عرض سريع + سلة (محاكاة)
   ========================================================================== */

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const state = {
  theme: localStorage.getItem("neoTheme") || "dark",
  q: "",
  filter: "all",
  sort: "popular",
  cart: JSON.parse(localStorage.getItem("neoCart") || "[]"),
  heroIndex: 0,
  heroTimer: null,
};

// بيانات تجريبية (استبدلها لاحقًا ببيانات متجرك أو ربط API عند الدمج في ثيم)
const products = [
  {id:"p1", type:"games", title:"EA Sports FC 25", desc:"نسخة رقمية – تفعيل فوري", price:219, old:259, off:15, popular:98, new:10, img:"https://images.pexels.com/photos/3945681/pexels-photo-3945681.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p2", type:"subs", title:"PlayStation Plus 12M", desc:"اشتراك 12 شهر – حساب سعودي", price:199, old:229, off:13, popular:95, new:8, img:"https://images.pexels.com/photos/3810792/pexels-photo-3810792.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p3", type:"cards", title:"Steam Wallet 100 SAR", desc:"كود فوري – صالح عالمياً", price:110, old:120, off:8, popular:92, new:7, img:"https://images.pexels.com/photos/4425769/pexels-photo-4425769.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p4", type:"games", title:"GTA V Premium", desc:"نسخة PC – تفعيل سريع", price:79, old:99, off:20, popular:90, new:6, img:"https://images.pexels.com/photos/745243/pexels-photo-745243.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p5", type:"subs", title:"Netflix 1 Month", desc:"حساب خاص – جودة عالية", price:35, old:45, off:22, popular:88, new:9, img:"https://images.pexels.com/photos/247917/pexels-photo-247917.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p6", type:"games", title:"Call of Duty MW", desc:"نسخة رقمية – منصة اختيارك", price:179, old:199, off:10, popular:86, new:5, img:"https://images.pexels.com/photos/275033/pexels-photo-275033.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p7", type:"cards", title:"Xbox Gift Card", desc:"كود فوري – استبدال سهل", price:120, old:135, off:11, popular:84, new:4, img:"https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=1200"},
  {id:"p8", type:"games", title:"PUBG UC 6000", desc:"شحن فوري – مضمون", price:160, old:190, off:16, popular:83, new:3, img:"https://images.pexels.com/photos/102148/pexels-photo-102148.jpeg?auto=compress&cs=tinysrgb&w=1200"},
];

const heroSlides = [
  {id:"p1", pill:"خصم 15%", meta:"تسليم فوري", tag:"Games"},
  {id:"p2", pill:"الأكثر طلباً", meta:"اشتراك", tag:"Subscriptions"},
  {id:"p3", pill:"شحن سريع", meta:"بطاقات", tag:"Cards"},
];

function formatSAR(n){ return `${n.toFixed(0)} ر.س`; }

function applyTheme(){
  document.documentElement.dataset.theme = state.theme === "light" ? "light" : "dark";
  localStorage.setItem("neoTheme", state.theme);
  $("#themeToggle").textContent = state.theme === "light" ? "☀" : "☾";
}

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.setAttribute("aria-hidden", "false");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.setAttribute("aria-hidden","true"), 2200);
}

function saveCart(){
  localStorage.setItem("neoCart", JSON.stringify(state.cart));
  $("#cartCount").textContent = String(state.cart.reduce((a,i)=>a+i.qty,0));
}

function cartTotal(){
  const total = state.cart.reduce((sum, item)=>{
    const p = products.find(x=>x.id===item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
  $("#cartTotal").textContent = formatSAR(total);
}

function openDrawer(id){
  const el = id==="cart" ? $("#cartDrawer") : null;
  if(!el) return;
  el.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  renderCart();
}
function closeDrawer(id){
  const el = id==="cart" ? $("#cartDrawer") : null;
  if(!el) return;
  el.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

function openModal(){
  $("#quickModal").setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  $("#quickModal").setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

function setQuickModal(p){
  $("#qmImg").style.backgroundImage = `url('${p.img}')`;
  $("#qmTag").textContent = p.type === "games" ? "ألعاب" : p.type === "subs" ? "اشتراكات" : "بطاقات";
  $("#qmTitle").textContent = p.title;
  $("#qmDesc").textContent = p.desc;
  $("#qmPrice").textContent = `${formatSAR(p.price)} ${p.old ? ` • كان ${formatSAR(p.old)}` : ""}`;
  $("#qmMeta").textContent = p.off ? `خصم ${p.off}%` : "عرض";
  $("#qmAdd").onclick = ()=> addToCart(p.id, 1, true);
}

function addToCart(id, qty=1, fromModal=false){
  const idx = state.cart.findIndex(x=>x.id===id);
  if(idx>=0) state.cart[idx].qty += qty;
  else state.cart.push({id, qty});
  saveCart();
  cartTotal();
  toast("تمت الإضافة للسلة 🛒");
  if(fromModal) closeModal();
}

function removeFromCart(id){
  state.cart = state.cart.filter(x=>x.id!==id);
  saveCart();
  renderCart();
  toast("تم الحذف");
}

function changeQty(id, delta){
  const item = state.cart.find(x=>x.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) removeFromCart(id);
  else{
    saveCart();
    renderCart();
  }
}

function renderCart(){
  const wrap = $("#cartItems");
  wrap.innerHTML = "";
  if(state.cart.length === 0){
    wrap.innerHTML = `<div class="muted">سلتك فارغة… جرّب إضافة بعض المنتجات.</div>`;
    cartTotal();
    return;
  }

  for(const item of state.cart){
    const p = products.find(x=>x.id===item.id);
    if(!p) continue;
    const row = document.createElement("div");
    row.className = "cartItem";
    row.innerHTML = `
      <div class="cartItem__img" style="background-image:url('${p.img}')"></div>
      <div>
        <div class="cartItem__t">${p.title}</div>
        <div class="cartItem__m mono">${formatSAR(p.price)}</div>
      </div>
      <div class="qty">
        <button aria-label="نقص" data-dec>−</button>
        <div class="mono">${item.qty}</div>
        <button aria-label="زيد" data-inc>+</button>
      </div>
    `;
    row.querySelector("[data-dec]").onclick = ()=> changeQty(item.id, -1);
    row.querySelector("[data-inc]").onclick = ()=> changeQty(item.id, +1);
    row.ondblclick = ()=> removeFromCart(item.id);
    wrap.appendChild(row);
  }
  cartTotal();
}

function buildHero(){
  const carousel = $("#heroCarousel");
  const dots = $("#heroDots");
  dots.innerHTML = "";
  carousel.innerHTML = "";

  heroSlides.forEach((s, i)=>{
    const p = products.find(x=>x.id===s.id);
    if(!p) return;

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.index = String(i);
    slide.innerHTML = `
      <div class="slide__img" style="background-image:url('${p.img}')"></div>
      <div class="slide__info">
        <div class="pill">${s.pill}</div>
        <div class="slide__name">${p.title}</div>
        <div class="slide__desc">${p.desc}</div>
        <div class="priceRow">
          <div class="price mono">${formatSAR(p.price)}</div>
          <button class="btn btn--primary" data-buy>شراء</button>
        </div>
      </div>
    `;
    slide.querySelector("[data-buy]").onclick = ()=> addToCart(p.id, 1);
    carousel.appendChild(slide);

    const d = document.createElement("button");
    d.className = "dotbtn";
    d.setAttribute("aria-label", `انتقل إلى الشريحة ${i+1}`);
    d.onclick = ()=> setHero(i);
    dots.appendChild(d);
  });

  setHero(0);
  startHeroAuto();
}

function setHero(i){
  const slides = $$(".slide", $("#heroCarousel"));
  if(slides.length === 0) return;
  state.heroIndex = (i + slides.length) % slides.length;

  slides.forEach(s=>{
    s.style.display = (Number(s.dataset.index) === state.heroIndex) ? "grid" : "none";
  });

  const dots = $$(".dotbtn", $("#heroDots"));
  dots.forEach((d, idx)=> d.setAttribute("aria-current", idx===state.heroIndex ? "true" : "false"));
}

function startHeroAuto(){
  clearInterval(state.heroTimer);
  state.heroTimer = setInterval(()=> setHero(state.heroIndex + 1), 5000);
}

function renderFeatured(){
  const rail = $("#featuredRail");
  rail.innerHTML = "";
  const list = products.slice(0, 7);

  list.forEach(p=>{
    const card = document.createElement("div");
    card.className = "featureCard";
    card.dataset.type = p.type;
    card.innerHTML = `
      <div class="featureCard__img" style="background-image:url('${p.img}')"></div>
      <div class="featureCard__body">
        <div>
          <div class="featureCard__t">${p.title}</div>
          <div class="featureCard__m">${p.desc}</div>
        </div>
        <div class="tag mono">${formatSAR(p.price)}</div>
      </div>
    `;
    card.onclick = ()=> { setQuickModal(p); openModal(); };
    rail.appendChild(card);
  });
}

function renderGrid(){
  const grid = $("#productGrid");
  grid.innerHTML = "";

  const filtered = products
    .filter(p => state.filter === "all" ? true : p.type === state.filter)
    .filter(p => {
      const q = state.q.trim().toLowerCase();
      if(!q) return true;
      return (p.title + " " + p.desc).toLowerCase().includes(q);
    });

  const sorted = filtered.sort((a,b)=>{
    switch(state.sort){
      case "price_asc": return a.price - b.price;
      case "price_desc": return b.price - a.price;
      case "new": return b.new - a.new;
      case "popular":
      default: return b.popular - a.popular;
    }
  });

  if(sorted.length === 0){
    grid.innerHTML = `<div class="muted" style="grid-column:1/-1;padding:12px;">لا توجد نتائج… جرّب كلمة أخرى.</div>`;
    return;
  }

  sorted.forEach(p=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card__img" style="background-image:url('${p.img}')">
        ${p.off ? `<div class="card__badge">خصم ${p.off}%</div>` : ""}
      </div>
      <div class="card__body">
        <div class="card__title">${p.title}</div>
        <div class="card__desc">${p.desc}</div>
        <div class="card__row">
          <div class="price mono">${formatSAR(p.price)}</div>
          <button class="pill" data-quick>عرض سريع</button>
        </div>
        <div class="card__actions">
          <button class="btn btn--primary" data-add>إضافة للسلة</button>
          <button class="fav" aria-pressed="false" aria-label="مفضلة">♥</button>
        </div>
      </div>
    `;

    card.querySelector("[data-add]").onclick = ()=> addToCart(p.id, 1);
    card.querySelector("[data-quick]").onclick = ()=> { setQuickModal(p); openModal(); };
    const fav = card.querySelector(".fav");
    fav.onclick = ()=> {
      const pressed = fav.getAttribute("aria-pressed") === "true";
      fav.setAttribute("aria-pressed", pressed ? "false" : "true");
      toast(pressed ? "تمت الإزالة من المفضلة" : "تمت الإضافة للمفضلة");
    };

    grid.appendChild(card);
  });
}

function wireUI(){
  $("#year").textContent = String(new Date().getFullYear());
  applyTheme();
  saveCart();

  // search
  $("#q").addEventListener("input", (e)=>{
    state.q = e.target.value;
    renderGrid();
  });
  $("#clearSearch").onclick = ()=>{
    $("#q").value = "";
    state.q = "";
    renderGrid();
    $("#q").focus();
  };

  // filters
  $$(".sectionHead__right [data-filter]").forEach(btn=>{
    btn.onclick = ()=>{
      const f = btn.dataset.filter;
      state.filter = f === "games" ? "games" : f === "subs" ? "subs" : f === "cards" ? "cards" : "all";
      $$(".sectionHead__right [data-filter]").forEach(b=> b.classList.remove("isActive"));
      btn.classList.add("isActive");
      renderGrid();
      renderFeaturedFilter();
    };
  });

  // sort
  $("#sort").addEventListener("change", (e)=>{
    state.sort = e.target.value;
    renderGrid();
  });

  // hero controls
  $("#prevHero").onclick = ()=> { setHero(state.heroIndex - 1); startHeroAuto(); };
  $("#nextHero").onclick = ()=> { setHero(state.heroIndex + 1); startHeroAuto(); };

  // theme
  $("#themeToggle").onclick = ()=>{
    state.theme = (state.theme === "light") ? "dark" : "light";
    applyTheme();
    toast(state.theme === "light" ? "وضع فاتح" : "وضع داكن");
  };

  // cart drawer
  $("#openCart").onclick = ()=> openDrawer("cart");
  $$(".drawer [data-close]").forEach(x=> x.onclick = ()=> closeDrawer("cart"));

  // modal close
  $$(".modal [data-close]").forEach(x=> x.onclick = ()=> closeModal());
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape"){
      closeModal();
      closeDrawer("cart");
    }
  });

  // coupon
  $("#copyCoupon").onclick = async ()=>{
    try{
      await navigator.clipboard.writeText("NEO15");
      toast("تم نسخ الكوبون ✅");
    }catch{
      toast("انسخه يدويًا: NEO15");
    }
  };

  // checkout (محاكاة)
  $("#checkout").onclick = ()=>{
    if(state.cart.length === 0) return toast("السلة فارغة");
    toast("محاكاة: الانتقال للدفع…");
  };

  // quick tour
  $("#openQuickTour").onclick = ()=>{
    toast("جرّب: ابحث، ثم افتح عرض سريع، ثم أضف للسلة.");
    document.location.hash = "#catalog";
    setTimeout(()=> $("#q").focus(), 400);
  };
}

function renderFeaturedFilter(){
  const f = state.filter;
  $$(".featureCard", $("#featuredRail")).forEach(card=>{
    const t = card.dataset.type;
    card.style.display = (f === "all" || f === t) ? "" : "none";
  });
}

function initCountdown(){
  // عداد حتى نهاية اليوم
  const el = $("#countdown");
  const tick = ()=>{
    const now = new Date();
    const end = new Date();
    end.setHours(23,59,59,999);
    const ms = Math.max(0, end - now);
    const h = Math.floor(ms / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    const s = Math.floor((ms % 6e4) / 1000);
    el.textContent = `ينتهي خلال ${h}س ${m}د ${s}ث`;
  };
  tick();
  setInterval(tick, 1000);
}

function boot(){
  wireUI();
  buildHero();
  renderFeatured();
  renderGrid();
  initCountdown();
}

boot();
