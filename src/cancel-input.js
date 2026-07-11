export function connectCancelInput(cancel) {
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            cancel();
        }
    });
}
