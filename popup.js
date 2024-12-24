document.addEventListener('DOMContentLoaded', () => {

    const inputField = document.querySelector('.key-handler input');
    const saveButton = document.querySelector('.key-handler button');

    saveButton.addEventListener('click', () => {
        const apiKey = inputField.value.trim();
        if (apiKey && apiKey.length === 39 && /^[a-zA-Z0-9]+$/.test(apiKey)) {
            console.log(apiKey);
            chrome.storage.local.set({ apiKey: apiKey }, () => {
                const messageContainer = document.querySelector('.success-message');
                messageContainer.textContent = "API Key saved successfully! You can chat now by clicking the AI Help icon in the bottom left corner.";
                messageContainer.style.display = 'block';
                inputField.value = '';
            });
        } else {
            alert('Please enter a valid API key.');
        }
    });
});
