import { calculateBestRelics } from '../utils/calculation';
import { calculateWithGuaranteeableRelics } from '../utils/guaranteeableCalculation';

self.onmessage = async (event) => {
  const startTime = performance.now();
  console.log("Worker: Message received from main script");
  const {
    desiredEffects,
    characterRelicData,
    selectedVessels,
    selectedNightfarer,
    effectMap,
    showDeepOfNight,
    showForsakenHollows,
    vesselData,
    calculateGuaranteeable,
  } = event.data;

  try {
    const effectMapInstance = new Map(effectMap);

    let result;
    const calcStartTime = performance.now();
    
    if (calculateGuaranteeable) {
      console.log("Worker: Starting guaranteeable calculation");
      result = calculateWithGuaranteeableRelics(
        desiredEffects,
        characterRelicData,
        selectedVessels,
        selectedNightfarer,
        effectMapInstance,
        showDeepOfNight,
        showForsakenHollows,
        vesselData
      );
    } else {
      console.log("Worker: Starting standard calculation");
      result = calculateBestRelics(
        desiredEffects,
        characterRelicData,
        selectedVessels,
        selectedNightfarer,
        effectMapInstance,
        showDeepOfNight,
        showForsakenHollows,
        vesselData
      );
    }

    const calcEndTime = performance.now();
    const calcDuration = calcEndTime - calcStartTime;
    const totalDuration = calcEndTime - startTime;
    
    console.log(`Worker: Calculation completed in ${calcDuration.toFixed(2)}ms`);
    console.log(`Worker: Total processing time: ${totalDuration.toFixed(2)}ms`);

    self.postMessage({ success: true, result });
  } catch (error) {
    console.error("Worker Error:", error);
    self.postMessage({ success: false, error: error.message });
  }
};
