# UNO Rules Reference

## Standard Rules
1.  **Objective**: Be the first player to discard all cards.
2.  **Turn Flow**:
    -   Play a card matching the discard pile by color or number/symbol.
    -   Play a Wild or Wild Draw 4 card.
    -   If no playable card, draw one card.
    -   If drawn card is playable, it may be played immediately.
3.  **Action Cards**:
    -   **Draw 2**: Next player draws 2 cards and misses their turn.
    -   **Reverse**: Changes direction of play.
    -   **Skip**: Next player misses their turn.
    -   **Wild**: Player declares the next color.
    -   **Wild Draw 4**: Player declares the next color; next player draws 4 cards and misses their turn.
4.  **UNO Call**:
    -   A player must say "UNO" when playing their second-to-last card.
    -   Failure to call UNO results in a 2-card penalty if caught by another player before the next player takes a turn.

## Custom Toggles (Implemented in `game.js`)
-   **`unoPenalty`**:
    -   `true`: The 2-card penalty is enforced if caught.
    -   `false`: No penalty for missing UNO.
-   **`enforceWildDrawFour`**:
    -   `true`: Wild Draw 4 can only be played if the player has NO cards matching the current color. (They may have matching numbers or Action cards, just not the color).
    -   `false`: Wild Draw 4 can be played anytime.
-   **`mustDrawOnlyIfNoPlay`**:
    -   `true`: Players can ONLY choose to draw if they have NO playable cards in hand.
    -   `false`: Players can choose to draw even if they have a playable card (strategic passing).

## Turn Logic
-   The game ends immediately when a player plays their last card.
-   The winner is declared instantly.
