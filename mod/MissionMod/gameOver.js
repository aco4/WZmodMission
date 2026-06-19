namespace("gameOver_");

var gameOver_message = "";
var gameOver = false;

function gameOver_eventPlayerLeft(player)
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}
		if (countDroid(DROID_ANY, player) > 0)
		{
			return;
		}
	}

	for (let player = 0; player < maxPlayers; player++)
	{
		gameOver_finalize(player, false);
	}
	if (isSpectator(-1))
	{
		gameOverMessage(false);
	}
}

function gameOver_eventDestroyed(object)
{
	if (object.player === ENEMY && object.type === STRUCTURE)
	{
		// Check if nuclear sites are destroyed
		const { x, y } = startPositions[ENEMY];
		if (getObject(x, y) || getObject(x-1, y) || getObject(x, y-1) || getObject(x-1, y-1))
		{
			return;
		}

		if (gameOver)
		{
			return;
		}

		gameOver = true;

		playSound("pcv459.ogg");

		for (let player = 0; player < maxPlayers; player++)
		{
			gameOver_finalize(player, true);
		}
		if (isSpectator(-1))
		{
			gameOverMessage(false);
		}

		gameOver_message = gameOver_formatTime(gameTime);
		gameOver_sendMessage();
		setTimer("gameOver_sendMessage", 5000);
	}
}

function gameOver_eventMissionTimeout()
{
	if (gameOver)
	{
		return;
	}
	playSound("pcv629.ogg");
	playSound("pcv458.ogg");
	playSound(`laugh${syncRandom(3)+1}.ogg`);

	gameOver = true;
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}
		for (const s of enumStruct(player))
		{
			fireWeaponAtLoc("LasSat", s.x, s.y, ENEMY);
		}
	}
	queue("gameOver_timeout", 5 * 1000);
}

function gameOver_timeout()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		gameOver_finalize(player, false);
	}
	if (isSpectator(-1))
	{
		gameOverMessage(false);
	}
}

function gameOver_finalize(player, win)
{
	if (player === selectedPlayer)
	{
		gameOverMessage(win);
	}
	if (!win && !isSpectator(player) && playerData[player].isHuman)
	{
		// should come after gameOverMessage() to ensure the proper gameOverMessage is displayed
		transformPlayerToSpectator(player);
	}
}

function gameOver_sendMessage()
{
	console(" ");
	console("★ " + _("Well-played") + " ★");
	console(_("Mission Time") + ": " + gameOver_message);
	console(" ");
}

function gameOver_formatTime(time)
{
	const hours = Math.floor(time/1000/60/60);
	const minutes = Math.floor(time/1000/60) % 60;
	const seconds = Math.floor(time/1000) % 60;
	if (hours > 0)
	{
		return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}
	else
	{
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	}
}
