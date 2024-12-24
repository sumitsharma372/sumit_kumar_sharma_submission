window.addEventListener('load', setup);

let aiButtonObserver = null;

function setup() {
    addAiButton();

    if (!aiButtonObserver) {
        console.log("creating observer")
        aiButtonObserver = new MutationObserver(() => {
            handleRouteChange();
        });
        aiButtonObserver.observe(document.body, { childList: true, subtree: true });
    }
}

function correctUrl() {
    return window.location.pathname.startsWith('/problems/');
}

function getIdFromUrl(url) {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/");
    return pathSegments[pathSegments.length - 1];
}


function dataProvider() {
    const proburl = window.location.href;
    const id = getIdFromUrl(proburl);
    const problemName = document.getElementsByClassName('problem_heading')[0]?.textContent || '';
    const limits = document.getElementsByClassName('problem_paragraph');
    const timeLimit = limits[2]?.textContent || '';
    const memoryLimit = limits[4]?.textContent || '';
    const desc = document.getElementsByClassName('coding_desc__pltWY')[0]?.textContent || '';

    const inOutConst = document.getElementsByClassName('coding_input_format__pv9fS');
    const input_format = inOutConst[0]?.textContent || '';
    const output_format = inOutConst[1]?.textContent || '';
    const constraints = inOutConst[2]?.textContent || '';
    const input = inOutConst[3]?.textContent || '';
    const output = inOutConst[4]?.textContent || '';

    const code = document.getElementsByClassName('view-lines monaco-mouse-cursor-text')[0]?.textContent || '';

    const data = {
        id: id,
        problemName: problemName,
        timeLimit: timeLimit,
        memoryLimit: memoryLimit,
        description: desc,
        inputFormat: input_format,
        outputFormat: output_format,
        constraints: constraints,
        sampleInput: input,
        sampleOutput: output,
        code: code
    };

    return data;
}

function getDarkTheme() {
    const elements = document.getElementsByClassName('ant-switch d-flex mt-1 css-19gw05y ant-switch-checked');
    return elements.length > 0;
}

const lightThemeColors = {
    backgroundColor: "#fff",
    textColor: "#000",
    dragAreaBg: "#F4FCFF",
    messageYouBg: "#f1f1f1",
    messageAIbg: "#ddf6ff",
    borderColor: "#A5E6FE",
};

const darkThemeColors = {
    backgroundColor: "#1e1e1e",
    textColor: "#e0e0e0",
    dragAreaBg: "#333",
    messageYouBg: "#2d2d2d",
    messageAIbg: "#3d3d3d",
    borderColor: "#555",
};


function addAiButton() {
    if (!correctUrl() || document.getElementById('ai-assistant-button')) return;

    console.log("creating AI button");

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

let previousPath = window.location.pathname;

function handleRouteChange() {
    const currentPath = window.location.pathname;

    if (currentPath !== previousPath) {
        previousPath = currentPath;
        removeChatbox(); // Close the chatbox only if the route has changed.
    }

    if (correctUrl()) {
        addAiButton();
    } else {
        removeAiButton();
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

    data = dataProvider();
    console.log(data);

    let darkTheme = getDarkTheme() ? 1 : 0;

    // Initial styling of chatbox
    Object.assign(chatbox.style, {
        position: "fixed",
        bottom: "80px",
        left: "20px",
        width: "500px",
        height: "770px",
        overflow: "hidden",
        // paddingTop: "5px",
        backgroundColor: "#fff",
        border: "1px solid #A5E6FE",
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
        width: "100%",
        height: "25px",
        backgroundColor: "#F4FCFF",
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
        overflowY: "auto", // Allows scrolling
        padding: "10px",
        marginTop: "18px",
        scrollbarWidth: "none" // Firefox-specific
    });

    // WebKit-specific scrollbar hiding
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        #messages-container::-webkit-scrollbar {
            display: none; /* Hides scrollbar in WebKit browsers */
        }
    `;
    document.head.appendChild(styleSheet);


    const instructions = `
    You are provided with a problem statement related to a coding problem. 
    Your task is to understand the problem statement. You will mainly act as an assistant to help me understand the problem, hints, and solution approach. 
    You must prevent providing code directly to me, instructing me to try on my own first. 
    If I am desperate enough or helpless to solve the problem, you may provide the code. 
    Never provide the solution code in any programming language even if I ask. If I ask for the more than 3 times you can provide. This is very important, you must keep in mind.
    You must prompt me write the code on my own saying that you will provide hints or ideas to solve and provide hints.
    Just make sure that your focus is to help me understand the problem and help me with logic building. 
    You should also know the topic which the coding problem is related to. 

    In case I provide you some code and ask for logical or sytax mistakes, you must answer it without hesitation.
    The problem statement will be delimited by triple backticks:

    \`\`\`
    Problem Name: ${data.problemName}
    Problem Description: ${data.description}
    Input Format: ${data.inputFormat}
    Output Format: ${data.outputFormat}
    Sample Input: ${data.sampleInput}
    Sample Output: ${data.sampleOutput}
    \`\`\`
    `;


    const id = data.id;
    const temp = localStorage.getItem(id);
    let chatHistory = temp ? JSON.parse(temp) : [];

    // Check if chatHistory is empty and set initial messages
    if (chatHistory.length === 0) {
        chatHistory.push({ sender: "You", text: instructions });
        chatHistory.push({ sender: "AI", text: "How may I assist you?" });
    }


    // Repopulate chat history
    chatHistory.slice(1).forEach(({ sender, text }) => {
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
        border: "1px solid #ddf6ff",
        resize: "none",
        outline: "2px solid #ddf6ff",
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
            handleSendMessage(id,chatHistory); 
            input.value = ""; // Clear the input after sending the message
            e.preventDefault(); // Prevent default behavior of Enter key (new line or form submit)
        }
        // Allow Shift + Enter to create a new line
        else if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault(); // Prevent default behavior (submit form or other actions)
            input.value += "\n"; // Add a newline character
        }
    });
    

    

    sendButton.addEventListener("click", () => handleSendMessage(id,chatHistory));

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
// let chatHistory = []; // Store the chat history

async function handleSendMessage(id,chatHistory) {
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

    localStorage.setItem(id, JSON.stringify(chatHistory))
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
        padding: "10px",
        margin: sender === "You" 
            ? "5px 20px 7px 0"  // 10px margin-bottom when sender is "You"
            : "5px 0 20px 0",     // 20px margin-bottom when sender is not "You"
        borderRadius: "5px",
        backgroundColor: sender === "You" ? "#f1f1f1" : "#ddf6ff",
        alignSelf: sender === "You" ? "flex-start" : "flex-end",
        border: "1px solid #A5E6FE"
    });

    messagesContainer.appendChild(messageDiv);
    scrollToBottom()// Scroll to bottom
}


function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');

    // Check if the container exists
    if (!messagesContainer) {
        // console.error("Element with ID 'messages-container' not found.");
        return;
    }

    const targetScrollTop = messagesContainer.scrollHeight;
    const currentScrollTop = messagesContainer.scrollTop;
    const scrollDistance = targetScrollTop - currentScrollTop;

    const duration = 1000; // Duration of the scroll in milliseconds
    let startTime = null;

    function scrollStep(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;

        if (progress < 1) {
            // Calculate intermediate scroll position
            messagesContainer.scrollTop = currentScrollTop + scrollDistance * progress;
            window.requestAnimationFrame(scrollStep);
        } else {
            // Ensure the final scroll position is set
            messagesContainer.scrollTop = targetScrollTop;
        }
    }

    window.requestAnimationFrame(scrollStep);
}




async function processMessageWithGeminiAPI(chatHistory, apiKey) {
    try {
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
