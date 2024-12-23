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

    assistantButton.addEventListener("click", clickHandler);

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
    }
}

function getIdFromUrl(url) {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/");
    return pathSegments[pathSegments.length - 1];
}

function clickHandler() {
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
    const ouput = inOutConst[4]?.textContent || '';

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
        sampleOutput: ouput,
        code: code
    };

    const bookmarkObj = {
        id: id,
        name: problemName,
        url: proburl
    };

    console.log(data);
}

function getCurrentBookmarks() {
    chrome.storage.sync;
}
