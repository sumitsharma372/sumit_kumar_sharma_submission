(function () {
    // Save original methods
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Hook into the 'open' method
    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        this._url = url; // Save URL for later use
        return originalOpen.apply(this, arguments); // Call the original 'open' method
    };

    // Hook into the 'send' method
    XMLHttpRequest.prototype.send = function (body) {
        this.addEventListener("load", function () {
            // Filter requests based on the URL pattern
            const regex = /^https:\/\/api2\.maang\.in\/problems\/user\/\d+$/; // Match the desired URL pattern
            if (regex.test(this._url)) {
                const data = {
                    url: this._url, // Intercepted URL
                    status: this.status, // HTTP status code
                    response: this.responseText, // Response body
                };

                // Dispatch a custom event with the filtered data
                window.dispatchEvent(new CustomEvent("xhrDataFetched", { detail: data }));
            }
        });

        return originalSend.apply(this, arguments); // Call the original 'send' method
    };
})();
