// script.js - front-end demo logic (no backend)
(() => {
  // Demo data (in a real app these come from an API)
  const SAMPLE_RESTAURANTS = [
    {
      id: 'r1',
      name: 'Mama Rosa Pizzeria',
      cuisine: 'Italian',
      rating: 4.6,
      photo: 'img/pizza.jpg',
      desc: 'Cozy pizza spot with wood-fired pies.'
    },
    {
      id: 'r2',
      name: 'Spice House',
      cuisine: 'Indian',
      rating: 4.4,
      photo: 'img/indian.jpg',
      desc: 'Vibrant curries and an affordable lunch menu.'
    },
    {
      id: 'r3',
      name: 'Green Spoon',
      cuisine: 'Vegan',
      rating: 4.7,
      photo: 'img/vegan.jpg',
      desc: 'Healthy bowls and seasonal salads.'
    }
  ];

  // Helpers
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // LocalStorage keys
  const LS_USERS = 'rmb_users';
  const LS_CURRENT = 'rmb_current_user';
  const LS_RESTAURANTS = 'rmb_restaurants';
  const LS_REVIEWS = 'rmb_reviews';

  // Ensure sample data present
  if (!localStorage.getItem(LS_RESTAURANTS)) {
    localStorage.setItem(LS_RESTAURANTS, JSON.stringify(SAMPLE_RESTAURANTS));
  }
  if (!localStorage.getItem(LS_REVIEWS)) {
    localStorage.setItem(LS_REVIEWS, JSON.stringify({})); // map restId -> array of reviews
  }

  // auth utilities (demo)
  function getUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
  function saveUser(u){ const arr = getUsers(); arr.push(u); localStorage.setItem(LS_USERS, JSON.stringify(arr)); }
  function setCurrentUser(u){ localStorage.setItem(LS_CURRENT, JSON.stringify(u)); updateNavForAuth(); }
  function getCurrentUser(){ return JSON.parse(localStorage.getItem(LS_CURRENT) || 'null'); }
  function logout(){ localStorage.removeItem(LS_CURRENT); updateNavForAuth(); }

  // NAV auth buttons behavior
  function updateNavForAuth(){
    const u = getCurrentUser();
    $$('.logout-btn').forEach(el => el.classList.toggle('hidden', !u));
    $$('.login-btn').forEach(el => el.classList.toggle('hidden', !!u));
  }
  // Hook nav login buttons to redirect
  $$('.login-btn').forEach(btn => btn.addEventListener('click', () => location.href = 'login.html'));

  $$('.logout-btn').forEach(btn => btn.addEventListener('click', () => { logout(); alert('Logged out'); location.href = 'index.html'; }));

  document.addEventListener('DOMContentLoaded', () => {
    updateNavForAuth();
    initPages();
  });

  // Page init logic based on path
  function initPages(){
    const path = location.pathname.split('/').pop();
    if (path === '' || path === 'index.html') {
      // index page - wire search redirect
      const globalSearch = $('#global-search');
      if (globalSearch){
        globalSearch.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            localStorage.setItem('rmb_search_query', globalSearch.value.trim());
            location.href = 'restaurants.html';
          }
        });
      }
    }

    if (path === 'restaurants.html') {
      renderRestaurantList();
      const filterInput = $('#filter-cuisine');
      filterInput && filterInput.addEventListener('input', renderRestaurantList);
      $('#sort-by') && $('#sort-by').addEventListener('change', renderRestaurantList);
      setupModal();
      // pre-fill filter from index search
      const q = localStorage.getItem('rmb_search_query');
      if (q && $('#filter-cuisine')) {
        $('#filter-cuisine').value = q;
        localStorage.removeItem('rmb_search_query');
        renderRestaurantList();
      }
    }

    if (path === 'login.html') {
      const form = $('#login-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const users = getUsers();
        const found = users.find(u => u.email === email && u.password === password);
        if (found) {
          setCurrentUser({name: found.name, email: found.email, role: found.role || 'user'});
          alert('Login successful');
          location.href = 'index.html';
        } else {
          alert('Invalid credentials (demo). Try signing up.');
        }
      });
    }

    if (path === 'signup.html') {
      const form = $('#signup-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#signup-name').value.trim();
        const email = $('#signup-email').value.trim();
        const password = $('#signup-password').value;
        if (!name || !email || password.length < 6) {
          alert('Please complete the form and choose a password with at least 6 characters.');
          return;
        }
        // prevent duplicate emails
        const users = getUsers();
        if (users.find(u => u.email === email)) {
          alert('An account with that email already exists.');
          return;
        }
        const newUser = { name, email, password, role: 'user' };
        saveUser(newUser);
        setCurrentUser({ name, email, role: 'user' });
        alert('Account created. You are now logged in (demo).');
        location.href = 'index.html';
      });
    }

    if (path === 'admin.html') {
      // minimal admin interactions for demo
      const form = document.getElementById('admin-add-form');
      form && form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-name').value.trim();
        const cuisine = document.getElementById('admin-cuisine').value.trim();
        if (!name) { alert('Provide a name'); return; }
        const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
        const id = 'r' + (Date.now());
        list.push({ id, name, cuisine, rating: 4.0, photo: 'img/placeholder.jpg', desc: 'Admin added (demo).' });
        localStorage.setItem(LS_RESTAURANTS, JSON.stringify(list));
        renderAdminList();
        form.reset();
      });
      renderAdminList();
    }
  }

  /* ----------------------------
     Restaurants list & modal
     ----------------------------*/
  function renderRestaurantList(){
    const container = $('#restaurant-list');
    if (!container) return;
    const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
    const q = (document.getElementById('filter-cuisine')?.value || '').toLowerCase();
    const sortBy = document.getElementById('sort-by')?.value || 'rating';

    let filtered = list.filter(r => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (r.cuisine || '').toLowerCase().includes(q);
    });

    filtered.sort((a,b) => {
      if (sortBy === 'rating') return (b.rating||0) - (a.rating||0);
      return 0;
    });

    container.innerHTML = filtered.map(r => `
      <article class="restaurant-card glass" data-id="${r.id}">
        <img src="${r.photo}" alt="${r.name}" />
        <div class="restaurant-meta">
          <h3 class="restaurant-title">${r.name}</h3>
          <div class="muted">${r.cuisine || 'Various'} • ${r.rating?.toFixed(1) || '—'} ★</div>
          <p class="restaurant-desc">${r.desc || ''}</p>
          <div style="margin-top:8px;">
            <button class="btn-primary open-detail" data-id="${r.id}">View</button>
            <button class="btn-ghost" data-id="${r.id}" onclick="bookmark('${r.id}')">Bookmark</button>
          </div>
        </div>
      </article>
    `).join('');
    // attach click handlers
    $$('.open-detail').forEach(btn => btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      openRestaurantModal(id);
    }));
  }

  // bookmark demo
  window.bookmark = function(id){
    const u = getCurrentUser();
    if (!u) { if (confirm('You need to login to bookmark. Login now?')) location.href='login.html'; return; }
    alert('Bookmarked (demo). Implement server-side favorites later.');
  }

  // modal handling
  function setupModal(){
    const modal = $('#restaurant-modal');
    const close = $('#modal-close');
    close && close.addEventListener('click', () => { modal.classList.add('hidden'); });
    modal && modal.addEventListener('click', (e)=> { if (e.target === modal) modal.classList.add('hidden'); });

    const form = $('#leave-review-form');
    form && form.addEventListener('submit', (e) => {
      e.preventDefault();
      const restId = form.dataset.restId;
      const rating = document.getElementById('review-rating').value;
      const comment = document.getElementById('review-comment').value.trim();
      const user = getCurrentUser();
      if (!user) { if (confirm('Login required to post a review. Login now?')) location.href = 'login.html'; return; }
      if (!rating || !comment) { alert('Complete the review form'); return; }
      const reviews = JSON.parse(localStorage.getItem(LS_REVIEWS) || '{}');
      reviews[restId] = reviews[restId] || [];
      reviews[restId].push({ rating: Number(rating), comment, author: user.name, created: Date.now() });
      localStorage.setItem(LS_REVIEWS, JSON.stringify(reviews));
      // clear fields
      form.reset();
      loadReviewsFor(restId);
      alert('Review submitted (demo).');
    });
  }

  function openRestaurantModal(id){
    const rest = (JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]') || []).find(r => r.id === id);
    if (!rest) return;
    const modal = $('#restaurant-modal');
    const content = $('#modal-content');
    if (!modal || !content) return;
    content.innerHTML = `
      <div style="display:flex; gap:12px; align-items:center;">
        <img src="${rest.photo}" style="width:120px;height:120px;border-radius:10px;object-fit:cover" />
        <div>
          <h3 style="margin:0;color:var(--primary)">${rest.name}</h3>
          <div class="muted">${rest.cuisine || 'Various'} • ${rest.rating?.toFixed(1) || '—'} ★</div>
          <p class="muted" style="max-width:520px">${rest.desc || ''}</p>
        </div>
      </div>
    `;
    $('#leave-review-form').dataset.restId = id;
    loadReviewsFor(id);
    modal.classList.remove('hidden');
  }

  function loadReviewsFor(restId){
    const reviews = JSON.parse(localStorage.getItem(LS_REVIEWS) || '{}');
    const list = reviews[restId] || [];
    const container = $('#reviews-section');
    if (!container) return;
    container.innerHTML = `<h4>Reviews (${list.length})</h4>` + (list.length === 0 ? '<p class="muted">No reviews yet</p>' : list.map(r => `
      <div class="review-item">
        <div><span class="rating">${r.rating} ★</span> — <span class="muted">${r.author || 'Anonymous'}</span></div>
        <div style="margin-top:6px">${r.comment}</div>
      </div>
    `).join(''));
  }

  /* ----------------------------
     Admin helpers
     ----------------------------*/
  function renderAdminList(){
    const list = JSON.parse(localStorage.getItem(LS_RESTAURANTS) || '[]');
    const ul = $('#admin-rest-items');
    if (!ul) return;
    ul.innerHTML = list.map(r => `<li style="margin-bottom:8px">${r.name} <span class="muted">(${r.cuisine || '—'})</span></li>`).join('');
  }
})();
