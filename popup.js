document.addEventListener('DOMContentLoaded', () => {

    const inputField = document.querySelector('.key-handler input');
    const saveButton = document.querySelector('.key-handler button');

    saveButton.addEventListener('click', () => {
        const apiKey = inputField.value.trim();
        if (apiKey && apiKey.length > 10) {
            chrome.storage.local.set({ az_ai_apikey: apiKey }, () => {
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
