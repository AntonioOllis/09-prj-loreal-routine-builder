/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productSearch = document.getElementById("productSearch");
const languageSelect = document.getElementById("languageSelect");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const generateRoutineBtn = document.getElementById("generateRoutine");
const selectedProducts = new Map();
const selectedProductsStorageKey = "lorealRoutineSelectedProducts";
const languageStorageKey = "lorealRoutineLanguage";
let currentLanguage =
  localStorage.getItem(languageStorageKey) === "ar" ? "ar" : "en";
let displayedProducts = [];
let hasDisplayedProducts = false;
let productsCache;
let workerRequestInProgress = false;
const workerUrl = "https://loreal-worker.scampercityepic.workers.dev/";
const translations = {
  en: {
    pageTitle: "L'Oréal | Smart Routine & Product Advisor",
    title: "Smart Routine & Product Advisor",
    languageLabel: "Language",
    categoryPlaceholder: "Choose a Category",
    categoryCleanser: "Cleansers",
    categoryMoisturizer: "Moisturizers & Treatments",
    categoryHaircare: "Haircare",
    categoryMakeup: "Makeup",
    categoryHairColor: "Hair Color",
    categoryHairStyling: "Hair Styling",
    categoryMensGrooming: "Men's Grooming",
    categorySuncare: "Suncare",
    categoryFragrance: "Fragrance",
    searchPlaceholder: "Search products by name",
    selectProduct: "Select",
    selectedProducts: "Selected Products",
    generateRoutine: "Generate Routine",
    chatTitle: "Let's Build Your Routine",
    messageLabel: "Message",
    chatPlaceholder: "Ask me about products or routines…",
    sendLabel: "Send",
    copyright: "© 2025 L'Oréal. All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    contact: "Contact",
    selectCategory: "Select a category to view products",
    noProducts: "No products match your search.",
    noProductsSelected: "No products selected yet.",
    selectProductWarning:
      "Select at least one product before generating a routine.",
    generationPrompt: "Please build a routine using my selected products.",
    user: "You",
    advisor: "Advisor",
    error: "Error",
    requestError:
      "Something went wrong while contacting the product advisor. Please try again.",
    systemPrompt:
      "You are a helpful L'Oréal skincare and beauty advisor. Keep every answer short and direct, using only the most useful details. Use brief bullet points when helpful. Give clear, practical advice and explain product safety without unnecessary detail.",
    categories: {
      cleanser: "Cleansers",
      moisturizer: "Moisturizers & Treatments",
      haircare: "Haircare",
      makeup: "Makeup",
      "hair color": "Hair Color",
      "hair styling": "Hair Styling",
      "men's grooming": "Men's Grooming",
      suncare: "Suncare",
      fragrance: "Fragrance",
    },
  },
  ar: {
    pageTitle: "لوريال | مستشار الروتين والمنتجات الذكي",
    title: "مستشار الروتين والمنتجات الذكي",
    languageLabel: "اللغة",
    categoryPlaceholder: "اختر فئة",
    categoryCleanser: "منظفات الوجه",
    categoryMoisturizer: "مرطبات وعلاجات",
    categoryHaircare: "العناية بالشعر",
    categoryMakeup: "المكياج",
    categoryHairColor: "صبغات الشعر",
    categoryHairStyling: "تصفيف الشعر",
    categoryMensGrooming: "العناية الرجالية",
    categorySuncare: "العناية بالشمس",
    categoryFragrance: "العطور",
    searchPlaceholder: "ابحث عن المنتجات بالاسم",
    selectProduct: "اختر",
    selectedProducts: "المنتجات المحددة",
    generateRoutine: "إنشاء روتين",
    chatTitle: "لنصمم روتينك",
    messageLabel: "رسالة",
    chatPlaceholder: "اسألني عن المنتجات أو الروتين…",
    sendLabel: "إرسال",
    copyright: "© 2025 لوريال. جميع الحقوق محفوظة.",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
    contact: "اتصل بنا",
    selectCategory: "اختر فئة لعرض المنتجات",
    noProducts: "لا توجد منتجات تطابق بحثك.",
    noProductsSelected: "لم يتم اختيار منتجات بعد.",
    selectProductWarning: "اختر منتجًا واحدًا على الأقل قبل إنشاء روتين.",
    generationPrompt: "يرجى إنشاء روتين باستخدام المنتجات التي اخترتها.",
    user: "أنت",
    advisor: "المستشار",
    error: "خطأ",
    requestError:
      "حدث خطأ أثناء التواصل مع مستشار المنتجات. يرجى المحاولة مرة أخرى.",
    systemPrompt:
      "أنت مستشار مفيد للعناية بالبشرة والجمال من لوريال. أجب باللغة العربية باختصار ووضوح، واذكر أهم التفاصيل فقط. استخدم نقاطًا موجزة عند الحاجة. قدم نصائح عملية واشرح سلامة استخدام المنتجات دون إطالة.",
    categories: {
      cleanser: "منظفات الوجه",
      moisturizer: "مرطبات وعلاجات",
      haircare: "العناية بالشعر",
      makeup: "المكياج",
      "hair color": "صبغات الشعر",
      "hair styling": "تصفيف الشعر",
      "men's grooming": "العناية الرجالية",
      suncare: "العناية بالشمس",
      fragrance: "العطور",
    },
  },
};
const messages = [
  {
    role: "system",
    content: translations[currentLanguage].systemPrompt,
  },
];

/* Apply the selected language to the page and chat labels */
function applyLanguage() {
  const language = translations[currentLanguage];
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  document.title = language.pageTitle;
  languageSelect.value = currentLanguage;
  messages[0].content = language.systemPrompt;

  document.querySelectorAll("[data-translation]").forEach((element) => {
    element.textContent = language[element.dataset.translation];
  });

  document
    .querySelectorAll("[data-translation-placeholder]")
    .forEach((element) => {
      element.placeholder =
        language[element.dataset.translationPlaceholder];
    });

  document.querySelectorAll("[data-translation-label]").forEach((element) => {
    element.setAttribute(
      "aria-label",
      language[element.dataset.translationLabel],
    );
  });

  document.querySelectorAll(".chat-message").forEach((message) => {
    const sender = message.dataset.sender;
    message.querySelector(".chat-message-label").textContent =
      language[sender];
  });
}

applyLanguage();

languageSelect.addEventListener("change", () => {
  currentLanguage = languageSelect.value;
  localStorage.setItem(languageStorageKey, currentLanguage);
  applyLanguage();
  renderSelectedProducts();
  if (hasDisplayedProducts) {
    showMatchingProducts();
  } else {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        ${translations[currentLanguage].selectCategory}
      </div>
    `;
  }
});

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    ${translations[currentLanguage].selectCategory}
  </div>
`;

/* Show a message until the user selects products */
selectedProductsList.innerHTML = `
  <p class="selected-empty-message">${translations[currentLanguage].noProductsSelected}</p>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (!productsCache) {
    const response = await fetch("products.json");
    const data = await response.json();
    productsCache = data.products;
  }

  return productsCache;
}

/* Restore saved product IDs using the latest product data */
async function restoreSelectedProducts() {
  const products = await loadProducts();
  const savedProductIds = JSON.parse(
    localStorage.getItem(selectedProductsStorageKey) || "[]",
  );

  if (!Array.isArray(savedProductIds)) {
    throw new Error("Saved product selections are invalid.");
  }

  savedProductIds.forEach((productId) => {
    const product = products.find(
      (item) => String(item.id) === String(productId),
    );

    if (product) {
      selectedProducts.set(String(product.id), product);
    }
  });

  renderSelectedProducts();
}

/* Show the selected products in the page */
function renderSelectedProducts() {
  if (selectedProducts.size === 0) {
    selectedProductsList.innerHTML = `
      <p class="selected-empty-message">${translations[currentLanguage].noProductsSelected}</p>
    `;
    return;
  }

  selectedProductsList.innerHTML = [...selectedProducts.values()]
    .map(
      (item) => `
        <div class="selected-product">
          <strong dir="auto">${item.name}</strong>
          <span dir="auto">${item.brand}</span>
        </div>
      `,
    )
    .join("");
}

/* Send the conversation to the Cloudflare Worker and keep its reply in history */
async function askWorker(question) {
  if (workerRequestInProgress) {
    throw new Error("Please wait for the current response to finish.");
  }

  workerRequestInProgress = true;
  sendBtn.disabled = true;
  generateRoutineBtn.disabled = true;
  messages.push({ role: "user", content: question });

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`The Worker returned an error (${response.status}).`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      throw new Error("The Worker response did not include a reply.");
    }

    messages.push({ role: "assistant", content: reply });
    return reply;
  } catch (error) {
    messages.pop();
    throw error;
  } finally {
    workerRequestInProgress = false;
    sendBtn.disabled = false;
    generateRoutineBtn.disabled = false;
  }
}

/* Add chat text safely without treating it as HTML */
function addChatMessage(sender, text) {
  const message = document.createElement("div");
  const messageType =
    sender === "user" ? "user" : sender === "advisor" ? "advisor" : "error";
  message.className = `chat-message chat-message-${messageType}`;
  message.dataset.sender = sender;

  const label = document.createElement("strong");
  label.className = "chat-message-label";
  label.textContent = translations[currentLanguage][sender];

  const content = document.createElement("p");
  content.className = "chat-message-content";
  content.dir = "auto";
  content.textContent = text;

  message.append(label, content);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  displayedProducts = products;

  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">${translations[currentLanguage].noProducts}</div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
    <label
      class="product-card ${
        selectedProducts.has(String(product.id)) ? "selected" : ""
      }"
      aria-describedby="product-details-${product.id}"
    >
      <input
        class="product-checkbox"
        type="checkbox"
        data-product-id="${product.id}"
        aria-label="${translations[currentLanguage].selectProduct} ${product.name}"
        ${selectedProducts.has(String(product.id)) ? "checked" : ""}
      >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3 dir="auto">${product.name}</h3>
        <p dir="auto">${product.brand}</p>
      </div>
      <div class="product-modal" id="product-details-${product.id}" role="tooltip">
        <strong dir="auto">${product.name}</strong>
        <span dir="auto">${product.brand} · ${
          translations[currentLanguage].categories[product.category] ||
          product.category
        }</span>
        <p dir="auto">${product.description}</p>
      </div>
    </label>
  `,
    )
    .join("");
}

/* Keep selections when the user switches categories */
productsContainer.addEventListener("change", (e) => {
  if (!e.target.matches(".product-checkbox")) {
    return;
  }

  const checkbox = e.target;
  const productId = checkbox.dataset.productId;
  const product = displayedProducts.find(
    (item) => String(item.id) === productId,
  );

  if (checkbox.checked) {
    selectedProducts.set(productId, product);
  } else {
    selectedProducts.delete(productId);
  }

  localStorage.setItem(
    selectedProductsStorageKey,
    JSON.stringify([...selectedProducts.keys()]),
  );

  checkbox
    .closest(".product-card")
    .classList.toggle("selected", checkbox.checked);
  renderSelectedProducts();
});

/* Filter products by the selected category and search text */
async function showMatchingProducts() {
  hasDisplayedProducts = true;
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const searchTerm = productSearch.value.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    const matchesName = product.name.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesName;
  });

  displayProducts(filteredProducts);
}

/* Update results when the category or search text changes */
categoryFilter.addEventListener("change", showMatchingProducts);
productSearch.addEventListener("input", showMatchingProducts);

/* Send the user's message and show the Worker reply */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (workerRequestInProgress) {
    return;
  }

  const question = userInput.value.trim();

  if (!question) {
    return;
  }

  addChatMessage("user", question);
  userInput.value = "";

  try {
    const reply = await askWorker(question);
    addChatMessage("advisor", reply);
  } catch (error) {
    console.error("Could not contact the Cloudflare Worker:", error);
    addChatMessage(
      "error",
      currentLanguage === "ar"
        ? translations.ar.requestError
        : error.message,
    );
  }
});

/* Ask the Worker to build a routine from the selected products */
generateRoutineBtn.addEventListener("click", async () => {
  if (workerRequestInProgress) {
    return;
  }

  if (selectedProducts.size === 0) {
    addChatMessage(
      "advisor",
      translations[currentLanguage].selectProductWarning,
    );
    return;
  }

  const productDetails = [...selectedProducts.values()]
    .map(
      (product) =>
        `- ${product.brand} ${product.name} (${product.category}): ${product.description}`,
    )
    .join("\n");
  const question =
    currentLanguage === "ar"
      ? `أنشئ روتينًا موجزًا باستخدام المنتجات المحددة. اذكر ترتيب الاستخدام ووقت استخدام كل منتج بنقاط مختصرة:\n${productDetails}`
      : `Build a concise routine using these selected products. Briefly list the order and when to use each one:\n${productDetails}`;

  addChatMessage("user", translations[currentLanguage].generationPrompt);

  try {
    const reply = await askWorker(question);
    addChatMessage("advisor", reply);
  } catch (error) {
    console.error("Could not contact the Cloudflare Worker:", error);
    addChatMessage(
      "error",
      currentLanguage === "ar"
        ? translations.ar.requestError
        : error.message,
    );
  }
});

restoreSelectedProducts().catch((error) => {
  console.error("Could not restore selected products:", error);
});
