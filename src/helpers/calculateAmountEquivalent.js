export async function calculateAmountEquivalent(points) {
  try {
    const amountEquivalent = (parseFloat(points) * 0.20).toFixed(2);
    return amountEquivalent;
  } catch (error) {
    console.error("Error in calculateAmountEquivalent:", error);
    throw new Error("Failed to calculate amount equivalent.");
  }
}
