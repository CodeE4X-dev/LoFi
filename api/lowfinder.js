import axios from 'axios';

export default async function handler(req, res) {
    const { placeid, min, max } = req.query;

    if (!placeid || !min || !max) {
        return res.status(400).json({ error: "Missing parameters: placeid, min, or max" });
    }

    const limit = 100;
    let cursor = "";
    let foundServer = null;

    try {
        while (true) {
            const url = `https://games.roblox.com/v1/games/${placeid}/servers/Public?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
            const response = await axios.get(url);
            const servers = response.data.data;

            for (const server of servers) {
                const playerCount = server.playing;
                if (playerCount >= parseInt(min) && playerCount <= parseInt(max)) {
                    foundServer = {
                        placeId: placeid,
                        jobId: server.id,
                        playing: playerCount,
                        maxPlayers: server.maxPlayers,
                        ping: server.ping,
                        teleportUrl: `https://vyn.wtf/redirect?placeId=${placeid}&gameInstanceId=${server.id}`
                    };
                    break;
                }
            }

            if (foundServer || !response.data.nextPageCursor) break;
            cursor = response.data.nextPageCursor;
        }

        if (foundServer) {
            res.status(200).json(foundServer);
        } else {
            res.status(200).json({ message: "No server found in that range." });
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch servers", detail: error.message });
    }
}
