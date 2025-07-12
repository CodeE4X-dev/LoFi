from flask import Flask, request, jsonify
import requests
import time

app = Flask(__name__)

@app.route('/lowfinder', methods=['GET'])
def lowfinder():
    placeid = request.args.get("placeid")
    max_players = request.args.get("max")

    if not placeid or not max_players:
        return jsonify({"error": "Missing placeid or max"}), 400

    try:
        max_players = int(max_players)
    except ValueError:
        return jsonify({"error": "max must be an integer"}), 400

    retries = 0
    found_server = None

    while retries < 5 and not found_server:
        try:
            cursor = ""

            while True:
                url = f"https://games.roblox.com/v1/games/{placeid}/servers/Public?limit=100"
                if cursor:
                    url += f"&cursor={cursor}"

                res = requests.get(url, timeout=10)
                data = res.json()

                for server in data.get("data", []):
                    playing = server.get("playing", 0)
                    if playing <= max_players:
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

        except Exception as e:
            retries += 1
            time.sleep(1)  
            continue

        if not found_server:
            retries += 1
            time.sleep(1) 

    if found_server:
        return jsonify(found_server)
    else:
        return jsonify({"message": "No server found with player count <= max after 5 tries."}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

