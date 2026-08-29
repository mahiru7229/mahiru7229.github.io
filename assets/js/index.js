const copyButton = document.querySelector("#copy-discord");
const copyStatus = document.querySelector("#copy-status");

if (copyButton && copyStatus) {
    copyButton.addEventListener("click", async () => {
        const username = copyButton.dataset.copy || "@mahiru7229";

        try {
            await navigator.clipboard.writeText(username);
            copyStatus.textContent = `${username} copied to clipboard`;
        } catch {
            copyStatus.textContent = `Discord: ${username}`;
        }

        window.setTimeout(() => {
            copyStatus.textContent = "";
        }, 3000);
    });
}
