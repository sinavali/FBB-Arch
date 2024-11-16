async function processCandlesData(prisma, data) {
  try {
    // do stuff
  } catch (error) {
    console.error({ type: "processing", message: error.message });
    return null;
  }
}

export async function useCandle(prisma) {
  return {
    processCandlesData: async data => await processCandlesData(prisma, data),
  };
}
