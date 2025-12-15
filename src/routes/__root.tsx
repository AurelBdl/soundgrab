/* eslint-disable react/no-danger */
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import Sidebar from "../components/Sidebar";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "SoundGrab",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: () => (
		<div className="p-4 text-sm text-muted-foreground">
			Page introuvable
		</div>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
				<script>
					{`
            (function() {
              const theme = localStorage.getItem('theme') || 'system';
              const root = document.documentElement;
              root.classList.remove('light', 'dark');
              if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
              } else {
                root.classList.add(theme);
              }
            })();
          `}
				</script>
			</head>
			<body>
				<div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30 text-foreground">
					<div className="min-h-screen lg:flex lg:flex-row">
						<Sidebar />
						<main className="flex min-h-screen flex-1 flex-col px-4 pt-16 pb-6 sm:px-6 sm:pt-20 lg:px-10 lg:pt-8">
							<div className="mx-auto flex w-full flex-col gap-8 lg:mx-0 lg:max-w-none">
								{children}
							</div>
						</main>
					</div>
				</div>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
