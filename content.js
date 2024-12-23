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

    // Initial styling of chatbox
    Object.assign(chatbox.style, {
        position: "fixed",
        bottom: "80px",
        left: "20px",
        width: "500px",
        height: "800px",
        // paddingTop: "5px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        display: "flex",
        flexDirection: "column",
        zIndex: "10001",
    });

    // Top-right corner draggable area
    const dragArea = document.createElement("div");
    dragArea.id = "drag-area";
    Object.assign(dragArea.style, {
        position: "absolute",
        top: "0",
        left: "50%", // Set left to 50% to position it at the center
        width: "30px",
        height: "25px",
        cursor: "grab", // Set cursor to grab in this area
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "translateX(-50%)", // Adjust position by 50% of the element's width
    });
    

    // Add a drag indicator image
    const dragImage = document.createElement("img");
    dragImage.src = chrome.runtime.getURL("assets/drag.png"); // Set to your image path
    dragImage.alt = "Drag";
    dragImage.style.width = "10px"; // Adjust image size
    dragImage.style.height = "10px"; // Adjust image size

    dragArea.appendChild(dragImage);

    // Chat messages container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "messages-container";
    Object.assign(messagesContainer.style, {
        flex: "1",
        overflowY: "auto",
        padding: "10px",
        marginTop: "18px"
    });

    // Repopulate chat history
    chatHistory.forEach(({ sender, text }) => {
        appendMessage(sender, text, messagesContainer);
    });

    // Chat input
    const inputContainer = document.createElement("div");
    Object.assign(inputContainer.style, {
        display: "flex",
        padding: "10px",
        borderTop: "1px solid #ccc",
    });

    const input = document.createElement("textarea");
    input.id = "chat-input";
    input.placeholder = "Type your message here...";
    Object.assign(input.style, {
        flex: "1",
        padding: "5px",
        borderRadius: "5px",
        border: "1px solid #e0f7fa",
        resize: "none",
        outline: "2px solid #e0f7fa",
    });


    const sendButton = document.createElement("button");
    sendButton.id = "send-button";

    // Create an image element
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("assets/send.png"); // Ensure the path to the image is correct
    img.alt = "Send"; // Alt text for the image
    img.style.width = "40px"; // Adjust image size if needed
    img.style.height = "30px"; // Adjust image size if needed

    // Append the image to the button
    sendButton.appendChild(img);

    Object.assign(sendButton.style, {
        marginLeft: "5px",
        padding: "5px 10px",
        borderRadius: "5px",
        border: "none",
        // backgroundColor: "#007bff",
        color: "#fff",
        cursor: "pointer",
        display: "flex", // Use flexbox to align the image
        justifyContent: "center", // Center the image
        alignItems: "center", // Center the image vertically
    });


    input.addEventListener("keydown", (e) => {
        // Check if Enter is pressed without Shift
        if (e.key === "Enter" && !e.shiftKey && document.activeElement === input && input.value.trim() !== "") {
            handleSendMessage(); 
            input.value = ""; // Clear the input after sending the message
            e.preventDefault(); // Prevent default behavior of Enter key (new line or form submit)
        }
        // Allow Shift + Enter to create a new line
        else if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault(); // Prevent default behavior (submit form or other actions)
            input.value += "\n"; // Add a newline character
        }
    });
    

    

    sendButton.addEventListener("click", handleSendMessage);

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chatbox.appendChild(messagesContainer);
    chatbox.appendChild(inputContainer);
    chatbox.appendChild(dragArea); // Add the draggable area

    document.body.appendChild(chatbox);

    // Implementing drag functionality
    let isDragging = false;
    let offsetX, offsetY;

    dragArea.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - chatbox.getBoundingClientRect().left;
        offsetY = e.clientY - chatbox.getBoundingClientRect().top;
        chatbox.style.cursor = "grabbing"; // Change cursor to grabbing when dragging
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            chatbox.style.left = `${e.clientX - offsetX}px`;
            chatbox.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        chatbox.style.cursor = "default"; // Revert cursor to default when not dragging
    });
}



function removeChatbox() {
    const chatbox = document.getElementById('ai-chatbox');
    if (chatbox) {
        chatbox.remove();
    }
}
let chatHistory = []; // Store the chat history

async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message);
    chatHistory.push({ sender: "You", text: message }); // Add user message to history

    input.value = "";

    // Process the message with Gemini API
    const response = await processMessageWithGeminiAPI(chatHistory, "AIzaSyCh2eFENy84tEICT3Kc4nHmgVho2Yu5GSU");

    if (response) {
        appendMessage("AI", response);
        chatHistory.push({ sender: "AI", text: response }); // Add AI message to history
    } else {
        appendMessage("AI", "Sorry, I couldn't process your request.");
    }
}

function appendMessage(sender, message, container = null) {
    const messagesContainer = container || document.getElementById('messages-container');
    const messageDiv = document.createElement("div");

    // Escape HTML to prevent breaking HTML structure inside code blocks
    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return char;
            }
        });
    }

    // If the sender is "You", skip formatting and just preserve code blocks as is
    if (sender === "You") {
        message = message.replace(/```([^`]+)```/g, (match, codeBlock) => {
            const escapedCode = escapeHtml(codeBlock);
            return `<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${escapedCode}</pre>`;
        });

        message = message.replace(/`([^`]+)`/g, (match, inlineCode) => {
            const escapedCode = escapeHtml(inlineCode);
            return `<code style="background-color: #f5f5f5; padding: 2px 5px; border-radius: 5px;">${escapedCode}</code>`;
        });

        // Handle line breaks for "You" (newlines to <br> tags)
        message = message.replace(/\n/g, '<br>');
    } else {
        // Format code blocks (for other senders)
        message = message.replace(/```([^`]+)```/g, (match, codeBlock) => {
            const escapedCode = escapeHtml(codeBlock);
            return `<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">${escapedCode}</pre>`;
        });

        message = message.replace(/`([^`]+)`/g, (match, inlineCode) => {
            const escapedCode = escapeHtml(inlineCode);
            return `<code style="background-color: #f5f5f5; padding: 2px 5px; border-radius: 5px;">${escapedCode}</code>`;
        });

        // Prevent headings inside code blocks by temporarily replacing code block text with placeholders
        const codeBlockPlaceholders = [];
        message = message.replace(/<pre[^>]*>(.*?)<\/pre>/gs, (match) => {
            const placeholder = `{{CODEBLOCK_${codeBlockPlaceholders.length}}}`;
            codeBlockPlaceholders.push(match);
            return placeholder;
        });

        // Format bold text
        message = message.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Format italic text
        message = message.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Format headings (exclude #include statements)
        message = message.replace(/^(#{1,6})\s*(?!include)(.*)$/gm, (match, hash, text) => {
            const level = hash.length;
            return `<h${level}>${text}</h${level}>`;
        });

        // Restore code blocks from placeholders
        message = message.replace(/{{CODEBLOCK_\d+}}/g, (placeholder) => {
            const index = placeholder.match(/\d+/)[0];
            return codeBlockPlaceholders[index];
        });

        // Handle line breaks (newlines to <br> tags)
        message = message.replace(/\n/g, '<br>');
    }

    // Add sender and message content
    messageDiv.innerHTML = `${message}`;

    // Apply styling based on sender
    Object.assign(messageDiv.style, {
        padding: "5px",
        paddingLeft: "10px",
        margin: sender === "You" 
            ? "5px 20px 7px 0"  // 10px margin-bottom when sender is "You"
            : "5px 0 20px 0",     // 20px margin-bottom when sender is not "You"
        borderRadius: "5px",
        backgroundColor: sender === "You" ? "#f1f1f1" : "#e0f7fa",
        alignSelf: sender === "You" ? "flex-start" : "flex-end",
    });

    messagesContainer.appendChild(messageDiv);
    scrollToBottom()// Scroll to bottom
}


function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    const targetScrollTop = messagesContainer.scrollHeight;
    const currentScrollTop = messagesContainer.scrollTop;
    const scrollDistance = targetScrollTop - currentScrollTop;

    const duration = 1000; // Duration of the scroll in milliseconds
    let startTime = null;

    function scrollStep(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        if (progress < 1) {
            messagesContainer.scrollTop = currentScrollTop + scrollDistance * progress;
            window.requestAnimationFrame(scrollStep);
        } else {
            messagesContainer.scrollTop = targetScrollTop; // Ensure final scroll position
        }
    }

    window.requestAnimationFrame(scrollStep);
}



async function processMessageWithGeminiAPI(chatHistory, apiKey) {
    try {
        // Map chat history to the required format
        const contents = chatHistory.map((message) => ({
            role: message.sender === "You" ? "user" : "model",
            parts: [
                { text: message.text },
            ],
        }));

        // console.log("Payload:", JSON.stringify({ contents }, null, 2));
        console.log(contents);
        console.log(chatHistory);


        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ contents }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API returned status ${response.status}:`, errorText);
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    } catch (error) {
        console.error("Error processing message:", error);
        return null;
    }
}
