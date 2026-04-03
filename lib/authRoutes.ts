import type { Route } from "next";

export const SYSTEM_HOME_PATH = "/analytics" as Route;

const ALLOWED_SYSTEM_PATHS = new Set<string>(["/", "/analytics", "/materials"]);

export function resolveSystemPath(rawPath?: string): Route {
	if (rawPath && ALLOWED_SYSTEM_PATHS.has(rawPath)) {
		return rawPath as Route;
	}

	return SYSTEM_HOME_PATH;
}