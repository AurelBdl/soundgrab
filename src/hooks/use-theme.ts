import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(themeValue: Theme) {
	if (typeof window === "undefined") return;
	const root = window.document.documentElement;
	root.classList.remove("light", "dark");

	if (themeValue === "system") {
		const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light";
		root.classList.add(systemTheme);
	} else {
		root.classList.add(themeValue);
	}
}

export function useTheme() {
	// Toujours initialiser avec "system" pour éviter les différences SSR/client
	const [theme, setTheme] = useState<Theme>("system");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Charger le thème depuis localStorage après le montage
		const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
		setTheme(savedTheme);
		applyTheme(savedTheme);
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		applyTheme(theme);

		// Écouter les changements de préférence système
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if (theme === "system") {
				applyTheme("system");
			}
		};

		mediaQuery.addEventListener("change", handleChange);

		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, [theme, mounted]);

	const setThemeValue = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		applyTheme(newTheme);
	};

	return { theme, setTheme: setThemeValue, mounted };
}
