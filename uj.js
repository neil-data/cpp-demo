// uj.js

// The API_URL must match the port and route configured in your Flask backend (app.py)
const API_URL = "http://127.0.0.1:5000/chat";

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Global Elements and Constants ---

    // Cursor elements
    const cursor = document.getElementById("cursor");
    const blur = document.getElementById("cursor-blur");

    // Chatbot Elements
    const chatMessagesContainer = document.getElementById("chat-messages");
    const inputField = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");
    const incidentActionsContainer = document.getElementById("incident-actions");
    const actionsContainer = document.getElementById("actions-container"); // Container for individual action cards

    // Chatbot UI Toggle elements
    const chatbotButton = document.querySelector(".chatbot-button");
    const chatbotContainer = document.getElementById("chatbot-container");
    const closeButton = document.querySelector(".close-chat-btn");
    const ctaButton = document.querySelector(".cta-button");
    const themeToggle = document.getElementById("theme-toggle");

    // Nav element
    const nav = document.getElementById("nav");

    // CRITICAL CHECK: Ensure all required chat elements are found
    if (!chatMessagesContainer || !inputField || !sendBtn || !incidentActionsContainer || !actionsContainer) {
        console.error("Chat elements not found. Chat functionality is disabled. Please ensure all IDs (chat-messages, user-input, send-btn, incident-actions, actions-container) are correct in ui.html.");
    }

    // --- 2. Feature Implementations ---

    // === A. Cursor effect ===
    if (cursor && blur) {
        document.addEventListener("mousemove", function (dets) {
            cursor.style.left = dets.x + "px";
            cursor.style.top = dets.y + "px";
            blur.style.left = dets.x - 200 + "px";
            blur.style.top = dets.y - 200 + "px";
        });
    }

    // === B. Navbar fade ===
    if (nav) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 100) nav.style.backgroundColor = "rgba(0,0,0,0.9)";
            else nav.style.backgroundColor = "transparent";
        });
    }

    // === C. Chatbot Toggle Logic ===
    if (chatbotButton && chatbotContainer && closeButton && inputField) {
        const toggleChatbot = (forceClose = false) => {
            const shouldOpen = !forceClose && !chatbotContainer.classList.contains("is-open");
            chatbotContainer.classList.toggle("is-open", shouldOpen);
            chatbotButton.style.display = shouldOpen ? 'none' : 'block';
            chatbotContainer.setAttribute('aria-hidden', !shouldOpen);
            if (shouldOpen) {
                inputField.focus(); // Focus on input when opened
                if (chatMessagesContainer) {
                    setTimeout(() => {
                        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }, 100);
                }
            }
        };

        // Open when floating button is clicked
        chatbotButton.addEventListener("click", () => toggleChatbot());

        // Close when the 'X' button is clicked
        closeButton.addEventListener("click", () => toggleChatbot(true));

        // Open the chatbot when the main CTA button is clicked
        if (ctaButton) {
            ctaButton.addEventListener("click", (e) => {
                e.preventDefault();
                toggleChatbot();
            });
        }
    }

    // === D. Theme Toggle (Dark <-> Light Mode) ===
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");

            const icon = themeToggle.querySelector("i");
            if (document.body.classList.contains("light-mode")) {
                icon.classList.remove("fa-sun");
                icon.classList.add("fa-moon");
            } else {
                icon.classList.remove("fa-moon");
                icon.classList.add("fa-sun");
            }
        });
    }

    // === E. Video Smooth Opacity Adjustment on Scroll ===
    const bgVideo = document.querySelector("video");
    if (bgVideo) {
        window.addEventListener("scroll", () => {
            let scrollY = window.scrollY;
            let opacity = Math.max(0.05, 0.2 - scrollY / 3000); // fades slightly when scrolling
            bgVideo.style.opacity = opacity.toFixed(2);
        });
    }

    // === F. Chat Functions (Only run if all critical chat elements are found) ===
    if (chatMessagesContainer && inputField && sendBtn && incidentActionsContainer && actionsContainer) {

        // Helper: Adds a message to the chat window
        function addMessage(sender, text) {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("chat-message", `${sender}-message`);

            // Add sender label
            const senderLabel = document.createElement("span");
            senderLabel.classList.add("sender-label");
            senderLabel.textContent = sender === 'user' ? "You" : "AI Cyber Responder";
            messageDiv.appendChild(senderLabel);

            // Add text content
            const textParagraph = document.createElement("p");
            textParagraph.innerHTML = text; // Use innerHTML to allow bold/formatting
            messageDiv.appendChild(textParagraph);

            chatMessagesContainer.appendChild(messageDiv);

            // Auto-scroll to the bottom
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

            return messageDiv; // Return element for removing/updating thinking state
        }

        // Helper: Clears and displays the action plan
        function displayActions(actions) {
            actionsContainer.innerHTML = '';
            const placeholder = document.getElementById("action-plan-placeholder");

            if (!actions || actions.length === 0) {
                if (placeholder) {
                    placeholder.style.display = 'block';
                } else {
                    actionsContainer.innerHTML = '<p id="action-plan-placeholder" style="font-style: italic; color: #fff7;">No active incident. Start a conversation in the chatbot to generate a plan.</p>';
                }
                incidentActionsContainer.style.display = 'none';
                return;
            }

            if (placeholder) {
                placeholder.style.display = 'none';
            }

            actions.forEach(action => {
                const priorityClass = `priority-${action.priority}`;
                const card = document.createElement('div');
                card.classList.add('action-card');

                card.innerHTML = `
                    <span class="priority-tag ${priorityClass}">P: ${action.priority}</span>
                    <p>${action.step}</p>
                `;
                actionsContainer.appendChild(card);
            });

            incidentActionsContainer.style.display = 'block';
        }

        // Function to handle AI communication
        async function aiResponse(userMsg) {
            const thinkingMsg = addMessage("bot", "Analyzing incident... generating action plan... stand by.");

            try {
                for (let i = 0; i < 3; i++) {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userMessage: userMsg }),
                    });

                    if (response.status !== 429) {
                        if (!response.ok) {
                            let errorBody = await response.text();
                            try {
                                const errorJson = JSON.parse(errorBody);
                                errorBody = errorJson.error || errorBody;
                            } catch (e) {}
                            thinkingMsg.remove();
                            const errorMsg = `🚨 <strong>API CHAT FAILED:</strong> ${errorBody}. Check your server console.`;
                            addMessage("bot", errorMsg);
                            displayActions([]);
                            return;
                        }

                        const data = await response.json();
                        thinkingMsg.remove();

                        const replyContent = data.reply || "No response received.";
                        addMessage("bot", replyContent);
                        displayActions(data.actions || []);
                        return;
                    }

                    const delay = Math.pow(2, i) * 1000;
                    console.warn(`API Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                thinkingMsg.remove();
                addMessage("bot", "🚨 <strong>Service Unavailable:</strong> The server is currently too busy. Please try again later.");
                displayActions([]);
            } catch (error) {
                if (thinkingMsg) thinkingMsg.remove();
                console.error('Fetch error:', error);
                addMessage("bot", "🚨 <strong>Network Error:</strong> Failed to connect. Is the Flask backend server running on port 5000?");
                displayActions([]);
            }
        }

        function sendMessageHandler() {
            const userMsg = inputField.value.trim();
            if (userMsg === "") return;

            addMessage("user", userMsg);
            inputField.value = "";
            inputField.style.height = '40px';
            aiResponse(userMsg);
        }

        sendBtn.addEventListener("click", sendMessageHandler);

        inputField.addEventListener("keypress", function(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessageHandler();
            }
        });

        inputField.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        addMessage("bot", "Welcome. I am the **AI Cyber Responder**. Please describe the suspected security incident to generate an immediate action plan.");
    }

}); // end DOMContentLoaded


// ---------------------------------------------------------
// FINAL NAV SCROLL FIX (CSS + JS hybrid works even on Live Server)
// ---------------------------------------------------------
(function () {
  const NAV = document.getElementById('nav');
  const getNavHeight = () => (NAV ? NAV.offsetHeight : 80);

  function scrollToWithOffset(targetEl) {
    if (!targetEl) return;
    const offset = getNavHeight();
    const y = targetEl.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // Handle all internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.length <= 1) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        history.pushState(null, '', href);
        setTimeout(() => scrollToWithOffset(target), 10);
      }
    });
  });

  // Handle page reload with hash
  window.addEventListener('load', () => {
    if (location.hash && location.hash.length > 1) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => scrollToWithOffset(target), 50);
      }
    }
  });

  // Bonus: auto set scroll-margin-top to avoid hidden content
  window.addEventListener('resize', () => {
    const offset = getNavHeight() + 10;
    document.querySelectorAll('section[id]').forEach(s => {
      s.style.scrollMarginTop = offset + 'px';
    });
  });
})();
