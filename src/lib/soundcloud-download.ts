import { createRequire } from "node:module";
import { createServerFn } from "@tanstack/react-start";

const require = createRequire(import.meta.url);
const SoundcloudModule = require("soundcloud.ts");
const Soundcloud =
	SoundcloudModule.default || SoundcloudModule.Soundcloud || SoundcloudModule;

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

export const getSoundCloudTrackInfo = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: {
			url: string;
			clientId: string;
			accessToken?: string;
		}): {
			url: string;
			clientId: string;
			accessToken?: string;
		} => {
			if (!data.url || !data.clientId) {
				throw new Error("URL and Client ID required");
			}
			return data;
		},
	)
	.handler(async ({ data }): Promise<TrackInfo> => {
		const { url, clientId, accessToken } = data;

		try {
			// Initialize SoundCloud with client ID and access token
			const soundcloud = new Soundcloud(clientId, accessToken);

			// Get track information
			const track = await soundcloud.tracks.get(url);

			// Get stream URL for download
			const streamUrl = await soundcloud.util.streamLink(url);

			return {
				success: true,
				trackTitle: track.title,
				downloadUrl: streamUrl,
			};
		} catch (error) {
			console.error("Error retrieving information:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	});

export const getSoundCloudTrackPreview = createServerFn({
	method: "POST",
})
	.inputValidator(
		(data: {
			url: string;
			clientId: string;
			accessToken?: string;
		}): {
			url: string;
			clientId: string;
			accessToken?: string;
		} => {
			if (!data.url || !data.clientId) {
				throw new Error("URL and Client ID required");
			}
			return data;
		},
	)
	.handler(async ({ data }): Promise<TrackPreview> => {
		const { url, clientId, accessToken } = data;

		try {
			// Initialize SoundCloud with client ID and access token
			const soundcloud = new Soundcloud(clientId, accessToken);

			// Get track information
			const track = await soundcloud.tracks.get(url);

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
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	});
