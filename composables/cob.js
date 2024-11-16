import { useHelper, useLiquidity } from "./index.js";

// check if there is any COB pattern in these candles
async function isCOB(prisma, candles, variables, signalVariables) {
}

export async function useCOB(prisma) {
  return {
    isCOB: async (candles, variables, signalVariables) => await isCOB(prisma, candles, variables, signalVariables),
  };
}
