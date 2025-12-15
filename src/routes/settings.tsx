import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const [clientId, setClientId] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const [saved, setSaved] = useState(false);
	const clientIdInputId = useId();
	const accessTokenInputId = useId();

	useEffect(() => {
		// Load client ID and access token from localStorage on mount
		const savedClientId = localStorage.getItem("soundcloud_client_id") || "";
		const savedAccessToken =
			localStorage.getItem("soundcloud_access_token") || "";
		setClientId(savedClientId);
		setAccessToken(savedAccessToken);
	}, []);

	const handleSave = () => {
		localStorage.setItem("soundcloud_client_id", clientId);
		localStorage.setItem("soundcloud_access_token", accessToken);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	return (
		<div className="flex-1">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:mx-0 lg:max-w-none">
				<header className="flex flex-col gap-2">
					<h1 className="text-3xl font-semibold leading-tight">Settings</h1>
					<p className="text-sm text-muted-foreground">
						Configure vos identifiants SoundCloud pour débloquer le
						téléchargement.
					</p>
				</header>

				<div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
					<div className="rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={clientIdInputId}>Soundcloud Client ID</Label>
								<Input
									id={clientIdInputId}
									type="text"
									placeholder="Enter your Soundcloud Client ID"
									value={clientId}
									onChange={(e) => setClientId(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor={accessTokenInputId}>
									Soundcloud Access Token
								</Label>
								<Input
									id={accessTokenInputId}
									type="text"
									placeholder="Enter your Soundcloud Access Token"
									value={accessToken}
									onChange={(e) => setAccessToken(e.target.value)}
								/>
							</div>

							<Button onClick={handleSave} className="w-full" disabled={saved}>
								{saved ? (
									<>
										<Check className="size-4" />
										Saved
									</>
								) : (
									"Save"
								)}
							</Button>
						</div>
					</div>

					<div className="rounded-2xl border bg-muted/60 p-6 shadow-sm backdrop-blur">
						<h2 className="text-lg font-semibold mb-3">
							How to retrieve your Client ID and Access Token
						</h2>
						<ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
							<li>
								Go to soundcloud.com and log in (skip this step if you are
								already logged in)
							</li>
							<li>
								Open developer tools (Right click → Inspect) and go to the
								Network tab
							</li>
							<li>
								Go to soundcloud.com, you should see several requests in the
								Network tab
							</li>
							<li>
								Find the request named{" "}
								<code className="px-1.5 py-0.5 rounded bg-background text-foreground font-mono text-xs">
									session
								</code>{" "}
								(you can filter by typing "session" in the filter box) and click
								on it
							</li>
							<li>Go to the Payload tab</li>
							<li>
								You should see your client id in the Query String Parameters
								section, and your oauth token (
								<code className="px-1.5 py-0.5 rounded bg-background text-foreground font-mono text-xs">
									access_token
								</code>
								) in the Request Payload section
							</li>
						</ol>
					</div>
				</div>
			</div>
		</div>
	);
}
