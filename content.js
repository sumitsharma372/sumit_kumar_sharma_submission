window.addEventListener('load', setup);

let aiButtonObserver = null;
let themeObserver = null;

let ai_apiKey = '';

async function setup() {
    addAiButton();  

    if (!aiButtonObserver) {
        console.log("Creating observer for AI button...");
        aiButtonObserver = new MutationObserver(() => {
            handleRouteChange();
        });
        aiButtonObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!themeObserver) {
        console.log("Creating observer for theme changes...");
        observeThemeChanges();
    }
}


function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('az_ai_apikey', (result) => {
            resolve(result.az_ai_apikey || null);
        });
    });
}




const drag_white = chrome.runtime.getURL("assets/drag_white.png"), drag = chrome.runtime.getURL("assets/drag.png");
const icon_light = chrome.runtime.getURL("assets/icon_light.png"), icon_dark = chrome.runtime.getURL("assets/icon_dark.png");
const send_light = chrome.runtime.getURL("assets/send_light.png");// icon_dark = chrome.runtime.getURL("assets/icon_dark.png");


function observeThemeChanges() {
    const themeSwitchElement = document.getElementsByClassName('ant-switch d-flex mt-1 css-19gw05y')[0];
    
    if (!themeSwitchElement) {
        console.error("Theme switch element not found!");
        return;
    }

    // MutationObserver to detect changes in the class list
    const observer = new MutationObserver(() => {
        const isDarkTheme = themeSwitchElement.classList.contains('ant-switch-checked');
        console.log("Theme changed:", isDarkTheme ? "Dark" : "Light");
        updateChatboxTheme(isDarkTheme);
    });

    observer.observe(themeSwitchElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
}


function updateChatboxTheme(isDarkTheme) {
    const chatbox = document.getElementById('ai-chatbox');
    if (!chatbox) return;

    const themeColors = isDarkTheme ? darkThemeColors : lightThemeColors;

    // Update chatbox styles
    Object.assign(chatbox.style, {
        backgroundColor: themeColors.backgroundColor,
        borderColor: themeColors.borderColor,
    });

    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        Object.assign(messagesContainer.style, {
            color: themeColors.textColor,
            borderColor: themeColors.borderColor,
        });
    }

    // Update each message's style
    const messageDivs = document.querySelectorAll('.chat-message');
    messageDivs.forEach((messageDiv) => {
        if (messageDiv.classList.contains('from-you')) {
            messageDiv.style.backgroundColor = isDarkTheme ? '#2E3440' : '#f1f1f1';
            messageDiv.style.color = isDarkTheme ? '#f1f1f1' : '#000000';
            messageDiv.style.borderWidth = isDarkTheme ? '1px' : '2px'; // Decrease border width in dark theme
        } else {
            messageDiv.style.backgroundColor = isDarkTheme ? '#2b384e' : '#ddf6ff';
            messageDiv.style.color = isDarkTheme ? '#ffffff' : '#000000';
            messageDiv.style.borderWidth = isDarkTheme ? '1px' : '2px'; // Decrease border width in dark theme
        }
        messageDiv.style.borderColor = themeColors.borderColor
    });


    const dragDiv = document.getElementById('drag-area');
    if(dragDiv){
        Object.assign(dragDiv.style,{
            backgroundColor: themeColors.dragAreaBg,
        })
    }

    const imgElement = dragDiv.querySelector('img');
    if (imgElement) {
        imgElement.src = isDarkTheme ? drag_white : drag;
    }

    const inputContainer = document.getElementsByClassName('input-container')[0];
    const promptArea = document.getElementsByClassName('prompt-area')[0];

    inputContainer.style.backgroundColor = themeColors.backgroundColor;
    promptArea.style.backgroundColor = themeColors.backgroundColor;
    promptArea.style.color = themeColors.textColor;
    promptArea.style.outlineWidth = isDarkTheme ? '0' : '2px';


    const preElements = chatbox.querySelectorAll('pre');
    preElements.forEach((pre) => {
        pre.style.backgroundColor = isDarkTheme ? '#2E3440' : '#f5f5f5';
        pre.style.color = isDarkTheme ? '#f1f1f1' : '#000000';
    });

    const codeElements = chatbox.querySelectorAll('code');
    codeElements.forEach((code) => {
        code.style.backgroundColor = isDarkTheme ? '#2B384E' : '#f5f5f5';
    });

    const aiButtonImg = document.getElementById('ai-assistant-button').querySelector('img');
    aiButtonImg.src = isDarkTheme ? icon_dark : icon_light;
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
    backgroundColor: "#1F2836",
    textColor: "#E9E9EB",
    dragAreaBg: "#1F2836",
    messageYouBg: "#2E3440",
    messageAIbg: "#2b384e",
    borderColor: "#5C7E95",
};


function addAiButton() {
    if (!correctUrl() || document.getElementById('ai-assistant-button')) return;


    const assistantButton = document.createElement("div");
    assistantButton.id = "ai-assistant-button";

    const isDarkTheme = getDarkTheme();

    const logo = document.createElement("img");
    logo.src = isDarkTheme ? icon_dark : icon_light;
    logo.alt = "AI Assistant Logo";

    Object.assign(logo.style, {
        width: "40px",
        height: "40px",
        display: "block",
    });

    assistantButton.appendChild(logo);

    Object.assign(assistantButton.style, {
        position: "fixed",
        bottom: "30px",
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
        if(document.querySelector('.coding_list__V_ZOZ').classList.contains('coding_card_mod_active___Nidq')){
            data = dataProvider();
            console.log(data);
        }
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

async function createChatbox() {
    ai_apiKey = await getApiKey();
    if (!ai_apiKey) {
        console.log("API key is missing. Chatbox will not be created.");
        window.alert("Please Enter the API Key by clicking the extension button")
        return;
    }
    const chatbox = document.createElement("div");
    chatbox.id = "ai-chatbox";

    // data = dataProvider();
    // console.log(data);

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
        border: "1px solid #A4E6FF",
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
        You are acting as an AI assistant to help me with coding problems. Your role is to assist me in understanding the problem, offer helpful hints, and suggest approaches to find a solution.
        
        It's important that you guide me in a way that encourages independent thinking and problem-solving. Rather than simply providing the solution, help me develop my skills by suggesting logical steps, breaking down the problem, or pointing out any relevant concepts that might help me. 
        Your goal is to foster learning, so if I ask for the solution directly, kindly remind me to give it a try first. If I feel completely stuck after multiple attempts (more than three times), you may provide the solution, but this should be the last resort. 

        In case I share code with you, please help me identify logical errors, syntax mistakes, or areas that need improvement. Be direct and clear in your explanations, but also considerate of my learning process.
        
        Here’s the problem statement, which will be provided in triple backticks:

        \`\`\`
        Problem Name: ${data.problemName}
        Problem Description: ${data.description}
        Input Format: ${data.inputFormat}
        Output Format: ${data.outputFormat}
        Sample Input: ${data.sampleInput}
        Sample Output: ${data.sampleOutput}
        \`\`\`

        Keep in mind that my primary goal is to learn. So, whenever you provide a hint, try to make it clear how that hint connects to the overall solution. Also, make sure you understand the underlying topic related to the problem so you can offer relevant advice. 
        
        Here are a few strategies you might suggest:
        - Breaking the problem into smaller, manageable parts.
        - Drawing on fundamental concepts or algorithms that could apply to the problem.
        - Offering insights into efficient ways of approaching a solution, without giving away the final code.

        Feel free to ask clarifying questions if needed. The aim is to make this a collaborative process where I am guided towards the solution, not simply given the answer. Let's work together to solve this problem and improve my coding skills!

        Always remember: your role is to be a guide, not a solution provider. Make sure your hints or advice are geared toward helping me understand and grow my problem-solving abilities.
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
    inputContainer.classList.add('input-container');
    Object.assign(inputContainer.style, {
        display: "flex",
        padding: "10px",
        // borderTop: "1px solid #ccc",
    });

    const input = document.createElement("textarea");
    input.classList.add('prompt-area');
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
    // img.src = chrome.runtime.getURL("assets/send.png"); // Ensure the path to the image is correct
    img.src = send_light;
    img.alt = "Send"; // Alt text for the image
    img.style.width = "40px"; // Adjust image size if needed
    img.style.height = "40px"; // Adjust image size if needed

    // Append the image to the button
    sendButton.appendChild(img);

    Object.assign(sendButton.style, {
        marginLeft: "5px",
        padding: "5px 10px",
        borderRadius: "5px",
        border: "none",
        background: "linear-gradient(90deg, hsla(0, 0%, 100%, .6), #eaf1fd)", // Directly use the gradient values
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

    updateChatboxTheme(darkTheme);
}



function removeChatbox() {
    const chatbox = document.getElementById('ai-chatbox');
    if (chatbox) {
        chatbox.remove();
    }
}
// let chatHistory = []; // Store the chat history

async function handleSendMessage(id, chatHistory) {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    appendMessage("You", message);
    chatHistory.push({ sender: "You", text: message }); // Add user message to history

    input.value = "";

    try {
        const apiKey = await getApiKey();
        console.log(apiKey);

        const response = await processMessageWithGroqAPI(chatHistory, ai_apiKey);

        if (response) {
            appendMessage("AI", response);
            chatHistory.push({ sender: "AI", text: response }); // Add AI message to history
        } else {
            appendMessage("AI", "Sorry, I couldn't process your request.");
        }

        // Save updated chat history in localStorage
        localStorage.setItem(id, JSON.stringify(chatHistory));
    } catch (error) {
        console.error("Error retrieving API key:", error);
        appendMessage("AI", "Sorry, the API key is missing or invalid.");
    }
}


function appendMessage(sender, message, container = null) {
    const messagesContainer = container || document.getElementById('messages-container');
    const messageDiv = document.createElement("div");


    const isDarkTheme = getDarkTheme();
    const themeColors = isDarkTheme ? darkThemeColors : lightThemeColors;
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
    const codeBlockStyle = isDarkTheme 
    ? 'background-color: #2E3440; color: #f1f1f1;' // Dark theme style
    : 'background-color: #f5f5f5; color: #000000;'; // Light theme style
    if (sender === "You") {
        message = message.replace(/```([^`]+)```/g, (match, codeBlock) => {
            const escapedCode = escapeHtml(codeBlock);
            return `<pre style="${codeBlockStyle} padding: 10px; border-radius: 5px;">${escapedCode}</pre>`;
        });

        message = message.replace(/`([^`]+)`/g, (match, inlineCode) => {
            const escapedCode = escapeHtml(inlineCode);
            return `<code style="background-color: ${isDarkTheme ? '#2B384E' : '#f5f5f5'}; padding: 2px 5px; border-radius: 5px;">${escapedCode}</code>`;
        });

        // Handle line breaks for "You" (newlines to <br> tags)
        message = message.replace(/\n/g, '<br>');
        
    } else {
        // Format code blocks (for other senders)
        message = message.replace(/```([^`]+)```/g, (match, codeBlock) => {
            const escapedCode = escapeHtml(codeBlock);
            return `<pre style="${codeBlockStyle} padding: 10px; border-radius: 5px;">${escapedCode}</pre>`;
        });

        message = message.replace(/`([^`]+)`/g, (match, inlineCode) => {
            const escapedCode = escapeHtml(inlineCode);
            return `<code style="background-color: ${isDarkTheme ? '#2B384E' : '#f5f5f5'}; padding: 2px 5px; border-radius: 5px;">${escapedCode}</code>`;
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
    messageDiv.classList.add('chat-message');
    messageDiv.classList.add(sender === "You" ? 'from-you' : 'from-other');


    // Apply styling based on sender
    Object.assign(messageDiv.style, {
        padding: "10px",
        margin: sender === "You" 
            ? "5px 20px 7px 0"  // 10px margin-bottom when sender is "You"
            : "5px 0 20px 0",     // 20px margin-bottom when sender is not "You"
        borderRadius: "5px",
        backgroundColor: sender === "You" ? themeColors.messageYouBg : themeColors.messageAIbg,
        color: themeColors.textColor,
        alignSelf: sender === "You" ? "flex-start" : "flex-end",
        border: `1px solid ${themeColors.borderColor}`
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


async function processMessageWithGroqAPI(chatHistory, apiKey) {
    try {
        // Prepare the messages in the format required by Groq API
        const messages = chatHistory.map((message) => ({
            role: message.sender === "You" ? "user" : "assistant",  // Adjust the role as per your requirement
            content: message.text,
        }));

        console.log("Messages:", messages);

        // Make the API request
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",  // Specify the model you want to use
                messages: messages,
            }),
        });

        // Handle errors in the response
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API returned status ${response.status}:`, errorText);
            throw new Error(`API returned status ${response.status}`);
        }

        // Parse the response
        const data = await response.json();
        console.log("Response data:", data);

        // Extract the content from the assistant's response
        const assistantResponse = data.choices?.[0]?.message?.content || "No response received.";
        return assistantResponse;

    } catch (error) {
        console.error("Error processing message:", error);
        return null;
    }
}
