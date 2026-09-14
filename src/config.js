export async function loadWeddingConfig() {
    const response = await fetch("/config/wedding.json", {
        cache: "no-store"
    });
    if (!response.ok) {
        throw new Error(`Unable to load wedding configuration (${response.status})`);
    }
    return response.json();
}
