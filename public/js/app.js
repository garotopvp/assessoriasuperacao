// BORA CORRER CLUB — JavaScript

// === PRODUTOS ===
let produtos = [
  {
    id: 1,
    nome: "CAMISETA RACE",
    preco: 300.0,
    imagem: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    descricao: "Tecido técnico premium",
    tamanhos: ["P", "M", "G", "XG"],
  },
  {
    id: 2,
    nome: "MANGA COMPRIDA RUN",
    preco: 320.0,
    imagem: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    descricao: "Proteção UV e termorregulação",
    tamanhos: ["P", "M", "G", "XG", "XXG"],
  },
  {
    id: 3,
    nome: "CAMISETA HYBRID RUN",
    preco: 200.0,
    imagem: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80",
    descricao: "Design híbrido para performance",
    tamanhos: ["P", "M", "G", "GG"],
  },
  {
    id: 4,
    nome: "CAMISETA RACE",
    preco: 300.0,
    imagem: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=600&q=80",
    descricao: "Edição limitada",
    tamanhos: ["P", "M", "G", "XG"],
  },
  {
    id: 5,
    nome: "MANGA COMPRIDA RUN",
    preco: 320.0,
    imagem: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80",
    descricao: "Branca premium",
    tamanhos: ["P", "M", "G", "XG", "XXG"],
  },
  {
    id: 6,
    nome: "CAMISETA HYBRID RUN",
    preco: 200.0,
    imagem: "https://images.unsplash.com/photo-1627225925683-90fe88fe7c4e?w=600&q=80",
    descricao: "Corte moderno",
    tamanhos: ["P", "M", "G", "GG"],
  },
];

// === CARRINHO ===
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

const cartCountEl = document.getElementById("cart-count");
const cartListEl = document.getElementById("cart-list");
const cartTotalEl = document.getElementById("cart-total");
const cartModal = document.getElementById("cart-modal");
const cartButton = document.getElementById("cart-button");
const hamburger = document.getElementById("hamburger");
const mainNav = document.getElementById("mainNav");

// Renderizar produtos na home (apenas os 6 primeiros)
function renderProdutos() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  console.log("Renderizando produtos:", produtos.length);

  // Pegar apenas os primeiros 6 produtos para exibir na home
  const produtosDestaque = produtos.slice(0, 6);

  grid.innerHTML = produtosDestaque
    .map((produto) => {
      // Usar imagem principal ou primeira imagem do array
      let imagemUrl = produto.imagem || (produto.imagens && produto.imagens[0]) || "";

      // Garantir caminho correto para imagens locais (usar raiz do site)
      if (imagemUrl && !/^https?:\/\//i.test(imagemUrl)) {
        if (!imagemUrl.startsWith("/")) imagemUrl = "/" + imagemUrl;
      }

      console.log("Produto:", produto.nome, "Imagem:", imagemUrl);

      return `
    <a href="produto.html?id=${produto.id}" class="product-card-minimal" data-id="${produto.id}" style="text-decoration: none; color: inherit;">
      <div class="product-image-wrapper">
        <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='533'><rect width='400' height='533' fill='%23f5f7fa'/></svg>" data-src="${imagemUrl}" alt="${produto.nome}" class="product-img" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22533%22><rect width=%22400%22 height=%22533%22 fill=%22%23f5f7fa%22/><text x=%2220%22 y=%22300%22 font-size=%2230%22 fill=%22%23999%22>Sem Imagem</text></svg>'">
      </div>
      <div class="product-info-minimal">
        <h3 class="product-name-minimal">${produto.nome}</h3>
        <p class="product-price-minimal">R$ ${produto.preco.toFixed(2).replace(".", ",")}</p>
      </div>
      <div class="product-sizes-minimal">
        ${(produto.tamanhos || [])
          .map(
            (tam) => `
          <span class="size-btn" data-size="${tam}">${tam}</span>
        `
          )
          .join("")}
      </div>
    </a>
  `;
    })
    .join("");

  // Substituir src placeholder pelo src real (evita flash de imagens anteriores)
  setTimeout(() => {
    document.querySelectorAll("#productsGrid img[data-src]").forEach((img) => {
      try {
        const real = img.getAttribute("data-src");
        if (real) img.src = real;
      } catch (e) {
        /* noop */
      }
    });
    // Aplicar classe loaded para fade-in suave
    grid.classList.add("loaded");
  }, 50);

  // Selecionar tamanho
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".product-card-minimal");
      card.querySelectorAll(".size-btn").forEach((s) => s.classList.remove("active"));
      this.classList.add("active");

      // Auto adicionar ao carrinho
      const produtoId = parseInt(card.dataset.id);
      adicionarAoCarrinho(produtoId);
    });
  });
}

// Adicionar ao carrinho
function adicionarAoCarrinho(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  const card = document.querySelector(`[data-id="${produtoId}"]`);
  // aceitar tanto os botões antigos (size-option) quanto os novos (size-btn)
  const tamanhoSelecionado = card.querySelector(".size-btn.active, .size-option.active");

  if (!tamanhoSelecionado) {
    showToast("Selecione um tamanho", "warning");
    return;
  }

  const item = {
    id: Date.now(),
    produtoId: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    tamanho: tamanhoSelecionado.dataset.size,
    imagem: produto.imagem,
  };

  carrinho.push(item);
  salvarCarrinho();
  atualizarCarrinho();
  showToast("Produto adicionado ao carrinho!", "success");
  toggleCart(true);
}

// Remover do carrinho
function removerDoCarrinho(itemId) {
  carrinho = carrinho.filter((item) => item.id !== itemId);
  salvarCarrinho();
  atualizarCarrinho();
}

// Atualizar UI do carrinho
function atualizarCarrinho() {
  // Contador
  cartCountEl.textContent = carrinho.length;

  // Lista de itens
  if (carrinho.length === 0) {
    cartListEl.innerHTML =
      '<p style="text-align:center;padding:2rem;color:#999;">Seu carrinho está vazio</p>';
  } else {
    cartListEl.innerHTML = carrinho
      .map(
        (item) => `
      <div class="cart-item">
        <img src="${item.imagem}" alt="${item.nome}" class="cart-item-img">
        <div class="cart-item-info">
          <p class="cart-item-name">${item.nome}</p>
          <p class="cart-item-size">Tamanho: ${item.tamanho}</p>
          <p class="cart-item-price">R$ ${item.preco.toFixed(2).replace(".", ",")}</p>
          <button class="cart-item-remove" onclick="removerDoCarrinho(${item.id})">Remover</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Total
  const total = carrinho.reduce((sum, item) => sum + item.preco, 0);
  cartTotalEl.textContent = total.toFixed(2).replace(".", ",");
}

// Salvar no localStorage
function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

// Toggle carrinho
function toggleCart(forceOpen) {
  const isOpen = cartModal.getAttribute("aria-hidden") === "false";
  const shouldOpen = forceOpen !== undefined ? forceOpen : !isOpen;
  cartModal.setAttribute("aria-hidden", shouldOpen ? "false" : "true");
  document.body.style.overflow = shouldOpen ? "hidden" : "";
}

// Checkout via Stripe
function checkout() {
  if (carrinho.length === 0) {
    showToast("Seu carrinho está vazio", "warning");
    return;
  }

  // Chamar função do stripe-checkout.js
  if (typeof iniciarCheckoutStripe === "function") {
    iniciarCheckoutStripe();
  } else {
    showToast("Sistema de pagamento não disponível", "error");
  }
}

// Event Listeners
if (cartButton) {
  cartButton.addEventListener("click", () => toggleCart());
}

// Hamburger menu (mobile)
if (hamburger && mainNav) {
  hamburger.addEventListener("click", () => {
    mainNav.classList.toggle("active");
    hamburger.classList.toggle("active");
    document.body.style.overflow = mainNav.classList.contains("active") ? "hidden" : "";
  });

  // Fechar menu ao clicar em um link
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("active");
      hamburger.classList.remove("active");
      document.body.style.overflow = "";
    });
  });

  // Fechar menu ao clicar fora
  document.addEventListener("click", (e) => {
    if (
      mainNav.classList.contains("active") &&
      !mainNav.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      mainNav.classList.remove("active");
      hamburger.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Scroll indicator
const scrollIndicator = document.querySelector(".scroll-indicator");
if (scrollIndicator) {
  scrollIndicator.addEventListener("click", () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  });
}

// Header transparente no topo
const header = document.querySelector(".site-header");
let lastScroll = 0;

window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  } else {
    header.style.boxShadow = "none";
  }

  lastScroll = currentScroll;
});

// Newsletter
const newsletterForm = document.querySelector(".newsletter-form");
if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;

    // Simular envio
    emailInput.disabled = true;
    const btn = newsletterForm.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "...";

    setTimeout(() => {
      showToast(`${email} cadastrado com sucesso!`, "success");
      newsletterForm.reset();
      emailInput.disabled = false;
      btn.textContent = originalText;
    }, 1000);
  });
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  checkUserAuth(); // Verificar se usuário está logado
  fetchProdutosFromAPI()
    .then(() => {
      renderProdutos();
    })
    .catch(() => {
      renderProdutos();
    });
  atualizarCarrinho();
  initScrollAnimations();
  initCounterAnimations();
  checkLocalHeroImage();
});

// Verificar autenticação do usuário
function checkUserAuth() {
  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName");
  const loginLink = document.getElementById("loginLink");
  const userMenuArea = document.getElementById("userMenuArea");
  const userMenuBtn = document.getElementById("userMenuBtn");

  if (userToken && userName) {
    // Usuário logado
    if (loginLink) loginLink.style.display = "none";
    if (userMenuArea) {
      userMenuArea.style.display = "block";
      if (userMenuBtn) {
        userMenuBtn.onclick = () => (window.location.href = "minha-conta.html");
      }
    }
  } else {
    // Usuário não logado
    if (loginLink) loginLink.style.display = "inline-flex";
    if (userMenuArea) userMenuArea.style.display = "none";
  }
}

// Tenta carregar produtos da API backend se disponível
async function fetchProdutosFromAPI() {
  try {
    console.log("Buscando produtos da API...");
    // Usar edge function do Supabase
    const supabaseUrl = "https://tbazzksrbcmatwqvweks.supabase.co";
    const res = await fetch(`${supabaseUrl}/functions/v1/get-products`);
    console.log("Resposta da API:", res.status);
    if (!res.ok) throw new Error("no products");
    const data = await res.json();
    console.log("Dados recebidos da API:", data);
    if (Array.isArray(data) && data.length > 0) {
      produtos = data;
      console.log("Produtos atualizados:", produtos.length, "itens");
    }
  } catch (e) {
    console.log("Erro ao buscar produtos da API:", e);
    throw e;
  }
}

// === VERIFICAR IMAGEM LOCAL DO HERO ===
function checkLocalHeroImage() {
  const heroSection = document.querySelector(".hero-section");
  if (!heroSection) return;

  const img = new Image();
  img.onload = () => {
    heroSection.classList.add("local-image");
  };
  img.onerror = () => {
    console.log("Usando imagem de fallback do Unsplash");
  };
  img.src = "images/hero-runner.jpg";
}

// === ANIMAÇÕES AO SCROLL ===
function initScrollAnimations() {
  const fadeElements = document.querySelectorAll(".fade-in");

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach((el) => observer.observe(el));
}

// === CONTADOR ANIMADO ===
function initCounterAnimations() {
  const counters = document.querySelectorAll(".stat-number");

  const observerOptions = {
    threshold: 0.5,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const count = parseInt(target.dataset.count);
        animateCounter(target, count);
        observer.unobserve(target);
      }
    });
  }, observerOptions);

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(element, target) {
  let current = 0;
  const increment = target / 50;
  const duration = 2000;
  const stepTime = duration / 50;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, stepTime);
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
