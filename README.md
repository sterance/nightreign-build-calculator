# Nightreign Build Calculator

A web application for calculating the optimal relic loadout for your Elden Ring Nightreign characters.

1) Parses `.sl2` files (found in `C:\Users\[username]\AppData\Roaming\Nightreign` on Windows), extracts the relic information, and saves it in the browser's local storage.
2) Users can browse them in the Relics page, or select and customize weights (and set allowed/forbidden and optional/required toggles) for desired effects, then use the Calculate button to find the best combination of available relics.
3) Includes toggle for displaying/calculating Deep of Night relics and effects, saving lists of desired effects as "Builds", and optional calculation of "guaranteeable" relics (can be bought or earned without RNG)

## Credits
The functionality for parsing `.sl2` files (`relic_extractor.py`) is adapted from the [Elden Ring Nightreign Save Editor](https://github.com/alfizari/Elden-Ring-Nightreign-Save-Editor-PS4) by alfizari.

This component is used under the terms of the MIT License. A full copy of the license is available in the [LICENSE-THIRD-PARTY.md](./LICENSE-THIRD-PARTY.md) file.
