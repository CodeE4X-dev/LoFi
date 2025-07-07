from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/lowfinder', methods=['GET'])
def lowfinder():
    placeid = request.args.get("placeid")
    min_players = request.args.get("min")
    max_players = request.args.get("max")

    if not placeid or not min_players or not max_players:
        return jsonify({"error": "Missing placeid, min, or max"}), 400

    try:
        min_players = int(min_players)
        max_players = int(max_players)
    except ValueError:
        return jsonify({"error": "min and max must be integers"}), 400

    cursor = ""
    found_server = None

    try:
        while True:
            url = f"https://games.roblox.com/v1/games/{placeid}/servers/Public?limit=100"
            if cursor:
                url += f"&cursor={cursor}"

            res = requests.get(url, timeout=10)
            data = res.json()

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
            cursor = data.get("nextPageCursor")

        if found_server:
            return jsonify(found_server)
        else:
            return jsonify({"message": "No server found in that range."})

    except Exception as e:
        return jsonify({"error": "Something went wrong", "detail": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
