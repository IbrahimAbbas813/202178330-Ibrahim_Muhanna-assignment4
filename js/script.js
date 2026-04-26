// =========================
// Theme Toggle + localStorage
// =========================
const themeToggleBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

function updateThemeButton() {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = document.body.classList.contains("dark")
    ? "Light Mode"
    : "Dark Mode";
}

if (savedTheme === "dark") {
  document.body.classList.add("dark");
}
updateThemeButton();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeButton();
  });
}

// =========================
// Personalized Greeting + saved visitor name
// =========================
const greetingElement = document.getElementById("personalGreeting");
const visitorNameInput = document.getElementById("visitorName");
const saveNameBtn = document.getElementById("saveNameBtn");
const nameFeedback = document.getElementById("nameFeedback");

function getGreetingByTime() {
  const currentHour = new Date().getHours();

  if (currentHour < 12) return "Good morning";
  if (currentHour < 18) return "Good afternoon";
  return "Good evening";
}

function renderGreeting() {
  if (!greetingElement) return;

  const savedName = localStorage.getItem("visitorName");
  const greeting = getGreetingByTime();

  greetingElement.textContent = savedName
    ? `${greeting}, ${savedName}! Welcome to my portfolio.`
    : `${greeting}! Welcome to my portfolio.`;
}

renderGreeting();

if (visitorNameInput) {
  const savedName = localStorage.getItem("visitorName");
  if (savedName) {
    visitorNameInput.value = savedName;
  }
}

if (saveNameBtn) {
  saveNameBtn.addEventListener("click", () => {
    const nameValue = visitorNameInput.value.trim();

    if (!nameValue) {
      nameFeedback.textContent = "Please enter your name before saving.";
      nameFeedback.style.color = "#c62828";
      return;
    }

    localStorage.setItem("visitorName", nameValue);
    nameFeedback.textContent = "Your name has been saved successfully.";
    nameFeedback.style.color = "#1b7f3b";
    renderGreeting();
  });
}

// =========================
// FAVORITES SYSTEM - Save and retrieve favorite projects
// =========================
// Manages favorite projects using localStorage for persistence
let favorites = JSON.parse(localStorage.getItem("projectFavorites")) || [];

// Save favorites array to localStorage for persistence across sessions
function saveFavorites() {
  localStorage.setItem("projectFavorites", JSON.stringify(favorites));
  updateFavoritesCount();
}

// Update the favorites count badge in the filter section
function updateFavoritesCount() {
  const favCountSpan = document.getElementById("favCount");
  if (favCountSpan) {
    favCountSpan.textContent = favorites.length > 0 ? `(${favorites.length})` : "";
  }
}

// Update visual state of favorite buttons based on current favorites list
function updateFavoritedButtons() {
  const favoriteButtons = document.querySelectorAll(".favorite-btn");
  favoriteButtons.forEach((btn) => {
    const projectId = btn.closest(".project-card").dataset.projectId;
    if (favorites.includes(projectId)) {
      btn.classList.add("favorited");
      btn.setAttribute("aria-label", "Remove from favorites");
      btn.setAttribute("title", "Remove from favorites");
    } else {
      btn.classList.remove("favorited");
      btn.setAttribute("aria-label", "Add to favorites");
      btn.setAttribute("title", "Add to favorites");
    }
  });
}

// Initialize favorite button click handlers
function initFavoriteButtons() {
  const favoriteButtons = document.querySelectorAll(".favorite-btn");
  favoriteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const projectCard = btn.closest(".project-card");
      const projectId = projectCard.dataset.projectId;

      // Toggle favorite: add or remove from array
      if (favorites.includes(projectId)) {
        favorites = favorites.filter((id) => id !== projectId);
      } else {
        favorites.push(projectId);
      }

      // Save and update UI
      saveFavorites();
      updateFavoritedButtons();
      filterProjects();
    });
  });
}

// Initialize favorites on page load
updateFavoritesCount();
updateFavoritedButtons();
initFavoriteButtons();

// =========================
// ADVANCED FILTERING & SORTING
// =========================
// Variables for project filtering and sorting
const projectSearchInput = document.getElementById("projectSearch");
const skillButtons = document.querySelectorAll(".skill-btn");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sortSelect");
const projectCards = document.querySelectorAll(".project-card");
const emptyProjectsMessage = document.getElementById("emptyProjectsMessage");
const projectFeedback = document.getElementById("projectFeedback");

// Active filter states
let activeSkillLevel = "all";
let activeCategory = "all";
let activeSort = "name";

// Sort projects array based on active sort option
function sortProjects(cardsArray) {
  const sorted = [...cardsArray];

  if (activeSort === "name") {
    // Alphabetical: A to Z
    sorted.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title));
  } else if (activeSort === "difficulty") {
    // By difficulty level: Beginner → Intermediate → Advanced
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    sorted.sort((a, b) => {
      const aSkill = a.dataset.skill;
      const bSkill = b.dataset.skill;
      return (difficultyOrder[aSkill] || 0) - (difficultyOrder[bSkill] || 0);
    });
  } else if (activeSort === "date") {
    // By date: Most recent first
    sorted.sort((a, b) => parseInt(b.dataset.order) - parseInt(a.dataset.order));
  }

  return sorted;
}

// Main filter function - combines all filter conditions
function filterProjects() {
  const searchText = projectSearchInput.value.trim().toLowerCase();
  const visibleCards = [];

  // Check each project against all active filters
  projectCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const categories = card.dataset.category.toLowerCase();
    const keywords = card.dataset.keywords.toLowerCase();
    const skillLevel = card.dataset.skill;
    const projectId = card.dataset.projectId;

    // Skill level filter
    const matchesSkillLevel = activeSkillLevel === "all" || skillLevel === activeSkillLevel;

    // Category filter (with favorites support)
    let matchesCategory = activeCategory === "all" || categories.includes(activeCategory);
    if (activeCategory === "favorites") {
      matchesCategory = favorites.includes(projectId);
    }

    // Search filter - match against title, categories, and keywords
    const matchesSearch =
      title.includes(searchText) ||
      categories.includes(searchText) ||
      keywords.includes(searchText);

    // Include card if all filters match
    if (matchesSkillLevel && matchesCategory && matchesSearch) {
      visibleCards.push(card);
    }
  });

  // Sort the filtered results
  const sortedCards = sortProjects(visibleCards);

  // Reorder cards in DOM - hide all first, then append sorted ones
  const projectsGrid = document.getElementById("projectsGrid");
  projectsGrid.innerHTML = ""; // Clear the grid

  // Re-add cards in sorted order
  sortedCards.forEach((card) => {
    projectsGrid.appendChild(card);
  });

  // Hide cards that don't match filters
  projectCards.forEach((card) => {
    if (!visibleCards.includes(card)) {
      card.style.display = "none";
    }
  });

  // Show/hide empty state message
  emptyProjectsMessage.hidden = sortedCards.length !== 0;

  // Update feedback message with current filter info
  if (sortedCards.length === 0) {
    if (activeCategory === "favorites" && favorites.length === 0) {
      projectFeedback.textContent = "No favorites yet. Click the heart icon on a project to add it!";
    } else {
      projectFeedback.textContent = "No matching projects were found.";
    }
  } else {
    const skillLabel = activeSkillLevel === "all" ? "all levels" : activeSkillLevel;
    const categoryLabel = activeCategory === "favorites" ? "favorites" : (activeCategory === "all" ? "all categories" : activeCategory);
    projectFeedback.textContent = `Showing ${sortedCards.length} project(s) for ${skillLabel} and ${categoryLabel}, sorted by ${activeSort}.`;
  }
}

// Consolidated button listeners
function setupButtonListener(buttons, getProperty) {
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      getProperty(button);
      filterProjects();
    });
  });
}

setupButtonListener(skillButtons, (btn) => {
  activeSkillLevel = btn.dataset.skill;
});

setupButtonListener(filterButtons, (btn) => {
  activeCategory = btn.dataset.filter;
});

// Search input listener
if (projectSearchInput) {
  projectSearchInput.addEventListener("input", filterProjects);
}

// Sort select listener
if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    activeSort = e.target.value;
    filterProjects();
  });
}

filterProjects();

// =========================
// Contact Form Validation + Feedback
// =========================
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

const formFields = {
  name: {
    input: document.getElementById("name"),
    error: document.getElementById("nameError"),
    validate: (value) => value.trim().length >= 2,
    message: "Please enter at least 2 characters for your name."
  },
  email: {
    input: document.getElementById("email"),
    error: document.getElementById("emailError"),
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message: "Please enter a valid email address."
  },
  message: {
    input: document.getElementById("message"),
    error: document.getElementById("messageError"),
    validate: (value) => value.trim().length >= 10,
    message: "Please enter a message with at least 10 characters."
  }
};

function validateField(fieldConfig) {
  const value = fieldConfig.input.value;
  const isValid = fieldConfig.validate(value);
  fieldConfig.error.textContent = isValid ? "" : fieldConfig.message;
  return isValid;
}

Object.values(formFields).forEach((field) => {
  field.input.addEventListener("input", () => {
    validateField(field);
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const allValid = Object.values(formFields).every((field) => validateField(field));

    if (!allValid) {
      formStatus.textContent = "Please correct the highlighted fields and try again.";
      formStatus.className = "status-message error";
      return;
    }

    formStatus.textContent = "Message sent successfully (demo only). Thank you!";
    formStatus.className = "status-message success";
    contactForm.reset();
  });
}

// =========================
// Footer Year
// =========================
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// =========================
// Reveal-on-scroll animation
// =========================
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.15
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

// =========================
// GITHUB API FETCH - Retrieve public repositories
// =========================
// Fetches the 6 most recent GitHub repositories and displays them
// Uses GitHub REST API (no authentication needed for public data)
const githubUsername = "IbrahimAbbas813";
const githubReposContainer = document.getElementById("githubRepos");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("githubError");
const errorMessage = document.getElementById("errorMessage");

async function fetchGitHubRepos() {
  try {
    // Fetch user's repositories sorted by update date, limit to 6
    const response = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=6`);

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const repos = await response.json();

    // Check if repositories found
    if (repos.length === 0) {
      errorMessage.textContent = "No public repositories found.";
      errorState.hidden = false;
      loadingState.hidden = true;
      return;
    }

    // Hide loading and error states, display repos
    loadingState.hidden = true;
    errorState.hidden = true;

    // Create repo cards with data
    repos.forEach((repo) => {
      const repoCard = document.createElement("a");
      repoCard.href = repo.html_url;
      repoCard.target = "_blank";
      repoCard.rel = "noopener noreferrer";
      repoCard.className = "github-repo-card";

      const description = repo.description || "No description available";

      // Build card HTML with repo information
      const infoHTML = `
        <h3>${repo.name}</h3>
        <p>${description}</p>
        <div class="github-repo-info">
          ${repo.language ? `<span class="github-repo-stat">📝 ${repo.language}</span>` : ""}
          <span class="github-repo-stat">⭐ ${repo.stargazers_count}</span>
          ${repo.forks_count > 0 ? `<span class="github-repo-stat">🍴 ${repo.forks_count}</span>` : ""}
        </div>
      `;

      repoCard.innerHTML = infoHTML;
      githubReposContainer.appendChild(repoCard);
    });
  } catch (error) {
    // Display user-friendly error message
    loadingState.hidden = true;
    errorState.hidden = false;
    errorMessage.textContent = `Failed to load repositories: ${error.message}. Please check your internet connection or try again later.`;
    console.error("GitHub API Error:", error);
  }
}

// Execute on page load
fetchGitHubRepos();
