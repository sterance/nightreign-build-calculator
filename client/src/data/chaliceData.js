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
    name: "Giant's Cradle Grail", slots: ['blue', 'blue', 'blue'],
    description: "Obtainable after defeating 7 Nightlords, excluding Heolstor the Nightlord.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
  {
    name: 'Sacred Erdtree Grail', slots: ['yellow', 'yellow', 'yellow'],
    description: "Obtainable after defeating Heolstor the Nightlord.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
  {
    name: 'Spirit Shelter Grail', slots: ['green', 'green', 'green'],
    description: "Obtainable after defeating 4 different Nightlords.\nPurchased from the Small Jar Bazaar shop at the Roundtable Hold for 3000 Murk."
  },
];

const uniqueChalices = {
  duchess: [
    {
      name: "Duchess' Chalice", slots: ['blue', 'yellow', 'white'],
      description: "Obtained as a reward for completing the second part of the Duchess' Remembrance Quest."
    },
    {
      name: "Duchess' Goblet", slots: ['yellow', 'yellow', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Duchess' Urn", slots: ['red', 'blue', 'blue'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Duchess' Urn", slots: ['red', 'red', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Duchess' Urn", slots: ['blue', 'blue', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  executor: [
    {
      name: "Executor's Chalice", slots: ['blue', 'yellow', 'white'],
      description: "Obtained as a reward for completing the first part of the Executor's Remembrance Quest."
    },
    {
      name: "Executor's Goblet", slots: ['red', 'blue', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Executor's Urn", slots: ['red', 'yellow', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Executor's Urn", slots: ['red', 'red', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Executor's Urn", slots: ['yellow', 'yellow', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  guardian: [
    {
      name: "Guardian's Chalice", slots: ['blue', 'yellow', 'white'],
      description: "Obtained as a reward for completing the Guardian's Remembrance Quest."
    },
    {
      name: "Guardian's Goblet", slots: ['blue', 'blue', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Guardian's Urn", slots: ['red', 'yellow', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Guardian's Urn", slots: ['red', 'green', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Guardian's Urn", slots: ['yellow', 'yellow', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  ironeye: [
    {
      name: "Ironeye's Chalice", slots: ['red', 'green', 'white'],
      description: "Obtained as a reward for completing the Ironeye's Remembrance Quest."
    },
    {
      name: "Ironeye's Goblet", slots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Ironeye's Urn", slots: ['yellow', 'green', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Ironeye's Urn", slots: ['blue', 'yellow', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Ironeye's Urn", slots: ['green', 'green', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  raider: [
    {
      name: "Raider's Chalice", slots: ['red', 'red', 'white'],
      description: "Obtained as a reward for completing the second part of the Raider's Remembrance Quest."
    },
    {
      name: "Raider's Goblet", slots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Raider's Urn", slots: ['red', 'green', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Raider's Urn", slots: ['blue', 'blue', 'green'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Raider's Urn", slots: ['green', 'green', 'red'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  recluse: [
    {
      name: "Recluse's Chalice", slots: ['yellow', 'green', 'white'],
      description: "Obtained as a reward for completing the first part of the Recluse's Remembrance Quest."
    },
    {
      name: "Recluse's Goblet", slots: ['red', 'blue', 'yellow'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Recluse's Urn", slots: ['blue', 'blue', 'green'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Recluse's Urn", slots: ['red', 'red', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Recluse's Urn", slots: ['green', 'blue', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  revenant: [
    {
      name: "Revenant's Chalice", slots: ['blue', 'green', 'white'],
      description: "Obtained as a reward for completing the second part of the Revenant's Remembrance Quest."
    },
    {
      name: "Revenant's Goblet", slots: ['red', 'red', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Revenant's Urn", slots: ['blue', 'blue', 'yellow'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Revenant's Urn", slots: ['red', 'yellow', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Revenant's Urn", slots: ['yellow', 'blue', 'blue'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
  ],
  wylder: [
    {
      name: "Wylder's Chalice", slots: ['red', 'yellow', 'white'],
      description: "Obtained as a reward for completing the Wylder's Remembrance Quest."
    },
    {
      name: "Wylder's Goblet", slots: ['yellow', 'green', 'green'],
      description: "Purchased from the Small Jar Bazaar shop at the Roundtable Hold for 1200 Murk."
    },
    {
      name: "Wylder's Urn", slots: ['red', 'red', 'blue'],
      description: "Starting vessel."
    },
    {
      name: "Soot-Covered Wylder's Urn", slots: ['blue', 'blue', 'yellow'],
      description: "Purchased from Collector Signboard for 4 Sovereign Sigil."
    },
    {
      name: "Sealed Wylder's Urn", slots: ['blue', 'red', 'red'],
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
  slots: ['white', 'white', 'white'],
});