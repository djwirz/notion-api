export function normalizeId(id?: string): string {
	return id ? id.replace(/-/g, "") : "";
}