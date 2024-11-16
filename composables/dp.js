import { useHelper, useLiquidity } from "./index.js";

// check if there is any DPHunter pattern in these candles
async function isDPHunter(prisma, candles, variables, signalVariables) {
  // do stuff
}

// check if there is any DPProtected pattern in these candles
async function isDPProtected(prisma, candles, variables, signalVariables) {
  // do stuff
}

export async function useDP(prisma) {
  return {
    isDPHunter: async (candles, variables, signalVariables) => await isDPHunter(prisma, candles, variables, signalVariables),
    isDPProtected: async (candles, variables, signalVariables) => await isDPProtected(prisma, candles, variables, signalVariables),
  };
}
