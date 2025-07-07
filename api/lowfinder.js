export default async function handler(req, res) {
    const { placeid, min, max } = req.query;

    if (!placeid || !min || !max) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const limit = 100;
    let cursor = "";
    let foundServer = null;

    try {
        while (true) {
            const url = `https://games.roblox.com/v1/games/${placeid}/servers/Public?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
            const response = await fetch(url);
            const data = await response.json();
            const servers = data.data;

            for (const server of servers) {
                if (server.playing >= parseInt(min) && server.playing <= parseInt(max)) {
                    foundServer = {
                        placeId: placeid,
                        jobId: server.id,
                        playing: server.playing,
                        maxPlayers: server.maxPlayers,
                        ping: server.ping,
                        teleportUrl: `https://vyn.wtf/redirect?placeId=${placeid}&gameInstanceId=${server.id}`
                    };
                    break;
                }
            }

            if (foundServer || !data.nextPageCursor) break;
            cursor = data.nextPageCursor;
        }

        if (foundServer) {
            res.status(200).json(foundServer);
        } else {
            res.status(200).json({ message: "No server found in that range." });
        }

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch data", detail: err.message });
    }
}
