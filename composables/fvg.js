import { useHelper } from "../composables/index.js";

// candles.length is alwase equal to 3
async function isFVG(prisma, candles) {
  // do stuff
}

export async function useFVG(prisma) {
  return {
    isFVG: async candles => await isFVG(prisma, candles),
  };
}