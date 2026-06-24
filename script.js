/* ============================================
   DOMAIN SALE LANDING PAGE — main script
   ============================================
   This file handles:
   1. Fade-up entrance animations for elements
      marked with [data-animate].
   2. Bid form validation and submission.

   SECURITY NOTE:
   The destination e-mail address must NEVER be
   written in this file (or anywhere in the
   frontend). This script only sends the visitor's
   data to a backend endpoint; the backend is the
   only place that knows the destination e-mail,
   read from a private server-side environment
   variable.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initEntranceAnimations();
  initBidForm();
  initVideoModal();
});

/* ============================================
   1. ENTRANCE ANIMATIONS
   Elements with [data-animate] fade up into view.
   On the hero (always visible on load) we just
   trigger them after a short delay so the page
   doesn't look static the instant it loads.
   For any future sections added below the hero,
   an IntersectionObserver reveals them on scroll.
   ============================================ */
function initEntranceAnimations() {
  const animatedEls = document.querySelectorAll("[data-animate]");

  // Reveal elements that are already in the viewport on load
  // (typical case: the hero content), respecting each element's
  // own stagger delay via [data-animate-delay] (in ms).
  animatedEls.forEach((el) => {
    const delay = Number(el.getAttribute("data-animate-delay") || 0);

    if (isInViewport(el)) {
      window.setTimeout(() => el.classList.add("is-in-view"), delay);
    }
  });

  // For elements further down the page (not yet visible), use an
  // IntersectionObserver so they animate in as the user scrolls.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = Number(entry.target.getAttribute("data-animate-delay") || 0);
          window.setTimeout(() => entry.target.classList.add("is-in-view"), delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  animatedEls.forEach((el) => {
    if (!isInViewport(el)) {
      observer.observe(el);
    }
  });
}

function isInViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

/* ============================================
   2. BID FORM
   Validates required fields, then sends the data
   to a backend endpoint via fetch(). The endpoint
   itself (and the destination e-mail) is NOT
   implemented yet — see the TODO below.
   ============================================ */
function initBidForm() {
  const form = document.getElementById("bid-form");
  const submitBtn = document.getElementById("submit-btn");
  const feedbackEl = document.getElementById("form-feedback");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      city: form.city.value.trim(),
      bid: form.bid.value,
    };

    if (!validateForm(formData)) {
      showFeedback(feedbackEl, "Please fill in all fields with a valid e-mail.", "error");
      return;
    }

    setSubmitting(submitBtn, true);

    try {
      await submitBid(formData);
      form.reset();
      showSuccessOverlay();
      form.reset();
    } catch (error) {
      showFeedback(
        feedbackEl,
        "We could not send your bid right now. Please try again shortly.",
        "error"
      );
    } finally {
      setSubmitting(submitBtn, false);
    }
  });
}

/**
 * Simple required-field + e-mail format validation.
 * Keeps validation logic separate so it's easy to extend later
 * (e.g. minimum bid rules) without touching the submit handler.
 */
function validateForm(data) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.name || !data.email || !data.city || !data.bid) {
    return false;
  }

  return emailPattern.test(data.email);
}

/**
 * Sends the bid data to the backend.
 *
 * TODO (backend integration pending):
 * Replace the endpoint below once the server-side function is ready
 * (e.g. a Vercel Function or a Cloudflare Pages Function). That
 * function is the ONLY place where the destination e-mail address
 * should exist, read from a private environment variable on the
 * server — never hardcoded here, and never sent to the browser.
 *
 * Example of what the backend endpoint should do:
 *   1. Receive { name, email, city, bid } as JSON.
 *   2. Read the private destination e-mail from process.env (or the
 *      platform's equivalent secret/environment variable store).
 *   3. Send an e-mail (e.g. via Resend, SendGrid, or SMTP) with the
 *      bid details to that private address.
 *   4. Return a 200 response on success, or a non-200 status on failure.
 */
async function submitBid(data) {
  const endpoint = "/submit-bid"; // placeholder endpoint, not implemented yet

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Bid submission failed");
  }

  return response.json().catch(() => ({}));
}

/**
 * Toggles the submit button's loading state.
 */
function setSubmitting(button, isSubmitting) {
  if (!button) return;

  const label = button.querySelector(".submit-btn__label");

  button.disabled = isSubmitting;
  if (label) {
    label.textContent = isSubmitting ? "Sending…" : "Send";
  }
}

/**
 * Shows a status message above the submit button.
 */
function showFeedback(el, message, type) {
  if (!el) return;

  el.textContent = message;
  el.classList.remove("is-success", "is-error");
  el.classList.add(
  "is-visible",
  type === "success" ? "is-success" : "is-error"
);
}

/**
 * Shows the full-screen success overlay after a bid is submitted,
 * then automatically hides it after a few seconds.
 */
function showSuccessOverlay() {
  const overlay = document.getElementById("success-overlay");
  if (!overlay) return;

  overlay.classList.add("is-visible");

  window.setTimeout(() => {
    overlay.classList.remove("is-visible");
  }, 4000); // disappears after 4 seconds
}

// ===== Video Modal =====
function initVideoModal() {
  const trigger = document.querySelector("[data-video-trigger]");
  const overlay = document.querySelector("[data-video-overlay]");
  const closeBtn = document.querySelector("[data-video-close]");
  const wrapper = document.querySelector("[data-video-wrapper]");

  if (!trigger || !overlay || !wrapper) return;

  const videoUrl = trigger.getAttribute("data-video-url");

  function getYouTubeId(url) {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

        );
    return match ? match[1] : null;
  }

  function openModal() {
    const youTubeId = getYouTubeId(videoUrl);

    wrapper.innerHTML = youTubeId
      ? `<iframe
          src="https://www.youtube.com/embed/${youTubeId}?autoplay=1&rel=0"
          title="Vídeo de apresentação"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>`
      : `<video src="${videoUrl}" controls autoplay></video>`;

    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    wrapper.innerHTML = "";
    document.body.style.overflow = "";
  }

  trigger.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeModal();
    }
  });
}
