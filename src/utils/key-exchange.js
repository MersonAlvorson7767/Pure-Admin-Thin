const keyExchangePromise = new Promise((resolve, reject) => {
    // Using JSEncrypt library to handle RSA encryption
    const encrypt = new JSEncrypt();

    // Using a 2048-bit key
    encrypt.getKey();

    const publicKey = encrypt.getPublicKey();

    // Send the public key to the server to get an encrypted session key
    $.ajax({
        url: server + "/s",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ publicKey: publicKey })
    }).done(function(response) {
        // The server should return the session key, encrypted with our public key
        const encryptedSessionKey = response.data;
        const token = response.sv;

        // Decrypt the session key with our private key
        const sessionKey = encrypt.decrypt(encryptedSessionKey);

        if (sessionKey && token) {
            // Store the session key for later use in this session
            sessionStorage.setItem("sd", sessionKey);
            sessionStorage.setItem("sv", token);
            resolve(sessionKey);
        } else {
            reject("Failed to decrypt session key or get token.");
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        reject("Key exchange failed: " + textStatus);
    });
});