import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/lowfinder")
async def low_server_finder(request: Request):
    placeid = request.query_params.get("placeid")
    min_players = request.query_params.get("min")
    max_players = request.query_params.get("max")

    if not placeid or not min_players or not max_players:
        return JSONResponse(status_code=400, content={"error": "Missing placeid, min, or max parameter"})

    min_players = int(min_players)
    max_players = int(max_players)

    cursor = ""
    found_server = None

    try:
        while True:
            url = f"https://games.roblox.com/v1/games/{placeid}/servers/Public?limit=100"
            if cursor:
                url += f"&cursor={cursor}"

            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                data = response.json()

            for server in data.get("data", []):
                playing = server.get("playing", 0)
                if min_players <= playing <= max_players:
                    found_server = {
                        "placeId": placeid,
                        "jobId": server["id"],
                        "playing": playing,
                        "maxPlayers": server.get("maxPlayers"),
                        "ping": server.get("ping"),
                        "teleportUrl": f"https://vyn.wtf/redirect?placeId={placeid}&gameInstanceId={server['id']}"
                    }
                    break

            if found_server or not data.get("nextPageCursor"):
                break
            cursor = data["nextPageCursor"]

        if found_server:
            return JSONResponse(content=found_server)
        else:
            return JSONResponse(content={"message": "No server found in that range."})

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": "Something went wrong", "detail": str(e)})
