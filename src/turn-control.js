export function connectTurnControl(button, advanceTurn) {
    function keyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            advanceTurn();
        }
    }
    button.addEventListener("click", advanceTurn);
    window.addEventListener("keydown", keyDown);
}
