import { Link, useLocation } from "@tanstack/react-router";
import {
	ChevronsLeft,
	ChevronsRight,
	Download,
	Menu,
	Moon,
	Settings,
	Sun,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

function SidebarContent({
	computedCollapsed,
	isMobile,
	onCloseMobile,
	onToggleCollapse,
}: {
	computedCollapsed: boolean;
	isMobile: boolean;
	onCloseMobile?: () => void;
	onToggleCollapse?: () => void;
}) {
	const pathname = useLocation({
		select: (location) => location.pathname,
	});
	const { theme, setTheme } = useTheme();

	const isActive = (path: string) => pathname === path;

	const toggleTheme = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	const getThemeIcon = () => {
		if (theme === "dark") return <Moon className="size-4" />;
		if (theme === "system") return <Sun className="size-4" />;
		return <Sun className="size-4" />;
	};

	const navItems = [
		{ to: "/download", label: "Download", icon: Download },
		{ to: "/settings", label: "Settings", icon: Settings },
	];

	return (
		<div
			className={cn(
				"flex h-full flex-col gap-6 p-4 transition-[width] duration-300",
				isMobile ? "w-72" : computedCollapsed ? "w-20" : "w-72",
			)}
		>
			<header className="flex items-center gap-3">
				<div className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/20">
					<img
						src="/logo.png"
						alt="Logo SoundGrab"
						className="h-full w-full object-cover"
					/>
				</div>
				<div className="flex flex-1 items-center justify-between gap-2">
					<div className={cn("min-w-0", computedCollapsed && "lg:hidden")}>
						<p className="truncate text-base font-semibold">SoundGrab</p>
						<p className="text-xs text-muted-foreground">Downloader</p>
					</div>
					{isMobile ? (
						<Button
							size="icon"
							variant="ghost"
							onClick={onCloseMobile}
							aria-label="Fermer la navigation"
						>
							<X className="size-4" />
						</Button>
					) : (
						<Button
							size="icon"
							variant="ghost"
							onClick={onToggleCollapse}
							aria-label={
								computedCollapsed ? "Étendre la sidebar" : "Rétrécir la sidebar"
							}
							className="hidden lg:inline-flex"
						>
							{computedCollapsed ? (
								<ChevronsRight className="size-4" />
							) : (
								<ChevronsLeft className="size-4" />
							)}
						</Button>
					)}
				</div>
			</header>

			<nav className="flex-1 space-y-2">
				{navItems.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.to}
							to={item.to}
							onClick={onCloseMobile}
							className={cn(
								"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
								isActive(item.to)
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-foreground hover:bg-accent",
								computedCollapsed && "lg:justify-center lg:px-2",
							)}
						>
							<Icon className="size-5 shrink-0" />
							<span
								className={cn(
									"truncate transition-opacity duration-200",
									computedCollapsed ? "lg:hidden" : "lg:opacity-100",
								)}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</nav>

			<div className="space-y-2 mt-auto">
				<Button
					variant="ghost"
					onClick={toggleTheme}
					className={cn(
						"w-full justify-start gap-3 px-3 py-2.5 h-auto",
						computedCollapsed && "lg:justify-center lg:px-2",
					)}
					title={`Theme: ${theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}`}
				>
					{getThemeIcon()}
					<span
						className={cn(
							"font-medium transition-opacity duration-200",
							computedCollapsed ? "lg:hidden" : "lg:opacity-100",
						)}
					>
						{theme === "system"
							? "System"
							: theme === "dark"
								? "Dark"
								: "Light"}
					</span>
				</Button>
			</div>
		</div>
	);
}

export default function Sidebar() {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Fermer le panneau mobile lors d'un changement de route
	const pathname = useLocation({
		select: (location) => location.pathname,
	});
	useEffect(() => {
		setIsMobileOpen(false);
		// référence pour satisfaire la dépendance
		void pathname;
	}, [pathname]);

	const computedCollapsed = isCollapsed && !isMobileOpen;

	return (
		<>
			{/* Bouton mobile */}
			<div className="fixed left-4 top-4 z-50 lg:hidden">
				<Button
					size="icon"
					variant="outline"
					className="backdrop-blur bg-background/70 border-border/70"
					onClick={() => setIsMobileOpen(true)}
					aria-label="Ouvrir la navigation"
				>
					<Menu className="size-5" />
				</Button>
			</div>

			{/* Panneau mobile */}
			<div
				className={cn(
					"fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
					isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
				)}
			>
				<div
					className="absolute inset-0 bg-background/70 backdrop-blur-sm"
					onClick={() => setIsMobileOpen(false)}
					aria-hidden
				/>
				<div
					className={cn(
						"absolute left-0 top-0 h-full w-72 bg-card/90 border-r backdrop-blur shadow-xl transition-transform duration-300",
						isMobileOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					<SidebarContent
						computedCollapsed={false}
						isMobile
						onCloseMobile={() => setIsMobileOpen(false)}
					/>
				</div>
			</div>

			{/* Sidebar desktop */}
			<aside className="hidden lg:relative lg:flex lg:h-screen lg:flex-col lg:border-r lg:bg-card/70 lg:backdrop-blur">
				<SidebarContent
					computedCollapsed={computedCollapsed}
					isMobile={false}
					onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
				/>
			</aside>
		</>
	);
}
