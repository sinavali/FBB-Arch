import moment from "moment-timezone";

async function processMicro(prisma, candles) {
  // do stuff
}

export async function useMicro(prisma) {
  return {
    processMicro: async candles => await processMicro(prisma, candles),
  }
}
