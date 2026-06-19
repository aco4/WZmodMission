namespace("landing_");

var landingData = new Array(maxPlayers);

function landing_eventStartLevel()
{
	queue("landing_spawnTransport", CUTSCENE_DURATION);
}

function landing_spawnTransport()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}

		// Initialize the player's landing data
		landingData[player] = {
			state: "ENTERING",
			landingTime: null,
			origin: landing_origin(startPositions[player]), // { x, y }
			destination: startPositions[player] // { x, y }
		};

		// Spawn the player's transport
		hackNetOff();
		const droid = addDroid(player, landingData[player].origin.x, landingData[player].origin.y, "Dropship", "SuperTransportBody", "V-Tol", "", "", "NULL-VTOL-Transport-Turret");
		hackNetOn();
		setDroidExperience(droid, 9999);

		// Move it to the HQ
		orderDroidLoc(droid, DORDER_MOVE, landingData[player].destination.x, landingData[player].destination.y);

		// Move the camera
		if (player === selectedPlayer)
		{
			// cameraSlide(landingData[player].origin.x * 128, landingData[player].origin.y * 128);
			centreView(landingData[player].origin.x, landingData[player].origin.y);
		}

		// Place red landing lights
		setNoGoArea(
			landingData[player].destination.x, landingData[player].destination.y,
			landingData[player].destination.x + 1, landingData[player].destination.y + 1,
			0
		);
	}

	// Start the landing process loop
	queue("landing_tick", 1 * 1000);

	// Track the transport with the camera (Need 1 tick delay)
	queue("landing_track", 100);
}

function landing_track()
{
	cameraTrack(enumDroid(selectedPlayer)[0]);
}

function landing_tick()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}
		else if (landingData[player].state === "ENTERING")
		{
			const droid = enumDroid(player)[0];
			orderDroidLoc(droid, DORDER_MOVE, landingData[player].destination.x, landingData[player].destination.y);

			if (landing_isAt(landingData[player].destination.x, landingData[player].destination.y, droid.id))
			{
				landingData[player].landingTime = gameTime + (4 * 1000);
				landingData[player].state = "LANDING";
			}

			if (player === selectedPlayer)
			{
				cameraTrack(droid);
			}
		}
		else if (landingData[player].state === "LANDING")
		{
			if (gameTime >= landingData[player].landingTime)
			{
				const { x, y } = landingData[player].destination;
				addDroid(player, x-1, y-1, "Truck Viper Wheels", "Body1REC", "wheeled01", "", "", "Spade1Mk1");
				addDroid(player, x-1, y+0, "Truck Viper Wheels", "Body1REC", "wheeled01", "", "", "Spade1Mk1");
				addDroid(player, x+0, y-1, "Truck Viper Wheels", "Body1REC", "wheeled01", "", "", "Spade1Mk1");
				addDroid(player, x+0, y+0, "Truck Viper Wheels", "Body1REC", "wheeled01", "", "", "Spade1Mk1");
				const droid = landing_getTransporter(player);
				if (droid)
				{
					orderDroidLoc(droid, DORDER_MOVE, landingData[player].origin.x, landingData[player].origin.y);
				}
				landingData[player].state = "EXITING";

				if (player === selectedPlayer)
				{
					cameraTrack();
					cameraSlide(x*128, y*128);
					cameraZoom(5000, 2000);
					queue("reticule_init");
				}
			}
		}
		else if (landingData[player].state === "EXITING")
		{
			const droid = landing_getTransporter(player);
			if (droid)
			{
				if (landing_isAt(landingData[player].origin.x, landingData[player].origin.y, droid.id))
				{
					removeObject(droid);
					landingData[player].state = "DONE";
				}
				else
				{
					orderDroidLoc(droid, DORDER_MOVE, landingData[player].origin.x, landingData[player].origin.y);
				}
			}
		}
	}

	if (landing_isTicking())
	{
		queue("landing_tick");
	}
}

function landing_isAt(x, y, id) {
	const objects = enumArea(
		x - 1, y - 1,
		x + 1, y + 1,
		ALL_PLAYERS,
		false
	);
	return objects.some(o => o.id === id);
}

function landing_getTransporter(player)
{
	for (const droid of enumDroid(player))
	{
		if (droid.droidType === DROID_SUPERTRANSPORTER )
		{
			return droid;
		}
	}
	return null;
}

function landing_isTicking()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}
		if (landingData[player].state !== "DONE")
		{
			return true;
		}
	}
	return false;
}

// Get the nearest border position for x, y
function landing_origin({ x, y }) {
    const { x: x1, y: y1, x2, y2 } = getScrollLimits();

    // Distances to each border
    const distLeft   = Math.abs(x - x1);
    const distRight  = Math.abs(x2 - x);
    const distTop    = Math.abs(y - y1);
    const distBottom = Math.abs(y2 - y);

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    if (minDist === distLeft) {
        x = x1;
    } else if (minDist === distRight) {
        x = x2;
    } else if (minDist === distTop) {
        y = y1;
    } else { // bottom
        y = y2;
    }

    return {
        x: Math.max(1, Math.min(mapWidth - 1, x)),
        y: Math.max(1, Math.min(mapHeight - 1, y)),
    };
}
