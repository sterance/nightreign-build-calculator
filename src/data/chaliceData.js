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
  { name: "Giant's Cradle Grail", slots: ['blue', 'blue', 'blue'] },
  { name: 'Sacred Erdtree Grail', slots: ['yellow', 'yellow', 'yellow'] },
  { name: 'Spirit Shelter Grail', slots: ['green', 'green', 'green'] },
];

const uniqueChalices = {
  duchess: [
    { name: "Duchess' Chalice", slots: ['blue', 'yellow', 'white'] },
    { name: "Duchess' Goblet", slots: ['yellow', 'yellow', 'green'] },
    { name: "Duchess' Urn", slots: ['red', 'blue', 'blue'] },
    { name: "Soot-Covered Duchess' Urn", slots: ['red', 'red', 'green'] },
    { name: "Sealed Duchess' Urn", slots: ['blue', 'blue', 'red'] },
  ],
  executor: [
    { name: "Executor's Chalice", slots: ['blue', 'yellow', 'white'] },
    { name: "Executor's Goblet", slots: ['red', 'blue', 'green'] },
    { name: "Executor's Urn", slots: ['red', 'yellow', 'yellow'] },
    { name: "Soot-Covered Executor's Urn", slots: ['red', 'red', 'blue'] },
    { name: "Sealed Executor's Urn", slots: ['yellow', 'yellow', 'red'] },
  ],
  guardian: [
    { name: "Guardian's Chalice", slots: ['blue', 'yellow', 'white'] },
    { name: "Guardian's Goblet", slots: ['blue', 'blue', 'green'] },
    { name: "Guardian's Urn", slots: ['red', 'yellow', 'yellow'] },
    { name: "Soot-Covered Guardian's Urn", slots: ['red', 'green', 'green'] },
    { name: "Sealed Guardian's Urn", slots: ['yellow', 'yellow', 'red'] },
  ],
  ironeye: [
    { name: "Ironeye's Chalice", slots: ['red', 'green', 'white'] },
    { name: "Ironeye's Goblet", slots: ['red', 'blue', 'yellow'] },
    { name: "Ironeye's Urn", slots: ['yellow', 'green', 'green'] },
    { name: "Soot-Covered Ironeye's Urn", slots: ['blue', 'yellow', 'yellow'] },
    { name: "Sealed Ironeye's Urn", slots: ['green', 'green', 'yellow'] },
  ],
  raider: [
    { name: "Raider's Chalice", slots: ['red', 'red', 'white'] },
    { name: "Raider's Goblet", slots: ['red', 'blue', 'yellow'] },
    { name: "Raider's Urn", slots: ['red', 'green', 'green'] },
    { name: "Soot-Covered Raider's Urn", slots: ['blue', 'blue', 'green'] },
    { name: "Sealed Raider's Urn", slots: ['green', 'green', 'red'] },
  ],
  recluse: [
    { name: "Recluse's Chalice", slots: ['yellow', 'green', 'white'] },
    { name: "Recluse's Goblet", slots: ['red', 'blue', 'yellow'] },
    { name: "Recluse's Urn", slots: ['blue', 'blue', 'green'] },
    { name: "Soot-Covered Recluse's Urn", slots: ['red', 'red', 'yellow'] },
    { name: "Sealed Recluse's Urn", slots: ['green', 'blue', 'blue'] },
  ],
  revenant: [
    { name: "Revenant's Chalice", slots: ['blue', 'green', 'white'] },
    { name: "Revenant's Goblet", slots: ['red', 'red', 'green'] },
    { name: "Revenant's Urn", slots: ['blue', 'blue', 'yellow'] },
    { name: "Soot-Covered Revenant's Urn", slots: ['red', 'yellow', 'yellow'] },
    { name: "Sealed Revenant's Urn", slots: ['yellow', 'blue', 'blue'] },
  ],
  wylder: [
    { name: "Wylder's Chalice", slots: ['red', 'yellow', 'white'] },
    { name: "Wylder's Goblet", slots: ['yellow', 'green', 'green'] },
    { name: "Wylder's Urn", slots: ['red', 'red', 'blue'] },
    { name: "Soot-Covered Wylder's Urn", slots: ['blue', 'blue', 'yellow'] },
    { name: "Sealed Wylder's Urn", slots: ['blue', 'red', 'red'] },
  ],
};

export const chaliceData = characters.reduce((acc, character) => {
  acc[character] = [...uniqueChalices[character], ...genericChalices];
  return acc;
}, {});