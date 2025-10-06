import nightfarers from '../data/nightfarers.json';
import vesselsRaw from '../data/vessels.json';

export const characters = nightfarers;

export const chaliceData = nightfarers.reduce((acc, character) => {
  const chalicesKey = `${character}Chalices`;
  acc[character] = [...vesselsRaw[chalicesKey], ...vesselsRaw.genericChalices];
  return acc;
}, {});

