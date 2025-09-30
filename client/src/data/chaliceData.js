export const characters = [
  'wylder',
  'guardian',
  'ironeye',
  'duchess',
  'raider',
  'revenant',
  'recluse',
  'executor',
];

const genericChalices = [
  {
    name: "Giant's Cradle Grail", baseSlots: ['blue', 'blue', 'blue'],
    description: "Obtainable after defeating 7 Nightlords, excluding Heolstor the Nightlord.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
  {
    name: 'Sacred Erdtree Grail', baseSlots: ['yellow', 'yellow', 'yellow'],
    description: "Obtainable after defeating Heolstor the Nightlord.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
  {
    name: 'Spirit Shelter Grail', baseSlots: ['green', 'green', 'green'],
    description: "Obtainable after defeating 4 different Nightlords.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
];

const uniqueChalices = {
  duchess: [
    {
      name: "Duchess' Chalice", baseSlots: ['blue', 'yellow', 'white'], deepSlots: ['red', 'blue', 'yellow'],
      description: "Obtained as a reward for completing the second part of the Duchess' Remembrance Quest."
    },
    {
      name: "Duchess' Goblet", baseSlots: ['yellow', 'yellow', 'green'], deepSlots: ['yellow', 'yellow', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Duchess' Urn", baseSlots: ['red', 'blue', 'blue'], deepSlots: ['red', 'blue', 'blue'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Duchess' Urn", baseSlots: ['red', 'red', 'green'], deepSlots: ['red', 'red', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Duchess' Urn", baseSlots: ['blue', 'blue', 'red'], deepSlots: ['green', 'green', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  executor: [
    {
      name: "Executor's Chalice", baseSlots: ['blue', 'yellow', 'white'], deepSlots: ['yellow', 'yellow', 'green'],
      description: "Obtained as a reward for completing the first part of the Executor's Remembrance Quest."
    },
    {
      name: "Executor's Goblet", baseSlots: ['red', 'blue', 'green'], deepSlots: ['red', 'blue', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Executor's Urn", baseSlots: ['red', 'yellow', 'yellow'], deepSlots: ['red', 'yellow', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Executor's Urn", baseSlots: ['red', 'red', 'blue'], deepSlots: ['red', 'red', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Executor's Urn", baseSlots: ['yellow', 'yellow', 'red'], deepSlots: ['green', 'green', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  guardian: [
    {
      name: "Guardian's Chalice", baseSlots: ['blue', 'yellow', 'white'], deepSlots: ['yellow', 'yellow', 'green'],
      description: "Obtained as a reward for completing the Guardian's Remembrance Quest."
    },
    {
      name: "Guardian's Goblet", baseSlots: ['blue', 'blue', 'green'], deepSlots: ['blue', 'blue', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Guardian's Urn", baseSlots: ['red', 'yellow', 'yellow'], deepSlots: ['red', 'yellow', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Guardian's Urn", baseSlots: ['red', 'green', 'green'], deepSlots: ['red', 'green', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Guardian's Urn", baseSlots: ['yellow', 'yellow', 'red'], deepSlots: ['green', 'green', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  ironeye: [
    {
      name: "Ironeye's Chalice", baseSlots: ['red', 'green', 'white'], deepSlots: ['red', 'red', 'green'],
      description: "Obtained as a reward for completing the Ironeye's Remembrance Quest."
    },
    {
      name: "Ironeye's Goblet", baseSlots: ['red', 'blue', 'yellow'], deepSlots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Ironeye's Urn", baseSlots: ['yellow', 'green', 'green'], deepSlots: ['yellow', 'green', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Ironeye's Urn", baseSlots: ['blue', 'yellow', 'yellow'], deepSlots: ['blue', 'yellow', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Ironeye's Urn", baseSlots: ['green', 'green', 'yellow'], deepSlots: ['blue', 'blue', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  raider: [
    {
      name: "Raider's Chalice", baseSlots: ['red', 'red', 'white'], deepSlots: ['red', 'yellow', 'yellow'],
      description: "Obtained as a reward for completing the second part of the Raider's Remembrance Quest."
    },
    {
      name: "Raider's Goblet", baseSlots: ['red', 'blue', 'yellow'], deepSlots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Raider's Urn", baseSlots: ['red', 'green', 'green'], deepSlots: ['red', 'green', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Raider's Urn", baseSlots: ['blue', 'blue', 'green'], deepSlots: ['blue', 'blue', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Raider's Urn", baseSlots: ['green', 'green', 'red'], deepSlots: ['yellow', 'blue', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  recluse: [
    {
      name: "Recluse's Chalice", baseSlots: ['yellow', 'green', 'white'], deepSlots: ['blue', 'green', 'green'],
      description: "Obtained as a reward for completing the first part of the Recluse's Remembrance Quest."
    },
    {
      name: "Recluse's Goblet", baseSlots: ['red', 'blue', 'yellow'], deepSlots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Recluse's Urn", baseSlots: ['blue', 'blue', 'green'], deepSlots: ['blue', 'blue', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Recluse's Urn", baseSlots: ['red', 'red', 'yellow'], deepSlots: ['red', 'red', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Recluse's Urn", baseSlots: ['green', 'blue', 'blue'], deepSlots: ['yellow', 'yellow', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  revenant: [
    {
      name: "Revenant's Chalice", baseSlots: ['blue', 'green', 'white'], deepSlots: ['blue', 'yellow', 'green'],
      description: "Obtained as a reward for completing the second part of the Revenant's Remembrance Quest."
    },
    {
      name: "Revenant's Goblet", baseSlots: ['red', 'red', 'green'], deepSlots: ['red', 'red', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Revenant's Urn", baseSlots: ['blue', 'blue', 'yellow'], deepSlots: ['blue', 'blue', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Revenant's Urn", baseSlots: ['red', 'yellow', 'yellow'], deepSlots: ['red', 'yellow', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Revenant's Urn", baseSlots: ['yellow', 'blue', 'blue'], deepSlots: ['green', 'green', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  wylder: [
    {
      name: "Wylder's Chalice", baseSlots: ['red', 'yellow', 'white'], deepSlots: ['red', 'green', 'blue'],
      description: "Obtained as a reward for completing the Wylder's Remembrance Quest."
    },
    {
      name: "Wylder's Goblet", baseSlots: ['yellow', 'green', 'green'], deepSlots: ['yellow', 'green', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Wylder's Urn", baseSlots: ['red', 'red', 'blue'], deepSlots: ['red', 'red', 'blue'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Wylder's Urn", baseSlots: ['blue', 'blue', 'yellow'], deepSlots: ['blue', 'blue', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Wylder's Urn", baseSlots: ['blue', 'red', 'red'], deepSlots: ['green', 'yellow', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
};

export const chaliceData = characters.reduce((acc, character) => {
  acc[character] = [...uniqueChalices[character], ...genericChalices];
  return acc;
}, {});

export const placeholderChalices = Array(8).fill({
  name: 'Placeholder',
  baseSlots: ['white', 'white', 'white'],
  deepSlots: ['white', 'white', 'white'],
});