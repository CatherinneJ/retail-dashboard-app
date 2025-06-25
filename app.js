const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cart-items');
const totalPriceSpan = document.getElementById('total-price');
const detailsSection = document.getElementById('product-details');
const detailsContent = document.getElementById('details-content');
const heading = document.querySelector('#product-gallery h2');

let allProducts = [];
let cart = [];

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  allProducts = products;
  renderProducts(products);
}

function renderProducts(products) {
  const gallery = document.getElementById('products');
  gallery.innerHTML = '';

   if (products.length === 0) {
    gallery.innerHTML = '<p>No products were found in this category.</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p><strong>${product.price.toFixed(2)} €</strong></p>
      <button onclick="addToCart('${product.id}')">Add to cart</button>
    `;
    gallery.appendChild(card);
  });
}

function filterProducts(category) {
  const buttons = document.querySelectorAll('.filter-button');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = Array.from(buttons).find(btn => btn.textContent.toLowerCase().includes(category));
  if (activeBtn) activeBtn.classList.add('active');

  if (category === 'all') {
    renderProducts(allProducts);
    if (heading) heading.textContent = 'All products';
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    renderProducts(filtered);
    if (heading) heading.textContent = filtered[0]?.category.charAt(0).toUpperCase() + filtered[0]?.category.slice(1) || 'Products';
  }
}

async function showDetails(id) {
  const res = await fetch(`/api/products/${id}`);
  const product = await res.json();
  const reviewsRes = await fetch('/data/reviews.json');
  const allReviews = await reviewsRes.json();
  let reviews = allReviews.filter(r => r.productId === id);

   const keywords = {
    pozitive: ['skvelý', 'vynikajúci', 'super', 'odporúčam', 'dobrý', 'kvalitný'],
    negative: ['bad', 'sklamanie', 'broken', 'nekvalitný', 'nefunguje', 'slabý']
  };

    reviews.forEach(({ comment }) => {
    const lower = comment.toLowerCase();
    keywords.pozitive.forEach(word => {
      if (lower.includes(word)) sentimentStats.pozitive++;
    });
    keywords.negative.forEach(word => {
      if (lower.includes(word)) sentimentStats.negative++;
    });
  });

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'No rating';

  detailsSection.classList.remove('hidden');
  const imageGallery = Array.isArray(product.images)
  ? product.images.map(img => `<img src="${img}" alt="${product.name}" style="width: 120px; margin: 0.3rem;">`).join('')
  : `<img src="${product.image}" alt="${product.name}" style="width: 120px;">`;

  detailsContent.innerHTML = `
    <h3>${product.name}</h3>
    <p><strong>Obrázky:</strong><br>${imageGallery}</p>
    <p>${product.description}</p>
    <p><strong>Price:</strong> ${product.price.toFixed(2)} €</p>
    <p><strong>In Stock:</strong> ${product.stock}</p>
    <p><strong>Average Rating:</strong> ${avgRating}</p>

     <h4>Analysis reviews:</h4>
    <p>👍 Pozitive mentions: ${sentimentStats.pozitive}</p>
    <p>👎 Negative mentions: ${sentimentStats.negative}</p>

    <h4>Reviews:</h4>
    <ul>
      ${reviews.map(r => `<li>${r.rating}★ – ${r.comment}</li>`).join('')}
    </ul>
    <label>Your review:<br>
      <select id="rating">
        <option value="1">1★</option>
        <option value="2">2★</option>
        <option value="3">3★</option>
        <option value="4">4★</option>
        <option value="5">5★</option>
      </select>
      <textarea id="comment" rows="3" placeholder="Comment..."></textarea>
      <button onclick="submitReview('${product.id}')">Submit</button>
    </label>
  `;
}

async function submitReview(productId) {
  const rating = parseInt(document.getElementById('rating').value);
  const comment = document.getElementById('comment').value;
  await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, rating, comment })
  });
  alert('Thank you for review!');
  showDetails(productId);
}

async function addToCart(id) {
  const res = await fetch(`/api/products/${id}`);
  const product = await res.json();
  if (product.stock <= 0) return alert('The product is out of stock');

  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, name: product.name, price: product.price, qty: 1 });

  updateCart();
}

function updateCart() {
  cartItemsContainer.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement('li');
    li.innerHTML = `${item.name} – ${item.qty} ks = ${(item.price * item.qty).toFixed(2)} € <button onclick="removeFromCart('${item.id}')">✖</button>`;
    cartItemsContainer.appendChild(li);
  });

  totalPriceSpan.textContent = total.toFixed(2) + ' €';
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

async function checkout() {
  if (cart.length === 0) return alert('The basket is empty.');
  await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart })
  });
  cart = [];
  updateCart();
  alert('The purchase was successful!');
  loadProducts();
}

loadProducts();
