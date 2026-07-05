// Typewriter effect for developer signature
document.addEventListener("DOMContentLoaded", function () {
  const prefix = "< Code by ";
  const name = "Tanish";
  const suffix = " />";
  const developerCredit = document.getElementById("developer-credit");

  if (!developerCredit) return;

  // Global variables to track animation state
  let animationActive = false;
  let animationTimer = null;

  // Function to start the typewriter effect
  function startTypewriter() {
    // Safety check - don't start another animation if one is already running
    if (animationActive) {
      return;
    }

    animationActive = true;
    let i = 0;
    let isDeleting = false;
    const typingSpeed = 100; // Speed of typing in ms
    const deletingSpeed = 50; // Speed of deleting in ms (faster than typing)
    const pauseDelay = 2000; // Time to pause when fully typed before deleting
    const fullText = prefix + name + suffix;
    developerCredit.textContent = "";

    function animateText() {
      // Reset the content when starting a new typing cycle
      if (i === 0 && !isDeleting) {
        developerCredit.innerHTML = "";
        developerCredit.classList.add("typing");
      }

      if (!isDeleting) {
        // TYPING PHASE

        // Create span when we reach the name part
        if (i === prefix.length) {
          const nameSpan = document.createElement("span");
          nameSpan.className = "developer-name";
          developerCredit.appendChild(nameSpan);
        }

        const currentChar = fullText.charAt(i);

        if (i >= prefix.length && i < prefix.length + name.length) {
          // Add characters to the span when we're in the name part
          const nameSpan = developerCredit.querySelector(".developer-name");
          nameSpan.textContent += currentChar;
        } else {
          // Otherwise add to the main element
          if (i < prefix.length) {
            developerCredit.appendChild(document.createTextNode(currentChar));
          } else {
            developerCredit.appendChild(document.createTextNode(currentChar));
          }
        }

        i++;

        // When fully typed, pause then start deleting
        if (i === fullText.length) {
          isDeleting = true;
          developerCredit.classList.remove("typing");
          setTimeout(animateText, pauseDelay);
          return;
        }
      } else {
        // DELETING PHASE
        i--;

        // Handle deleting differently based on where we are in the text
        if (i >= prefix.length && i < prefix.length + name.length) {
          // We're in the name part - adjust the span's text content
          const nameSpan = developerCredit.querySelector(".developer-name");
          if (nameSpan) {
            nameSpan.textContent = name.substring(0, i - prefix.length);
            if (i === prefix.length) {
              developerCredit.removeChild(nameSpan);
            }
          }
        } else {
          // We're outside the name part - remove the last child node
          if (developerCredit.childNodes.length > 0) {
            const lastNode =
              developerCredit.childNodes[developerCredit.childNodes.length - 1];
            if (lastNode.nodeType === Node.TEXT_NODE) {
              lastNode.nodeValue = lastNode.nodeValue.slice(0, -1);
              if (lastNode.nodeValue === "") {
                developerCredit.removeChild(lastNode);
              }
            }
          }
        }

        // When fully deleted, start typing again
        if (i === 0) {
          isDeleting = false;
          setTimeout(animateText, 500); // Shorter pause before starting to type again
          return;
        }
      }

      // Continue animation with appropriate speed but safely clear previous timers
      if (animationTimer) {
        clearTimeout(animationTimer);
      }
      animationTimer = setTimeout(
        animateText,
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    // Start the animation loop
    animateText();
  }

  // Clean up function to ensure we don't have multiple animations running
  function stopTypewriter() {
    if (animationTimer) {
      clearTimeout(animationTimer);
      animationTimer = null;
    }
    animationActive = false;
  }

  // Improved observer with better visibility handling
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Only start if not already animating
          if (!animationActive) {
            startTypewriter();
          }
        } else {
          // When element is out of view, clean up animation
          stopTypewriter();
        }
      });
    },
    {
      threshold: 0.1, // Lower threshold to detect visibility earlier
      rootMargin: "0px 0px 100px 0px", // Margin to start animation earlier
    }
  );

  observer.observe(developerCredit);

  // Handle page visibility changes (when tab is switched, etc)
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopTypewriter();
    } else {
      // Check if element is in view before restarting
      const rect = developerCredit.getBoundingClientRect();
      const isVisible =
        rect.top >= -rect.height &&
        rect.left >= -rect.width &&
        rect.bottom <= window.innerHeight + rect.height &&
        rect.right <= window.innerWidth + rect.width;

      if (isVisible && !animationActive) {
        startTypewriter();
      }
    }
  });

  // Handle window resize events
  let resizeTimer;
  window.addEventListener("resize", function () {
    // Debounce resize events
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      // Only restart if the element is currently visible
      const rect = developerCredit.getBoundingClientRect();
      const isVisible =
        rect.top >= -rect.height &&
        rect.left >= -rect.width &&
        rect.bottom <= window.innerHeight + rect.height &&
        rect.right <= window.innerWidth + rect.width;

      if (isVisible) {
        stopTypewriter();
        startTypewriter();
      }
    }, 250); // Wait 250ms after resize ends before restarting
  });
});

// Add a simple hover effect to enhance the interactive feel
document.addEventListener("mouseover", function (e) {
  if (e.target && e.target.classList.contains("developer-link")) {
    e.target.style.cursor = "pointer";
  }
});
