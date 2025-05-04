document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.getElementById("theme-switch");
  const body = document.body;
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cardsContainer = document.querySelector(".gallery");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeLightbox = document.querySelector(".close");
  const hamburger = document.querySelector(".hamburger");
  const mainMenu = document.querySelector(".main-menu");
  const homepageSection = document.getElementById("homepage");
  const loadMoreButton = document.getElementById("load-more");

  let msnry;
  let currentIndex = -1;
  let allCards = [];
  let jsonData = [];
  let currentGroupIndex = 0;
  let currentImageIndex = 0;
  const batchSize = 20;

  hamburger.addEventListener("click", () => {
    mainMenu.classList.toggle("open");
  });

  themeSwitch.addEventListener("change", () => {
    body.classList.toggle("dark-mode", themeSwitch.checked);
    body.classList.toggle("light-mode", !themeSwitch.checked);
    localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    themeSwitch.checked = true;
    body.classList.add("dark-mode");
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  function addImageCardsFromJSON(folder, categories, images) {
    images.forEach((image) => {
      const { file, title } = image;
      const imgPath = `images/${folder}/${file}`;
      console.log("🖼 Trying to load image:", imgPath);

      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-category", categories.join(" "));

      card.dataset.title = title;
      card.dataset.medium = image.medium || "";
      card.dataset.year = image.year || "";
      card.dataset.description = image.description || "";

      const img = document.createElement("img");
      img.src = imgPath;
      img.addEventListener("error", () => {
        console.warn("⚠️ IMAGE NOT FOUND:", imgPath);
      });
      img.alt = title;
      img.loading = "lazy";

      const inner = document.createElement("div");
      inner.className = "card-inner";

      const titleEl = document.createElement("p");
      titleEl.className = "title";
      titleEl.textContent = title;

      const categoryEl = document.createElement("p");
      categoryEl.className = "category";
      const readableCategory = categories.filter(cat => !["all_work", "my_work", "student_work"].includes(cat)).at(-1)?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "";
      categoryEl.textContent = readableCategory;

      inner.appendChild(titleEl);
      inner.appendChild(categoryEl);
      card.appendChild(img);
      card.appendChild(inner);
      cardsContainer.appendChild(card);
      console.log("✅ Card added to DOM:", card);

      observer.observe(card);
    });
  }

  function loadNextBatch() {
    const group = jsonData[currentGroupIndex];
    if (!group) return;

    const { folder, category, images } = group;
    const nextImages = images.slice(currentImageIndex, currentImageIndex + batchSize);
    addImageCardsFromJSON(folder, category, nextImages);
    currentImageIndex += batchSize;

    if (currentImageIndex >= images.length) {
      currentGroupIndex++;
      currentImageIndex = 0;
    }
  }
  console.log("🧱 Cards actually in DOM:", document.querySelectorAll('.card').length);


  fetch("titles.json")
  .then(response => response.json())
  .then(data => {
    jsonData = data;

    if (!cardsContainer.querySelector(".grid-sizer")) {
      const gridSizer = document.createElement("div");
      gridSizer.className = "grid-sizer";
      cardsContainer.insertBefore(gridSizer, cardsContainer.firstChild);
    }

    // Load all groups
    while (currentGroupIndex < jsonData.length) {
      loadNextBatch();
    }

    imagesLoaded(cardsContainer, () => {
      allCards = Array.from(cardsContainer.querySelectorAll(".card"));

      msnry = new Masonry(cardsContainer, {
        itemSelector: ".card",
        columnWidth: ".grid-sizer",
        percentPosition: true,
      });

      cardsContainer.classList.add("ready");

      msnry.layout();

      console.log("🧱 Cards actually in DOM:", allCards.length); // ✅ moved here
    });

    const homepageLinks = document.querySelectorAll(".filter-link");
    homepageLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const category = link.getAttribute("data-category");
        applyFilter(category);
        window.scrollTo({ top: cardsContainer.offsetTop, behavior: "smooth" });
      });
    });
  })
  .catch(error => console.error("Failed to load titles.json", error));

  function applyFilter(category) {
    homepageSection.classList.add("fade-out");
    setTimeout(() => {
      homepageSection.style.display = "none";
      cardsContainer.style.display = "block";
      allCards.forEach(card => {
        const categories = card.getAttribute("data-category").split(" ");
        const matches = category === "all" || category === "all_work" || categories.includes(category);
        card.style.display = matches ? "block" : "none";
      });
      msnry?.layout();
      cardsContainer.classList.add("fade-in");
    }, 400);
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const isTopLevelFilter = !button.closest(".dropdown-menu");
      if (isTopLevelFilter && mainMenu.classList.contains("open")) {
        mainMenu.classList.remove("open");
      }
      const category = button.getAttribute("data-category");
      applyFilter(category);
    });
  });

  function openLightbox(src, title, medium, year, description) {
    lightboxImg.src = src;
    document.getElementById("lightbox-title").textContent = title || "";
    document.getElementById("lightbox-medium").textContent = medium ? `Medium: ${medium}` : "";
    document.getElementById("lightbox-year").textContent = year ? `Year: ${year}` : "";
    document.getElementById("lightbox-description").textContent = description || "";
    lightbox.classList.remove("hidden");
    lightbox.classList.add("fade-in");
  }

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target === closeLightbox) {
      lightbox.classList.add("hidden");
      lightbox.classList.remove("fade-in");
      lightboxImg.src = "";
      document.getElementById("lightbox-title").textContent = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("hidden")) {
      if (event.key === "ArrowRight") {
        currentIndex = (currentIndex + 1) % allCards.length;
      } else if (event.key === "ArrowLeft") {
        currentIndex = (currentIndex - 1 + allCards.length) % allCards.length;
      } else if (event.key === "Escape") {
        lightbox.classList.add("hidden");
        lightbox.classList.remove("fade-in");
        lightboxImg.src = "";
        document.getElementById("lightbox-title").textContent = "";
        return;
      } else {
        return;
      }

      const newCard = allCards[currentIndex];
      openLightbox(
        newCard.querySelector("img").src,
        newCard.dataset.title,
        newCard.dataset.medium,
        newCard.dataset.year,
        newCard.dataset.description
      );
    }
  });
});
