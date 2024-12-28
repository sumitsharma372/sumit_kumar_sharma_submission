window.addEventListener('load', setup);

let aiButtonObserver = null;
let themeObserver = null;

let ai_apiKey = '';
let data = {};
let interceptedData = null;


async function setup() {
    addAiButton();  

    if (!aiButtonObserver) {
        aiButtonObserver = new MutationObserver(() => {
            handleRouteChange();
        });
        aiButtonObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (!themeObserver) {
        observeThemeChanges();
    }
    injectScript();
    document.addEventListener('keydown', handleKeyboardShortcut);
}

function handleKeyboardShortcut(event) {
    const aiButton = document.getElementById('ai-assistant-button');    
    if (aiButton && event.altKey && event.key === 'a') {
        const chatbox = document.getElementById('ai-chatbox');
        if (!chatbox) {
            createChatbox();
        }
    }
}


function injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function () {
        this.remove(); // Clean up the script element after execution
    };
    (document.head || document.documentElement).appendChild(script);
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
const send_light = chrome.runtime.getURL("assets/send_light.png");


function observeThemeChanges() {
    const themeSwitchElement = document.getElementsByClassName('ant-switch d-flex mt-1 css-19gw05y')[0];
    
    if (!themeSwitchElement) {
        return;
    }

    if (themeObserver) {
        themeObserver.disconnect();
    }

    const isDarkTheme = themeSwitchElement.classList.contains('ant-switch-checked');
    const aiButtonImg = document.getElementById('ai-assistant-button').querySelector('img');
    if(aiButtonImg){
        aiButtonImg.src = isDarkTheme ? icon_dark : icon_light;
    }

    themeObserver = new MutationObserver(() => {
        const isDarkTheme = themeSwitchElement.classList.contains('ant-switch-checked');
        updateChatboxTheme(isDarkTheme);
        const aiButtonImg = document.getElementById('ai-assistant-button').querySelector('img');
        if(aiButtonImg){
            aiButtonImg.src = isDarkTheme ? icon_dark : icon_light;
        }

    });

    themeObserver.observe(themeSwitchElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    const isDarkThemeInitial = themeSwitchElement.classList.contains('ant-switch-checked');
    updateChatboxTheme(isDarkThemeInitial);
}



function getScrollbarStyles(darkTheme) {
    return `
        #messages-container::-webkit-scrollbar {
            width: 6px; /* Sets the width of the scrollbar */
        }let styleSheet = document.getElementById("scrollbar-styles");

    if (!styleSheet) {
        // Create the style element if it doesn't exist
        styleSheet = document.createElement("style");
        styleSheet.id = "scrollbar-styles";
        document.head.appendChild(styleSheet);
    }

        #messages-container::-webkit-scrollbar-thumb {
            background-color: ${darkTheme ? "#2B384E" : "#badce8"}; /* Thumb color based on theme */
            border-radius: 10px; /* Rounds the corners of the thumb */
        }

        #messages-container::-webkit-scrollbar-thumb:hover {
            background-color: ${darkTheme ? "#161D29" : "#badce8"}; /* Darkens the thumb when hovered */
        }

        .code-container pre::-webkit-scrollbar {
            height: 6px; /* Sets the height of the horizontal scrollbar */
        }

        .code-container pre::-webkit-scrollbar-thumb {
            background-color: ${darkTheme ? "#2B384E" : "#badce8"}; /* Thumb color based on theme */
            border-radius: 10px; /* Rounds the corners of the thumb */
        }

        .code-container pre::-webkit-scrollbar-thumb:hover {
            background-color: ${darkTheme ? "#161D29" : "#badce8"}; /* Darkens the thumb when hovered */
        }
    `;
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
        messageDiv.style.color = isDarkTheme ? "#E9E9EB" : "#2A2E34";
        if (messageDiv.classList.contains('from-you')) {
            messageDiv.style.backgroundColor = isDarkTheme ? '#2E3440' : '#f1f1f1';
        } else {
            messageDiv.style.backgroundColor = isDarkTheme ? '#2b384e' : '#ddf6ff';
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

    const codeElements = chatbox.querySelectorAll('code:not(pre code)');
    codeElements.forEach((code) => {
        code.style.backgroundColor = isDarkTheme ? '#2B384E' : '#f5f5f5';
    });
    

    let styleSheet = document.getElementById("scrollbar-styles");

    if (styleSheet) {
        styleSheet.remove(); // Remove the old styleSheet if it exists
    }

    styleSheet = document.createElement("style");
    styleSheet.id = "scrollbar-styles";

    styleSheet.textContent = getScrollbarStyles(isDarkTheme); // Set the new styles

    document.head.appendChild(styleSheet);

    const codeLanguage = document.querySelectorAll('.code-language');
    codeLanguage.forEach((codeLan) => {
        codeLan.style.color = isDarkTheme ? "#E9E9EB" : "#2A2E34";
        codeLan.style.backgroundColor = isDarkTheme ? "#3d4b63" : "#f0f0f0";
    });

    const copyBtns = document.querySelectorAll('.copy-button-chatbox');
    copyBtns.forEach((btn) => {
        btn.style.color = isDarkTheme ? '#ffffff' : '#333';
        btn.style.backgroundColor = isDarkTheme ? '#4a4a4a' : '#f0f0f0';
    }) 

    const closeBtn = document.getElementById("ai-close-button");
    closeBtn.style.color = isDarkTheme ? "#4d6182":"#9ee0f7";

    const responseTaglines = document.querySelectorAll('.response-tagline');
    responseTaglines.forEach(tag => {
        tag.style.backgroundColor = isDarkTheme ? '#283247' : '#f5f5f5';
    })
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

function formatProblem(problem) {
    const hints = problem?.hints || {};
    const { solution_approach, ...hintsWithoutSolution } = hints;
    const proburl = window.location.href;
    const id = getIdFromUrl(proburl);
    
    return {
      id: id,
      problem_name: problem?.title || null,
      problem_description: problem?.body || null,
      input_format: problem?.input_format || null,
      output_format: problem?.output_format || null,
      sample_input: problem?.samples?.[0]?.input || null,
      sample_output: problem?.samples?.[0]?.output || null,
      constraints: problem?.constraints || null,
      time_limit: problem?.time_limit_sec || null,
      memory_limit: problem?.memory_limit_mb || null,
      hints: hintsWithoutSolution ? JSON.stringify(hintsWithoutSolution,null,4) : null, // Stringify the hints object without solution_approach
      solution_approach: solution_approach || null, // Keep solution_approach as a separate field
      editorial_code: problem?.editorial_code?.[0]?.code || null,
      editorial_code_language: problem?.editorial_code?.[0]?.language || null,
      latest_code_provided_by_the_user: "",
      coding_language_used_by_the_user: ""
    };
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
        zIndex: "110",
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

    // Check if the route has changed
    if (currentPath !== previousPath) {
        // console.log("Route changed from:", previousPath, "to:", currentPath);
        previousPath = currentPath; // Update the previous path
        removeChatbox(); // Close the chatbox only if the route has changed
    }

    // Handle theme changes and AI button based on the current route
    if (correctUrl()) {
        window.addEventListener('xhrDataFetched', (event) => {
            interceptedData = JSON.parse(event.detail.response)?.data; // Store the intercepted data
            // console.log("Intercepted Data:", interceptedData);
        
            // Send the intercepted data to the background script if needed
            chrome.runtime.sendMessage({
                type: "interceptedRequest",
                data: interceptedData,
            });
        });   
        addAiButton();
        observeThemeChanges(); // Re-initialize theme observer when on a correct route
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

function formatData(data) {
    return Object.entries(data)
        .map(([key, value]) => {
            const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
            return `${formattedKey}: ${value || "Not Provided"}`;
        })
        .join("\n");
}

function systemPrompt(data) {
    const formattedData = formatData(data);

    return `You are an AI assistant designed to help users with coding problems. Your role is to provide guidance, hints, and problem-solving strategies while ensuring the user learns through the process. You must **never** provide code directly unless the user has clearly asked for it **after exhausting all other approaches**.

    ### Key Guidelines:
    1. **Hints and Problem-Solving**:
    - Offer hints that help the user break down the problem or identify patterns. **Never provide code directly**, especially in the early stages of the conversation.
    - Focus on explaining concepts and suggesting logical steps or efficient algorithms, rather than providing code directly.
    - If the user explicitly requests help after trying multiple solutions, only then can code be provided, but only if **absolutely necessary**.

    2. **Code Review**:
    - If the user asks for a code review, refer only to the **latest code provided by the user** in the "Information" below. *You should always use this, even if the user does not provide their code in chat history.
    - Analyze the code constructively, pointing out errors, inefficiencies, or areas for improvement **without rewriting the code unless explicitly requested**.

    3. **Stay Focused**:
    - Always stay on topic. If the user asks about unrelated topics (such as movies or anything non-coding related), **do not provide any responses related to those topics**. Politely and firmly redirect the conversation back to the coding problem. 
    - Do not engage in discussions outside the scope of coding and problem-solving.

    4. **Handling LaTeX and Formats**:
    - If LaTeX symbols are present in the provided information, interpret them correctly but avoid including LaTeX in your responses.

    ### Information Provided:
    """
    ${formattedData}
    """

    ### Final Reminders:
    - Always rely on the most recent information above to assist the user.
    - Encourage critical thinking and problem-solving rather than reliance on direct answers.
    - Remain patient, polite, and focused, ensuring the user stays engaged with the task.
    - **Do not engage in or provide responses to any non-coding topics under any circumstances**.
    `;
}






let clickListenerAdded = false;
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
    data = formatProblem(interceptedData);
    // console.log(data);


    // if(!interceptedData){
    //     console.log("No intercepted data found")
    // }else console.log(interceptedData);
    // // console.log(data);

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
        zIndex: "100",
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

    const closeButton = document.createElement("button");
    closeButton.id = "ai-close-button";
    closeButton.textContent = "-"; // Use a minus sign
    Object.assign(closeButton.style, {
        position: "absolute",
        top: "5px",
        right: "5px",
        width: "20px",
        height: "20px",
        color: darkTheme ? "#4d6182":"#9ee0f7",
        background: "transparent",
        border: "none",
        borderRadius: "50%",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "105",
    });

    closeButton.addEventListener("click", removeChatbox);

    chatbox.appendChild(closeButton);


    // Add resize handles for resizing the chatbox
["top", "right", "bottom", "left"].forEach((side) => {
    const resizeHandle = document.createElement("div");
    resizeHandle.className = `resize-handle resize-${side}`;
    Object.assign(resizeHandle.style, {
        position: "absolute",
        [side]: "-5px",
        cursor: side.includes("top") || side.includes("bottom") ? "ns-resize" : "ew-resize",
        ...(side === "top" || side === "bottom"
            ? { height: "10px", width: "100%" }
            : { width: "10px", height: "100%" }),
    });

    // Add resize logic
    resizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = chatbox.offsetWidth;
        const startHeight = chatbox.offsetHeight;
        const startLeft = chatbox.offsetLeft;
        const startTop = chatbox.offsetTop;

        const onMouseMove = (e) => {
            if (side === "right") {
                const newWidth = Math.max(300, startWidth + e.clientX - startX);
                chatbox.style.width = `${newWidth}px`;
            } else if (side === "left") {
                const newWidth = Math.max(300, startWidth - (e.clientX - startX));
                const newLeft = startLeft + (e.clientX - startX);
                chatbox.style.width = `${newWidth}px`;
                chatbox.style.left = `${newLeft}px`;
            } else if (side === "bottom") {
                const newHeight = Math.max(400, startHeight + e.clientY - startY);
                chatbox.style.height = `${newHeight}px`;
            } else if (side === "top") {
                const newHeight = Math.max(400, startHeight - (e.clientY - startY));
                const newTop = startTop + (e.clientY - startY);
                chatbox.style.height = `${newHeight}px`;
                chatbox.style.top = `${newTop}px`;
            }
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    chatbox.appendChild(resizeHandle);
});



    // Chat messages container
    const messagesContainer = document.createElement("div");
    messagesContainer.id = "messages-container";
    Object.assign(messagesContainer.style, {
        flex: "1",
        overflowY: "auto", // Allows scrolling
        padding: "10px",
        marginTop: "18px",
        scrollbarWidth: "5px" // Firefox-specific
    });

    // WebKit-specific scrollbar hiding
    let styleSheet = document.getElementById("scrollbar-styles");

    if (styleSheet) {
        styleSheet.remove(); // Remove the old styleSheet if it exists
    }
    
    styleSheet = document.createElement("style");
    styleSheet.id = "scrollbar-styles";
    
    styleSheet.textContent = getScrollbarStyles(darkTheme); // Set the new styles
    
    document.head.appendChild(styleSheet);

    let instructions = systemPrompt(data);

    const id = data.id;
    const storedData = localStorage.getItem(id);
    let chatHistory = [];
    let storedTime = 0;

    if (storedData) {
        const parsedData = JSON.parse(storedData);
        chatHistory = parsedData.chats || [];
        storedTime = parsedData.timestamp || 0;
    }

    const currentTime = new Date().getTime();
    if (storedTime && currentTime - storedTime > 2 * 24 * 60 * 60 * 1000) {
        chatHistory = [];
        localStorage.removeItem(id);
    }

    // Check if chatHistory is empty and set initial messages
    if (chatHistory.length === 0) {
        chatHistory.push({ sender: "You", text: instructions });
        chatHistory.push({ sender: "AI", text: "How may I assist you?" });
    }

    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === "You") {
        chatHistory.pop();
    }

    // console.log(chatHistory)


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
    });function interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async function (...args) {
            const response = await originalFetch(...args);
            
            // Capture data from the API response
            const clonedResponse = response.clone();
            clonedResponse.json().then((data) => {
                // console.log("Captured fetch response:", data);
                // Store the intercepted data in Chrome storage
                chrome.storage.local.set({ apiData: data });
            }).catch(error => {
                console.error("Error parsing fetch response:", error);
            });
    
            // Return the original response
            return response;
        };
    }

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

    if (!clickListenerAdded) {
        // Detect clicks outside the chatbox and close it
        document.addEventListener('click', (e) => {
            const chatbox = document.getElementById('ai-chatbox'); // Get the chatbox element
            if (!chatbox) return; // If chatbox is not present, exit early
            
            const clickedOutside = !chatbox.contains(e.target); // Check if click is outside chatbox
            const isSwitchClicked = e.target.closest(".ant-switch.d-flex.mt-1.css-19gw05y"); // Check if the click is on the specific element
            // const isCodeEditor = e.target.closest(".coding_code_playground_top_container__CzOiz")
            
            if (clickedOutside && !isSwitchClicked) {
                removeChatbox(); // Close the chatbox if the click is outside and not on the switch
            }
        });
        clickListenerAdded = true; // Set flag to true to prevent adding the listener again
    }

    updateChatboxTheme(darkTheme);
    scrollToBottom();
    input.focus();
}



function removeChatbox() {
    const chatbox = document.getElementById('ai-chatbox');
    if (chatbox) {
        chatbox.remove();
    }
}


function findKey(numId, codeLan) {
    const keys = Object.keys(localStorage);
    for (let key of keys) {
      if (key.endsWith(`${numId}_${codeLan}`)) {
        return key; 
      }
    }
    
    return null; 
  }


async function handleSendMessage(id, chatHistory) {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === "You") {
        chatHistory.pop();
    }

    appendMessage("You", message);
    chatHistory.push({ sender: "You", text: message }); // Add user message to history

    input.value = "";

    try {
        const apiKey = await getApiKey();
        // console.log(apiKey);
        const numId = data.id.split('-').pop();
        const codeLan = document.getElementsByClassName('coding_select__UjxFb')[0].textContent
        const key = findKey(numId,codeLan);
        console.log(key);
        const myCode = localStorage.getItem(key) || "";
        // console.log(myCode)
        data["latest_code_provided_by_the_user"] = myCode;
        data["coding_language_used_by_the_user"] = codeLan

        chatHistory[0].text = systemPrompt(data);
        const response = await processMessageWithGroqAPI(chatHistory, ai_apiKey);
        
        if (response && response.success === 1) {
            appendMessage("AI", response.message);
            chatHistory.push({ sender: "AI", text: response.message }); // Add AI message to history
        } else {
            const errMsg = response.message;
            console.log(errMsg)
            const match = errMsg.match(/Please.*/);
            const sentence = match ? match[0] : "";
            appendMessage("AI", `Sorry, I couldn't process your request. ${sentence}`);

            const chatBox = document.getElementById('ai-chatbox');
            const messageElements = chatBox.querySelectorAll('.chat-message');
            const userMessageElement = messageElements[messageElements.length - 2]; // Second last message (user's prompt)
            const aiMessageElement = messageElements[messageElements.length - 1];

            const fadeOut = (message) => {
                message.style.transition = "opacity 1s"; // Fade-out duration of 1 second
                message.style.opacity = "0"; // Make it invisible
        
                setTimeout(() => {
                    if (message && message.parentNode) {
                        message.remove();
                    }
                }, 2000); // Wait for the transition to complete before removing
            };
        
            // Delay the removal of both messages by 3 seconds
            setTimeout(() => {
                fadeOut(userMessageElement);
                fadeOut(aiMessageElement);
            }, 4000); // 3 seconds delay
        }

        const dataToStore = {
            timestamp: new Date().getTime(),
            chats: chatHistory
        };
        localStorage.setItem(id, JSON.stringify(dataToStore));
    } catch (error) {
        // console.error("Error retrieving API key:", error);
        window.alert("Sorry, the API key is missing or invalid.");
    }
}


function appendMessage(sender, message, container = null) {
    const messagesContainer = container || document.getElementById('messages-container');
    const messageDiv = document.createElement("div");

    const isDarkTheme = getDarkTheme();
    const themeColors = isDarkTheme ? darkThemeColors : lightThemeColors;
    
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

    const codeBlockStyle = isDarkTheme 
    ? 'background-color: #2E3440; color: #f1f1f1;' // Dark theme style
    : 'background-color: #f5f5f5; color: #000000;'; // Light theme style
    if (sender === "You") {
        message = escapeHtml(message);
        message = message.replace(/```([^`]+)```/g, (match, codeBlock) => {
            return `<pre style="${codeBlockStyle} padding: 10px; border-radius: 5px;">${codeBlock}</pre>`;
        });

        message = message.replace(/\n/g, '<br>');
        
    } else {
        marked.setOptions({
            highlight: (code, language) => {
                return language && hljs.getLanguage(language)
                    ? hljs.highlight(code, { language }).value
                    : hljs.highlightAuto(code).value;
            },
        });
    
        const renderedHTML = marked(message);
        const container = document.createElement("div");
        container.innerHTML = renderedHTML;
        
        container.querySelectorAll("pre").forEach((codeBlock) => {
            const parentPre = codeBlock;
            parentPre.style.position = "relative";
            parentPre.style.marginBottom = "20px";
            parentPre.style.zIndex = "115"; 
            parentPre.style.webkitOverflowScrolling = "touch";
            parentPre.style.scrollbarWidth = "none";
            parentPre.style.overflow = "auto";
            parentPre.style.msOverflowStyle = "none";
            parentPre.style.setProperty("::-webkit-scrollbar", "none");
            parentPre.style.borderRadius = "7px";
            let language = '';

            const codeElement = parentPre.querySelector("code");
            if (codeElement) {
                codeElement.style.cssText = 'background: transparent !important;';
                if (codeElement.classList.length > 0 && codeElement.classList[0].startsWith('lang-')) {
                    language = codeElement.classList[0].split('-')[1];  // Get the part after "lang_"
                }
            }

            if (language) {
            
                // Wrap the <pre> element in a container
                const wrapper = document.createElement("div");
                wrapper.style.position = "relative"; // Make this container the positioning context
                wrapper.style.width = "100%"; // Ensure it takes the full width
                wrapper.style.marginBottom = "20px"; // Add spacing for better layout
            
                parentPre.parentElement.insertBefore(wrapper, parentPre);
            
                const languageLabel = document.createElement("div");
                languageLabel.classList.add("code-language");
                languageLabel.textContent = language.toLowerCase(); // Display the language in uppercase
                languageLabel.style.cssText = `
                    display: inline-block; /* Ensure width fits the text content */
                    font-size: 12px;
                    color: ${isDarkTheme ? "#E9E9EB" : "#2A2E34"};
                    left: 10px; /* Slightly offset for better alignment */
                    background-color: ${isDarkTheme ? "#3d4b63" : "#f0f0f0"};
                    padding: 2px 7px;
                    border-radius: 3px;
                    z-index: 120;
                `;

            
                // Add the label to the wrapper
                wrapper.appendChild(languageLabel);
                wrapper.appendChild(parentPre);

                wrapper.style.marginTop = "20px";
            }
            
            


            const copyButton = document.createElement("button");
            copyButton.className = "copy-button-chatbox";
            copyButton.textContent = "Copy";

            copyButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 10px;
                transform: translateY(-50%);
                padding: 2px 8px;
                background-color: ${isDarkTheme ? "#4a4a4a" : "#f0f0f0"};
                border: none;
                color: ${isDarkTheme ? "#ffffff" : "#333"};
                cursor: pointer;
                border-radius: 3px;
                font-size: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                z-index: 120;
                pointer-events: auto;
            `;

            parentPre.appendChild(copyButton);
            parentPre.style.padding = "5px";
            
        });

        message = container.innerHTML;
    }

    messageDiv.innerHTML = `${message}`;
    messageDiv.classList.add('chat-message');
    messageDiv.classList.add(sender === "You" ? 'from-you' : 'from-other');

    Object.assign(messageDiv.style, {
        padding: "10px",
        margin: sender === "You" 
            ? "5px 20px 7px 0"
            : "5px 0 20px 0",
        borderRadius: "5px",
        backgroundColor: sender === "You" ? themeColors.messageYouBg : themeColors.messageAIbg,
        color: isDarkTheme ? "#E9E9EB" : "#2A2E34",
        alignSelf: sender === "You" ? "flex-start" : "flex-end",
        border: `1px solid ${themeColors.borderColor}`
    });

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();

    // Event delegation for copy button
    messagesContainer.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("copy-button-chatbox")) {
            const preElement = e.target.closest("pre");
    
            // Clone the <pre> element and remove the copy button
            const codeClone = preElement.cloneNode(true);
            const button = codeClone.querySelector(".copy-button-chatbox");
            if (button) {
                button.remove(); // Remove the copy button from the cloned element
            }
    
            const codeContent = codeClone.innerText; // Get the text without the button
            navigator.clipboard.writeText(codeContent).then(() => {
                e.target.textContent = "Copied!";
                setTimeout(() => {
                    e.target.textContent = "Copy";
                }, 1500);
            }).catch(err => console.error('Failed to copy text: ', err));
        }
    });
    
    

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
        const maxTokens = 6000;

        // Estimate tokens in a message
        const estimateTokens = (text) => Math.ceil(text.length / 3);

        // Initialize token count and modified chat history
        let totalTokens = 0;
        const modified_chatHistory = [];
        // console.log(chatHistory)

        // Add the system message to the modified history
        const system_message = {
            role: "system",
            content: chatHistory[0].text,
        };
        totalTokens += estimateTokens(system_message.content);

        // Process the rest of the messages in reverse order
        for (let i = chatHistory.length - 1; i > 0; i--) {
            const message = chatHistory[i];
            const messageTokens = estimateTokens(message.text);

            if (totalTokens + messageTokens > maxTokens) break;

            // Add message to the modified history
            modified_chatHistory.unshift({
                role: message.sender === "You" ? "user" : "assistant",
                content: message.text,
            });
            totalTokens += messageTokens;
        }

        // Add the system message at the beginning
        modified_chatHistory.unshift(system_message);
        console.log(modified_chatHistory)

        // Log the final message structure for debugging
        // console.log(modified_chatHistory);

        // Make the API request
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",
                messages: modified_chatHistory,
            }),
        });

        // Handle API response
        if (!response.ok) {
            const errorText = await response.text();
            const errorMessage = JSON.parse(errorText).error.message;
            return { success: 0, message: errorMessage };
        }

        const data = await response.json();
        const assistantResponse = data.choices?.[0]?.message?.content || "No response received.";
        return { success: 1, message: assistantResponse };

    } catch (error) {
        console.error("Error processing message:", error);
        return null;
    }
}


