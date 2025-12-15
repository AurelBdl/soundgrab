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
const CORS_PROXY =
	// Définir VITE_CORS_PROXY="" pour tenter sans proxy
	// Exemple: https://corsproxy.io/? ou https://api.allorigins.win/raw?url=
	import.meta.env.VITE_CORS_PROXY ?? "https://corsproxy.io/?";

const withProxy = (url: string) => (CORS_PROXY ? `${CORS_PROXY}${url}` : url);

const buildSearchParams = (params: Record<string, string | undefined>) => {
	const search = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value) {
			search.set(key, value);
		}
	});
	return search.toString();
};

const resolveTrack = async ({
	url,
	clientId,
	accessToken,
}: TrackRequest): Promise<SoundcloudTrack> => {
	const query = buildSearchParams({
		url,
		client_id: clientId,
		oauth_token: accessToken,
	});

	const response = await fetch(withProxy(`${API_BASE}/resolve?${query}`));

	if (!response.ok) {
		throw new Error(
			`Impossible de récupérer la ressource (${response.status})`,
		);
	}

	return response.json();
};

const fetchStreamUrl = async (
	trackId: number,
	clientId: string,
	accessToken?: string,
): Promise<string> => {
	const query = buildSearchParams({
		client_id: clientId,
		oauth_token: accessToken,
	});

	const response = await fetch(
		withProxy(`${API_BASE}/i1/tracks/${trackId}/streams?${query}`),
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
};

export const getSoundCloudTrackInfo = async ({
	url,
	clientId,
	accessToken,
}: TrackRequest): Promise<TrackInfo> => {
	try {
		if (!url || !clientId) {
			throw new Error("URL et Client ID requis");
		}

		// Appels côté client (avec proxy CORS si défini)
		const track = await resolveTrack({ url, clientId, accessToken });
		const streamUrl = await fetchStreamUrl(track.id, clientId, accessToken);

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

		const track = await resolveTrack({ url, clientId, accessToken });

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
