export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { applyUpgrades } = await import("./core/upgrade");
    applyUpgrades().catch((err) => {
      console.error("Upgrade runner failed", err);
    });
  }
}
