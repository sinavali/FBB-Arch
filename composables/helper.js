function getPip(high, low) {
  return (high - low) * 10000;
}

export async function useHelper(prisma) {
  return {
    getPip: (high, low) => getPip(high, low),
  };
}