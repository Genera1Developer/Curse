document.addEventListener("DOMContentLoaded", function() {
(function () {
    const officialLinks = [
        "rawr-uwu.vercel.app",
        "curse.tau.vercel.app",
        "feedback-lime.vercel.app",
        "clocks123.vercel.app",
        "fairtax.vercel.app",
        "curse-api-server.vercel.app",
        "curse-nw68.vercel.app"
    ];

    const currentDomain = window.location.hostname;
    const isOfficial = officialLinks.includes(currentDomain);

    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = "black";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.border = "2px solid darkred";
    notification.style.borderRadius = "5px";
    notification.style.fontFamily = "Arial, sans-serif";
    notification.style.fontSize = "14px";
    notification.style.zIndex = "9999";
    notification.style.display = "flex";
    notification.style.alignItems = "center";
    notification.style.gap = "10px";
    notification.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.7)";
    notification.style.maxWidth = "300px";
    notification.style.wordWrap = "break-word";
    notification.style.transition = "transform 0.4s ease, opacity 0.4s ease";

    const message = document.createElement("span");
    message.innerText = isOfficial
        ? "This domain is an official CURSE link"
        : `This domain (${currentDomain}) is not an official CURSE link, continue with caution`;

    const closeButton = document.createElement("button");
    closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M6.225 4.811L4.811 6.225 10.586 12l-5.775 5.775 1.414 1.414L12 13.414l5.775 5.775 1.414-1.414L13.414 12l5.775-5.775-1.414-1.414L12 10.586z"/>
        </svg>
    `;
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.cursor = "pointer";
    closeButton.style.display = "flex";
    closeButton.style.alignItems = "center";
    closeButton.style.justifyContent = "center";
    closeButton.style.width = "20px";
    closeButton.style.height = "20px";
    closeButton.style.padding = "0";

    function closeNotification() {
        notification.style.transform = "translateX(120%)";
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 400);
    }

    closeButton.onclick = closeNotification;

    notification.appendChild(message);
    notification.appendChild(closeButton);
    document.body.appendChild(notification);

    setTimeout(closeNotification, 5000);
})();
    });

