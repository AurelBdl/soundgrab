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
	// Laisser vide pour tenter en direct (évite certains 404 sur des URLs signées)
	// Exemple de proxy: https://corsproxy.io/? ou https://api.allorigins.win/raw?url=
	import.meta.env.VITE_CORS_PROXY ?? "";

const withProxy = (url: string) => (CORS_PROXY ? `${CORS_PROXY}${url}` : url);

const fetchWithCors = async (url: string, init?: RequestInit) => {
	// 1) tentative directe
	const direct = await fetch(url, init).catch(() => undefined);
	if (direct?.ok) return direct;

	// 2) si échec et proxy dispo, retente via proxy
	if (CORS_PROXY) {
		const proxied = await fetch(withProxy(url), init).catch(() => undefined);
		if (proxied?.ok) return proxied;
		if (proxied) return proxied; // retourne la réponse même non-ok si dispo
	}

	// 3) retourne la réponse directe même non-ok si existante
	if (direct) return direct;
	throw new Error("Échec réseau");
};

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

	const response = await fetchWithCors(`${API_BASE}/resolve?${query}`);

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

	// 1) Endpoint streams (i1)
	const streamsResp = await fetchWithCors(
		`${API_BASE}/i1/tracks/${trackId}/streams?${query}`,
	);

	if (streamsResp.ok) {
		const streams: StreamsResponse = await streamsResp.json();
		const url =
			streams.http_mp3_128_url ||
			streams.hls_mp3_128_url ||
			streams.progressive?.[0]?.url ||
			streams.hls?.[0]?.url ||
			"";
		if (url) return url;
	}

	// 2) Fallback: transcodings depuis /tracks/{id}
	const trackResp = await fetchWithCors(
		`${API_BASE}/tracks/${trackId}?${query}`,
	);

	if (!trackResp.ok) {
		throw new Error(
			`Impossible de récupérer le flux audio (${trackResp.status})`,
		);
	}

	const trackData = (await trackResp.json()) as SoundcloudTrack & {
		media?: {
			transcodings?: Array<{ url?: string; format?: { protocol?: string } }>;
		};
	};

	const progressive = trackData.media?.transcodings?.find(
		(t) => t.format?.protocol === "progressive",
	);
	if (progressive?.url) {
		const urlResp = await fetchWithCors(
			`${progressive.url}?client_id=${clientId}`,
		);
		if (!urlResp.ok) {
			throw new Error(
				`Impossible de récupérer l'URL progressive (${urlResp.status})`,
			);
		}
		const data = (await urlResp.json()) as { url?: string };
		if (data.url) return data.url;
	}

	throw new Error("URL de téléchargement introuvable");
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
