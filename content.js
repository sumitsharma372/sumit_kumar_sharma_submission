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

assistantButton.addEventListener("click", () => {
    alert("AI Assistant activated!"); 
});

document.body.appendChild(assistantButton);
