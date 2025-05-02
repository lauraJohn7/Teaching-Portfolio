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

  
    let msnry;
    let currentIndex = -1;
    let allCards = [];
  
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
    }, {
      threshold: 0.1
    });
  
    function observeCards() {
      document.querySelectorAll('.card').forEach(card => observer.observe(card));
    }
  
    function addImageCardsFromJSON(folder, categories, images) {
      images.forEach((image) => {
        const { file, title } = image;
        const imgPath = `images/${folder}/${file}`;
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("data-category", categories.join(" "));
  
        card.dataset.title = title;
        card.dataset.medium = image.medium || "";
        card.dataset.year = image.year || "";
        card.dataset.description = image.description || "";
  
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = title;
        img.loading = "lazy";
        img.onerror = () => card.remove();
  
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
  
        observer.observe(card);
      });
    }
  
    fetch("titles.json")
      .then(response => response.json())
      .then(data => {
        if (!cardsContainer.querySelector(".grid-sizer")) {
          const gridSizer = document.createElement("div");
          gridSizer.className = "grid-sizer";
          cardsContainer.insertBefore(gridSizer, cardsContainer.firstChild);
        }
  
        data.forEach(group => {
          addImageCardsFromJSON(group.folder, group.category, group.images);
        });
  
        allCards = Array.from(cardsContainer.querySelectorAll(".card"));
  
        setTimeout(() => {
          imagesLoaded(cardsContainer, () => {
            cardsContainer.classList.add("ready");
  
            msnry = new Masonry(cardsContainer, {
              itemSelector: ".card",
              columnWidth: ".grid-sizer",
              percentPosition: true,
            });
  
            msnry.layout();
          });
        }, 50);
  
        cardsContainer.addEventListener("click", (event) => {
          const img = event.target.closest("img");
          const card = event.target.closest(".card");
          if (img && card) {
            currentIndex = allCards.indexOf(card);
            openLightbox(
              img.src,
              card.dataset.title,
              card.dataset.medium,
              card.dataset.year,
              card.dataset.description
            );
          }
        });
      })
      .catch(error => console.error("Failed to load titles.json", error));

      // 🆕 ADD THIS HERE (after fetch finishes)
const homepageLinks = document.querySelectorAll(".filter-link");

homepageLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const category = link.getAttribute("data-category");
    applyFilter(category);
    window.scrollTo({ top: cardsContainer.offsetTop, behavior: "smooth" });
  });
});
  
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
        if (typeof msnry !== "undefined") {
          msnry.layout();
        }
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
  
    homepageLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const category = link.getAttribute("data-category");
        applyFilter(category);
        window.scrollTo({ top: cardsContainer.offsetTop, behavior: "smooth" });
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
