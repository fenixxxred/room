/* ================================
   ESTADO GLOBAL
================================ */
let cart = JSON.parse(localStorage.getItem('cart_redroom')) || [];
let currentProduct = null;
let q = 1;

/* ================================
   COMPONENTE DE CARD
================================ */
function getBadgeHTML(p){
  if(p.badge === 'novo'){
    return `<div class="badge badge-novo">Novo</div>`;
  }
  return '';
}

const DISCOUNT_RULES = [
  {
    percent: 29,
    ids: [1, 5, 7, 18, 45]
  },
  {
    percent: 22,
    ids: [2, 14, 16, 35, 27, 81, 75, 105]
  }
  // você pode adicionar quantos grupos quiser
];

function getFinalPrice(p){
  const rule = DISCOUNT_RULES.find(r => r.ids.includes(p.id));

  if(!rule) return p.price; // sem desconto

  return p.price - (p.price * rule.percent / 100);
}

function getDiscountPercent(p){
  const rule = DISCOUNT_RULES.find(r => r.ids.includes(p.id));
  return rule ? rule.percent : 0;
}

function productCardHTML(p) {

  return `
    <div class="product-card">

      ${getBadgeHTML(p)}

      <img src="${p.img}" alt="${p.title}">

      <div class="product-info">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>

          <div class="price">
            
            ${DISCOUNT_RULES.some(r => r.ids.includes(p.id)) ? `
              <span class="old-price">
                R$ ${p.price.toFixed(2)}
              </span>
            ` : ''}
            ${getDiscountPercent(p) ? `
              <span class="discount-tag">
                -${getDiscountPercent(p)}% OFF
              </span><br>
            ` : ''}

            <span class="new-price">
              R$ ${getFinalPrice(p).toFixed(2)}
            </span>
          </div>
        <div class="actions">
          <button class="buy" onclick="addToCart(${p.id})">Comprar</button>
          <button class="view" onclick="openModal(${p.id})">Ver</button>
        </div>
      </div>
    </div>
  `;
}

/* ================================
   PRODUTOS EM DESTAQUE
================================ */
function renderFeaturedProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  products
    .filter(p => p.featured)
    .forEach(p => grid.innerHTML += productCardHTML(p));
}

/* ================================
   MAIS PRODUTOS (VER MAIS)
================================ */
const PRODUCTS_PER_PAGE = 10;
let currentPage = 1;

function renderMoreProducts() {
  const grid = document.getElementById('productsMoreGrid');
  if (!grid) return;

  const normalProducts = products.filter(p => !p.featured);
  const end = currentPage * PRODUCTS_PER_PAGE;
  const visible = normalProducts.slice(0, end);

  grid.innerHTML = '';
  visible.forEach(p => grid.innerHTML += productCardHTML(p));

  const btn = document.getElementById('loadMoreBtn');
  if (btn && end >= normalProducts.length) {
    btn.style.display = 'none';
  }
}

/* ================================
   BOTÃO VER MAIS
================================ */
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderMoreProducts();
  });
}

/* ================================
   CARRINHO
================================ */
function addToCart(id, qty = 1, variant = null){
  const cartId = variant ? `${id}-${variant}` : `${id}`;

  const found = cart.find(i => i.cartId === cartId);

  if(found){
    found.qty += qty;
  } else {
    cart.push({ cartId, id, qty, variant });
  }

  saveCart();
}



function saveCart() {
  localStorage.setItem('cart_redroom', JSON.stringify(cart));
  renderCart();
}

function removeItem(cartId){
  cart = cart.filter(item => item.cartId !== cartId);
  saveCart();
}

function renderCart() {
  const box = document.getElementById('cartItems');
  if (!box) return;

  box.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return;

    const price = item.price ?? getFinalPrice(p);
    const subtotal = price * item.qty;
    total += subtotal;

    box.innerHTML += `
      <div class="cart-item">
        <img src="${p.img}">
        <div class="cart-info">
          <strong>${p.title}</strong>
          ${item.variant ? `<small>Variação: ${item.variant}</small>` : ''}
          <small>Qtd: ${item.qty}</small>
          <div class="cart-subtotal">
            <b>R$ ${subtotal.toFixed(2)}</b>
          </div>
        </div>

        <button class="remove-item" onclick="removeItem('${item.cartId}')">
          <i class='bx bx-trash'></i>
        </button>
      </div>
    `;
  });

  document.getElementById('cartTotal').textContent = total.toFixed(2);
  document.getElementById('cartCount').textContent =
    cart.reduce((s, i) => s + i.qty, 0);
}

function openCart() {
  document.getElementById('cartModal').classList.add('active');
}

function closeCart() {
  document.getElementById('cartModal').classList.remove('active');
}

/* ================================
   MODAL DE PRODUTO
================================ */
let variantQty = {};

function changeVariantQty(name, delta){
  variantQty[name] += delta;
  if(variantQty[name] < 0) variantQty[name] = 0;

  document.getElementById(`qty-${name}`).textContent = variantQty[name];
}

function swapImg(el){
  const main = document.getElementById('mainImg');
  if(!main) return;

  main.src = el.src;

  document
    .querySelectorAll('.thumbs img')
    .forEach(img => img.classList.remove('active'));

  el.classList.add('active');
}

function selectVariant(name){
  if(currentProduct.variantImages?.[name]){
    document.getElementById('mainImg').src =
      currentProduct.variantImages[name][0];
  }
}

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;


  const hasVariants = p.variants && p.variants.length > 0;

  currentProduct = p;
  q = 1;

carouselIndex = 0;

  variantQty = {};
  if (hasVariants) {
    p.variants.forEach(v => variantQty[v.name] = 0);
  }

  document.getElementById('modalProduct').innerHTML = `

    <div class="modal-top">

<div class="left-col">

  <!-- DESKTOP -->
  <div class="thumbs desktop-only">
    ${(p.images && p.images.length ? p.images : [p.img]).map((img, i) => `
      <img 
        src="${img}"
        onclick="swapImg(this)"
        class="${i === 0 ? 'active' : ''}"
      >
    `).join('')}
  </div>

  <div class="gallery desktop-only">
    <img id="mainImg" src="${(p.images?.[0] || p.img)}">
  </div>

  <!-- MOBILE -->
  <div class="mobile-carousel mobile-only">
    <button class="carousel-btn prev" onclick="carouselPrev()">‹</button>
    <img id="carouselImg" src="${(p.images?.[0] || p.img)}">
    <button class="carousel-btn next" onclick="carouselNext()">›</button>
  </div>

</div>


      <div class="right-col">
        <h1>${p.title}</h1>

        <div class="prices">
          ${getDiscountPercent(p) ? `
            <div>
              <span class="old-price">R$ ${p.price.toFixed(2)}</span>
              <span class="discount-tag">
                -${getDiscountPercent(p)}% OFF
              </span>
            </div>
          ` : ''}

          <span class="new-price">
            R$ ${getFinalPrice(p).toFixed(2)}
          </span>
        </div>
        <div class="buy-actions">
          <button class="buy" onclick="addFromModal()">Adicionar</button>
          <button class="whats" onclick="whats()">
            <i class='bx bxl-whatsapp'></i>
            WhatsApp
          </button>
        </div>
        ${hasVariants ? `
          
          <div class="variants">
          <h4>Escolha o sabor</h4>
            ${p.variants.map(v => `
              <div class="variant-item">
                <span>${v.name}</span>
                <div class="qty">
                  <span id="qty-${v.name}">0</span>
                  <button onclick="changeVariantQty('${v.name}', -1)">−</button>
                  <button onclick="changeVariantQty('${v.name}', 1)">+</button>
                </div>
              </div>
            `).join('')}
          </div>
          
        ` : `
          <div class="qty">
            <button onclick="qtyChange(-1)">−</button>
            <span id="qtd">1</span>
            <button onclick="qtyChange(1)">+</button>
          </div>
        `}

      </div>
    </div>
    
    <div class="modal-bottom">
      <div class="modal-block">
        <h3>Descrição</h3>
        <p>${p.desc}</p>
      </div>
    </div>
  `;

  document.getElementById('productModal').classList.add('active');
}

function closeModal(){
  const modal = document.getElementById('productModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}


let carouselIndex = 0;

function getCarouselImages(){
  return currentProduct.images?.length
    ? currentProduct.images
    : [currentProduct.img];
}

function updateCarousel(){
  const imgs = getCarouselImages();
  const el = document.getElementById('carouselImg');
  if(el) el.src = imgs[carouselIndex];
}

function carouselNext(){
  const imgs = getCarouselImages();
  carouselIndex = (carouselIndex + 1) % imgs.length;
  updateCarousel();
}

function carouselPrev(){
  const imgs = getCarouselImages();
  carouselIndex =
    (carouselIndex - 1 + imgs.length) % imgs.length;
  updateCarousel();
}


/* ================================
   QUANTIDADE MODAL
================================ */
function qtyChange(v) {
  q += v;
  if (q < 1) q = 1;
  document.getElementById('qtd').textContent = q;
}

function addFromModal(){
  const p = currentProduct;

  if(p.variants?.length){
    Object.entries(variantQty).forEach(([name, qty]) => {
      if(qty > 0){
        const cartId = `${p.id}-${name}`;

        const found = cart.find(i => i.cartId === cartId);
        if(found){
          found.qty += qty;
        } else {
          cart.push({
            cartId,
            id: p.id,
            title: p.title,
            variant: name,
            price: getFinalPrice(p),
            qty
          });
        }
      }
    });
  } else {
    const cartId = `${p.id}`;

    const found = cart.find(i => i.cartId === cartId);
    if(found){
      found.qty += q;
    } else {
      cart.push({
        cartId,
        id: p.id,
        title: p.title,
        price: getFinalPrice(p),
        qty: q
      });
    }
  }

  saveCart();
  closeModal();
}

function scrollCats(dir){
  const el = document.getElementById('categories');
  const scrollAmount = 260; // distância por clique
  el.scrollBy({ left: scrollAmount * dir, behavior: 'smooth' });
}

/* ================================
   WHATSAPP
================================ */
function whats() {
  const msg = `Olá, tenho interesse no produto ${currentProduct.title} (Qtd: ${q})`;
  window.open(
    `https://wa.me/5564993286584?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

/* ================================
   FILTRO POR CATEGORIA
================================ */
function filterCat(cat) {
  const grid = document.getElementById('productsMoreGrid');
  if (!grid) return;

  const list =
    cat === 'all'
      ? products.filter(p => !p.featured)
      : products.filter(p => p.cat === cat && !p.featured);

  grid.innerHTML = '';
  list.forEach(p => grid.innerHTML += productCardHTML(p));
}

/* ================================
   BUSCA
================================ */
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', e => {
    const v = e.target.value.toLowerCase();
    const result = products.filter(
      p => p.title.toLowerCase().includes(v) && !p.featured
    );

    const grid = document.getElementById('productsMoreGrid');
    grid.innerHTML = '';
    result.forEach(p => grid.innerHTML += productCardHTML(p));
  });
}

/* ================================
   CHECKOUT
================================ */
function checkout() {
  let msg = 'Pedido Red Room:%0A';

  cart.forEach(i => {
    const p = products.find(x => x.id === i.id);
    if (p) msg += `${p.title} x${i.qty}%0A`;
  });

  window.open(
    `https://wa.me/556464993286584?text=${msg}`,
    '_blank'
  );
}

document.getElementById('year').textContent = new Date().getFullYear();
/* ================================
   INIT
================================ */
renderFeaturedProducts();
renderMoreProducts();
renderCart();