import { calculateBestRelics } from '../utils/calculation';
import { calculateWithGuaranteeableRelics } from '../utils/guaranteeableCalculation';

self.onmessage = async (event) => {
  console.log("Worker: Message received from main script");
  const {
    desiredEffects,
    characterRelicData,
    selectedVessels,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    vesselData,
    calculateGuaranteeable,
  } = event.data;

  try {
    const effectMapInstance = new Map(effectMap);

    let result;
    if (calculateGuaranteeable) {
      result = calculateWithGuaranteeableRelics(
        desiredEffects,
        characterRelicData,
        selectedVessels,
        selectedNightfarer,
        effectMapInstance,
        showDeepOfNight,
        vesselData
      );
    } else {
      result = calculateBestRelics(
        desiredEffects,
        characterRelicData,
        selectedVessels,
        selectedNightfarer,
        effectMapInstance,
        showDeepOfNight,
        vesselData
      );
    }

    self.postMessage({ success: true, result });
  } catch (error) {
    console.error("Worker Error:", error);
    self.postMessage({ success: false, error: error.message });
  }
};
