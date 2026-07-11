export function connectTurnControl(button: HTMLButtonElement, advanceTurn: () => void): void {
  function keyDown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      event.preventDefault();
      advanceTurn();
    }
  }

  button.addEventListener("click", advanceTurn);
  window.addEventListener("keydown", keyDown);
}
