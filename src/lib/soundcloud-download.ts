import { createServerFn } from "@tanstack/react-start";

export interface TrackInfo {
	success: boolean;
	trackTitle?: string;
	downloadUrl?: string;
	error?: string;
}

export interface TrackPreview {
	success: boolean;
	title?: string;
	artist?: string;
	artworkUrl?: string;
	duration?: number;
	error?: string;
}

type TrackRequest = {
	url: string;
	clientId: string;
	accessToken?: string;
};

type SoundcloudTrack = {
	id: number;
	title?: string;
	artwork_url?: string;
	duration?: number;
	user?: { username?: string };
};

type StreamsResponse = {
	http_mp3_128_url?: string;
	hls_mp3_128_url?: string;
	progressive?: Array<{ url?: string }>;
	hls?: Array<{ url?: string }>;
};

const API_BASE = "https://api-v2.soundcloud.com";

const buildSearchParams = (params: Record<string, string | undefined>) => {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value) {
			search.set(key, value);
		}
	});
	return search.toString();
};

const resolveTrackServer = createServerFn({ method: "POST" })
	.inputValidator((data: TrackRequest) => {
		if (!data.url || !data.clientId) {
			throw new Error("URL et Client ID requis");
		}
		return data;
	})
	.handler(async ({ data }): Promise<SoundcloudTrack> => {
		const query = buildSearchParams({
			url: data.url,
			client_id: data.clientId,
			oauth_token: data.accessToken,
		});

		const response = await fetch(`${API_BASE}/resolve?${query}`);

		if (!response.ok) {
			throw new Error(
				`Impossible de récupérer la ressource (${response.status})`,
			);
		}

		return response.json();
	});

const fetchStreamUrlServer = createServerFn({ method: "POST" })
	.inputValidator((data: TrackRequest & { trackId: number }) => {
		if (!data.trackId || !data.clientId) {
			throw new Error("Track ID et Client ID requis");
		}
		return data;
	})
	.handler(async ({ data }): Promise<string> => {
		const query = buildSearchParams({
			client_id: data.clientId,
			oauth_token: data.accessToken,
		});

		const response = await fetch(
			`${API_BASE}/i1/tracks/${data.trackId}/streams?${query}`,
		);

		if (!response.ok) {
			throw new Error(
				`Impossible de récupérer le flux audio (${response.status})`,
			);
		}

		const streams: StreamsResponse = await response.json();

		return (
			streams.http_mp3_128_url ||
			streams.hls_mp3_128_url ||
			streams.progressive?.[0]?.url ||
			streams.hls?.[0]?.url ||
			""
		);
	});

export const getSoundCloudTrackInfo = async ({
	url,
	clientId,
	accessToken,
}: TrackRequest): Promise<TrackInfo> => {
	try {
		if (!url || !clientId) {
			throw new Error("URL et Client ID requis");
		}

		// Proxy via server (même origine) pour éviter le blocage CORS côté client
		const track = await resolveTrackServer({
			data: { url, clientId, accessToken },
		});
		const streamUrl = await fetchStreamUrlServer({
			data: { trackId: track.id, clientId, accessToken, url },
		});

		if (!streamUrl) {
			throw new Error("URL de téléchargement introuvable");
		}

		return {
			success: true,
			trackTitle: track.title,
			downloadUrl: streamUrl,
		};
	} catch (error) {
		console.error("Error retrieving information:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
};

export const getSoundCloudTrackPreview = async ({
	url,
	clientId,
	accessToken,
}: TrackRequest): Promise<TrackPreview> => {
	try {
		if (!url || !clientId) {
			throw new Error("URL et Client ID requis");
		}

		const track = await resolveTrackServer({
			data: { url, clientId, accessToken },
		});

		return {
			success: true,
			title: track.title,
			artist: track.user?.username || "Unknown artist",
			artworkUrl:
				track.artwork_url?.replace("large", "t500x500") ||
				track.artwork_url ||
				"",
			duration: track.duration,
		};
	} catch (error) {
		console.error("Error retrieving preview:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Erreur inconnue",
		};
	}
};
