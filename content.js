window.addEventListener('load', setup);

let aiButtonObserver = null;

function setup() {
    addAiButton();

    if (!aiButtonObserver) {
        aiButtonObserver = new MutationObserver(() => {
            handleRouteChange();
        });
        aiButtonObserver.observe(document.body, { childList: true, subtree: true });
    }
}

function correctUrl() {
    return window.location.pathname.startsWith('/problems/');
}

function addAiButton() {
    if (!correctUrl() || document.getElementById('ai-assistant-button')) return;

    const assistantButton = document.createElement("div");
    assistantButton.id = "ai-assistant-button";

    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("assets/icon.png");
    logo.alt = "AI Assistant Logo";

    Object.assign(logo.style, {
        width: "40px",
        height: "40px",
        display: "block",
    });

    assistantButton.appendChild(logo);

    Object.assign(assistantButton.style, {
        position: "fixed",
        bottom: "20px",
        left: "20px",
        backgroundColor: "transparent",
        padding: "0",
        border: "none",
        cursor: "pointer",
        zIndex: "10000",
    });

    assistantButton.addEventListener("click", toggleChatbox);

    document.body.appendChild(assistantButton);
}

function removeAiButton() {
    const existingButton = document.getElementById('ai-assistant-button');
    if (existingButton) {
        existingButton.remove();
    }
}

function handleRouteChange() {
    if (correctUrl()) {
        addAiButton();
    } else {
        removeAiButton();
        removeChatbox();
    }
}

function toggleChatbox() {
    if (document.getElementById('ai-chatbox')) {
        removeChatbox();
    } else {
        createChatbox();
    }
}

function createChatbox() {
    const chatbox = document.createElement("div");
    chatbox.id = "ai-chatbox";

    Object.assign(chatbox.style, {
        position: "fixed",
        bottom: "80px",
        left: "20px",
        width: "300px",
        height: "400px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: "10001",
    });

    // Chat messages container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "messages-container";
    Object.assign(messagesContainer.style, {
        flex: "1",
        overflowY: "auto",
        padding: "10px",
    });

    // Chat input
    const inputContainer = document.createElement("div");
    Object.assign(inputContainer.style, {
        display: "flex",
        padding: "10px",
        borderTop: "1px solid #ccc",
    });

    const input = document.createElement("input");
    input.type = "text";
    input.id = "chat-input";
    Object.assign(input.style, {
        flex: "1",
        padding: "5px",
        borderRadius: "5px",
        border: "1px solid #ccc",
    });

    const sendButton = document.createElement("button");
    sendButton.id = "send-button";
    sendButton.textContent = "Send";
    Object.assign(sendButton.style, {
        marginLeft: "5px",
        padding: "5px 10px",
        borderRadius: "5px",
        border: "none",
        backgroundColor: "#007bff",
        color: "#fff",
        cursor: "pointer",
    });

    sendButton.addEventListener("click", handleSendMessage);

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chatbox.appendChild(messagesContainer);
    chatbox.appendChild(inputContainer);

    document.body.appendChild(chatbox);
}

function removeChatbox() {
    const chatbox = document.getElementById('ai-chatbox');
    if (chatbox) {
        chatbox.remove();
    }
}

async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message);

    input.value = "";

    // Process the message with Gemini API
    const response = await processMessageWithGeminiAPI(message,"AIzaSyCh2eFENy84tEICT3Kc4nHmgVho2Yu5GSU");

    if (response) {
        appendMessage("AI", response);
    } else {
        appendMessage("AI", "Sorry, I couldn't process your request.");
    }
}

function appendMessage(sender, message) {
    const messagesContainer = document.getElementById('messages-container');
    const messageDiv = document.createElement("div");
    messageDiv.textContent = `${sender}: ${message}`;
    Object.assign(messageDiv.style, {
        padding: "5px",
        margin: "5px 0",
        borderRadius: "5px",
        backgroundColor: sender === "You" ? "#f1f1f1" : "#e0f7fa",
        alignSelf: sender === "You" ? "flex-start" : "flex-end",
    });
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
}

async function processMessageWithGeminiAPI(message, apiKey) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: message },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    } catch (error) {
        console.error("Error processing message:", error);
        return null;
    }
}