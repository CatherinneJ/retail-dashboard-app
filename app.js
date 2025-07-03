const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cart-items');
const totalPriceSpan = document.getElementById('total-price');
const detailsSection = document.getElementById('product-details');
const detailsContent = document.getElementById('details-content');
const heading = document.querySelector('#product-gallery h2');

let allProducts = [];
let cart = [];

// Sales chart global instance
let salesChart = null;
let selectedCategory = 'all';

async function loadProducts() {
  const res = await fetch('/api/products');
  if (!res.ok) {
    console.error('Failed to load products:', res.status);
    return;
  }
  const products = await res.json();
  allProducts = products;
  renderProducts(products);
  fillCategories(products); // Restore category menu
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

    const imageSrc = Array.isArray(product.image) ? product.image[0] : product.image;
    const fullSrc = imageSrc.startsWith('/images/') ? imageSrc : `/images/${imageSrc}`;

    const img = document.createElement('img');
    img.src = fullSrc;
    img.alt = product.name;
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => showDetails(product.id));

    const title = document.createElement('h3');
    title.textContent = product.name;

    const price = document.createElement('p');
    price.innerHTML = `<strong>${product.price.toFixed(2)} €</strong>`;

    const button = document.createElement('button');
    button.textContent = 'Add to cart';
    button.addEventListener('click', () => addToCart(product.id));

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(button);

    gallery.appendChild(card);
  });
}

function fillCategories(products) {
  const categoryMenu = document.getElementById('category-menu');
  if (!categoryMenu) return;

  const categories = ['all', ...new Set(products.map(p => p.category))];
  categoryMenu.innerHTML = '';

  categories.forEach(category => {
    const li = document.createElement('li');
    li.dataset.category = category;
    li.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    li.addEventListener('click', (e) => {
      selectedCategory = e.target.dataset.category;
      document.getElementById('category-button').textContent = `${e.target.textContent} ▼`;
      categoryMenu.classList.add('hidden');
      filterProducts(selectedCategory);
    });
    categoryMenu.appendChild(li);
  });
}

function filterProducts(category) {
  const buttons = document.querySelectorAll('.filter-button');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = Array.from(buttons).find(btn => btn.getAttribute('data-category') === category); 
  if (activeBtn) activeBtn.classList.add('active');

  if (category === 'all') {
    renderProducts(allProducts);
    if (heading) heading.textContent = 'All products';
  } else {
    const filtered = allProducts.filter(p => p.category === category);
    renderProducts(filtered);
    if (heading) heading.textContent =
      filtered[0]?.category.charAt(0).toUpperCase() + filtered[0]?.category.slice(1) || 'Products';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
    renderSalesChart();

  const categoryButton = document.getElementById('category-button');
  if (categoryButton) {
    categoryButton.textContent = 'All ▼';
    categoryButton.addEventListener('click', () => {
      document.getElementById('category-menu').classList.toggle('hidden');
    });
  }
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.getAttribute('data-category');
      filterProducts(category);
    });
  });

const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', checkout);
  }

  const searchBtn = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');
  if (searchBtn) searchBtn.addEventListener('click', handleSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
  window.toggleCart = function () {
    const cart = document.getElementById('cart');
    cart.classList.toggle('hidden');
  };
});


async function showDetails(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error(`Product not found: ${res.status}`);
    const product = await res.json();

    const reviewsRes = await fetch('/api/reviews');
    if (!reviewsRes.ok) throw new Error(`Reviews not found: ${reviewsRes.status}`);
    const allReviews = await reviewsRes.json();
    const reviews = allReviews.filter(r => r.productId === id);

    const sentimentRes = await fetch('/api/keywords');
    if (!sentimentRes.ok) throw new Error(`Sentiment not found: ${sentimentRes.status}`);
    const sentimentStats = await sentimentRes.json();

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'No rating';

     const salesRes = await fetch(`/api/sales/${id}`);

    const salesData = salesRes.ok ? await salesRes.json() : null;

    console.log('Loading details for product ID:', id);

    const modal = document.getElementById('product-modal');
    const modalDetails = document.getElementById('modal-details');

    const imageGallery = Array.isArray(product.image)
      ? product.image.map(img => `<img src="${img.startsWith('/images/') ? img : `/images/${img}`}"
        alt="${product.name}" style="width: 120px; margin: 0.3rem;">`).join('')
      : `<img src="${product.image.startsWith('/images/') ? product.image : `/images/${product.image}`}" alt="${product.name}" style="width: 120px;">`;

    modalDetails.innerHTML = `
      <div class="product-detail-wrapper">
        <div class="detail-images">
          ${imageGallery}
        </div>
        <div class="detail-info">
          <h3>${product.name}</h3>
          <p class="description-product">${product.description}</p>
          <p class="description-price"><strong>Price:</strong> ${product.price.toFixed(2)} €</p>
          <p class="description-product"><strong>In Stock:</strong> ${product.stock}</p>
          <p class="description-product"><strong>Average Rating:</strong> ${avgRating}</p>

          <h4>Reviews Analysis:</h4>
          <p class="description-product">👍 Pozitive mentions: ${sentimentStats.pozitive}</p>
          <p class="description-product">👎 Negative mentions: ${sentimentStats.negative}</p>

          <div class="reviews-info">
          <h4>Reviews:</h4>
          <ul class="description-product">
            ${reviews.map(r => `<li>${r.rating}⭐ – ${r.comment}</li>`).join('')}
          </ul>

          <label><strong>Your review:</strong><br>
            <select id="rating">
              <option value="1">1⭐</option>
              <option value="2">2⭐</option>
              <option value="3">3⭐</option>
              <option value="4">4⭐</option>
              <option value="5">5⭐</option>
            </select>
            </div>
            <textarea id="comment" rows="3" placeholder="Comment..."></textarea>
            <button id="submit-review">Submit</button>
          </label>

          <h4>Sales chart</h4>
          <canvas id="sales-chart" width="400" height="200"></canvas>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    document.getElementById('close-modal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    if (salesData) {
      const canvas = document.getElementById('sales-chart');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (salesChart) salesChart.destroy();

      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgb(190, 32, 185)');
      gradient.addColorStop(1, 'rgb(242, 50, 88)');

  salesData.datasets[0].backgroundColor = gradient;

        salesChart = new Chart(ctx, {
          type: 'bar',
          data: salesData,
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });
      }
    }

     document.getElementById('close-modal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    document.getElementById('submit-review').addEventListener('click', () => submitReview(product.id));
  } catch (err) {
    console.error('Failed to show product details:', err);
  }
}

async function submitReview(productId) {
  const rating = parseInt(document.getElementById('rating').value);
  const comment = document.getElementById('comment').value;
  try {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, comment })
    });
    alert('Thank you for review!');
    showDetails(productId);
  } catch (err) {
    console.error('Failed to submit review:', err);
  }
}

async function addToCart(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error(`Product not found: ${res.status}`);
    const product = await res.json();
    if (product.stock <= 0) return alert('The product is out of stock');

    const existing = cart.find(item => item.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, name: product.name, price: product.price, image: product.image, qty: 1 });
    
    console.log('Cart content after adding:', cart);

    updateCart();
  } catch (err) {
    console.error('Failed to add to cart:', err);

  }
}

function updateCart() {
  console.log('Updating cart with items:', cart);
  cartItemsContainer.innerHTML = '';
  let total = 0;


  cart.forEach(item => {
    total += item.price * item.qty;

    const li = document.createElement('li');
    li.classList.add('cart-item');
  
    const img = document.createElement('img');
    const imageSrc = Array.isArray(item.image) ? item.image[0] : item.image;
img.src = imageSrc.startsWith('/images/') ? imageSrc : `/images/${imageSrc}`;
    img.alt = item.name;
    img.style.setProperty('width', '60px', 'important');
img.style.setProperty('height', '60px', 'important');
img.style.setProperty('object-fit', 'cover', 'important');


      console.log('Obrázok v košíku:', img.src);


    const name = document.createElement('span');
    name.textContent = item.name;
  
    const qtySelect = document.createElement('select');
    for (let i = 1; i <= 10; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      if (i === item.qty) option.selected = true;
      qtySelect.appendChild(option);
    }
    qtySelect.addEventListener('change', (e) => {
      item.qty = parseInt(e.target.value);
      updateCart();
    });

    const price = document.createElement('span');
    price.textContent = ` = ${(item.price * item.qty).toFixed(2)} €`;

     const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.addEventListener('click', () => removeFromCart(item.id));


    li.appendChild(img);
    li.appendChild(name);
    li.appendChild(qtySelect);
    li.appendChild(price);
    li.appendChild(removeBtn);

    cartItemsContainer.appendChild(li);
  });

  totalPriceSpan.textContent = total.toFixed(2) + ' €';

 const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountElement.textContent = count;
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCart();
}

async function checkout() {
  if (cart.length === 0) return alert('The basket is empty.');
  try {
    await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart })
    });

     const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    if (salesChart && salesChart.data && salesChart.data.datasets.length > 0) {
      salesChart.data.datasets[0].data[salesChart.data.datasets[0].data.length - 1] += total;
      salesChart.update();
    }

    cart = [];
    updateCart();
    alert('The purchase was successful!');
    loadProducts();
  } catch (err) {
    console.error('Checkout failed:', err);
  }
}
async function renderSalesChart() {
  const res = await fetch('/api/sales');
  if (!res.ok) return;
  const salesData = await res.json();

console.log("Sales data:", salesData);
console.log("Canvas:", document.getElementById('dashboard-sales-chart'));


  const ctx = document.getElementById('dashboard-sales-chart').getContext('2d');
  if (salesChart) salesChart.destroy(); // destroy previous chart
  salesChart = new Chart(ctx, {
    type: 'line', 
    data: salesData,
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

document.getElementById('search-button').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
  const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
  const filtered = allProducts.filter(product => {
    const matchesName = product.name.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesName && matchesCategory;
  });

  renderProducts(filtered);
  heading.textContent = `Search results: ${searchTerm || 'All'}`;
}
