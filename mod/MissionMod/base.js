namespace("base_");

var base_heatmap; // Store distance from player base
var base_players = [];

function base_eventGameInit()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		// if (player === ENEMY)
		// {
		// 	continue;
		// }

		if (countDroid(DROID_ANY, player) > 0)
		{
			base_players.push(player);
		}
		enumStruct(player).forEach(s => removeObject(s));
		enumDroid(player).forEach(d => removeObject(d));
	}
	// Wait for object removal
	queue("base_main");
}

function base_main()
{
	base_heatmap = buildDistanceHeatmap();

	// Put Missile Silos where HQ was
	addStructure("NX-ANTI-SATSite", ENEMY, startPositions[ENEMY].x * 128, startPositions[ENEMY].y * 128);
	addStructure("NX-ANTI-SATSite", ENEMY, startPositions[ENEMY].x * 128 - 128, startPositions[ENEMY].y * 128);
	addStructure("NX-ANTI-SATSite", ENEMY, startPositions[ENEMY].x * 128, startPositions[ENEMY].y * 128 - 128);
	addStructure("NX-ANTI-SATSite", ENEMY, startPositions[ENEMY].x * 128 - 128, startPositions[ENEMY].y * 128 - 128);

	// Give players vision of Missile Silos
	hackNetOff();
	for (let player = 0; player < maxPlayers; player++)
	{
		addSpotter(startPositions[ENEMY].x, startPositions[ENEMY].y, player, 91, false, 1000);
	}
	hackNetOn();

	// Pick seeds
	const seeds = new Set();
	for (let x = 0; x < mapWidth; x++)
	{
		for (let y = 0; y < mapHeight; y++)
		{
			if (syncRandom(40) === 0)
			{
				seeds.add(`${x},${y}`);
			}
		}
	}

	// Build walls
	for (const seed of seeds)
	{
		const [x, y] = seed.split(",").map(z => Number(z));
		const [dx, dy] = (() =>
		{
			switch (syncRandom(4))
			{
				case 0: return [ -1, -1 ];
				case 1: return [  1, -1 ];
				case 2: return [ -1,  1 ];
				case 3: return [  1,  1 ];
			}
		})();

		if (base_canBuildAt(x, y))
		{
			base_buildAt(x, y, WALLS);
			base_wall(x+dx, y, dx, 0);
			base_wall(x, y+dy, 0, dy);
		}
	}

	// Build defenses
	for (let i = 0; i < mapWidth * mapHeight; i++)
	{
		if (syncRandom(6) === 0)
		{
			const x = i % mapWidth;
			const y = Math.floor(i / mapWidth);

			if (base_canBuildAt(x, y))
			{
				base_buildAt(x, y, DEFENSES);
			}
		}
	}
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} dx - A number in range [-1, 1]
 * @param {number} dy - A number in range [-1, 1]
 */
function base_wall(x, y, dx, dy)
{
	if (base_canBuildAt(x, y))
	{
		base_buildAt(x, y, WALLS);

		// Recurse
		base_wall(x+dx, y+dy, dx, dy);
	}
}

/**
 * @param {number} x
 * @param {number} y
 * @param {array} structures - array of structures to pick from
 */
function base_buildAt(x, y, structures)
{
	const i = y*mapWidth + x;
	const distance = base_heatmap[i];
	const structure = base_get(distance, structures);
	if (structure)
	{
		addStructure(structure, ENEMY, x*128, y*128);
	}
}

/**
 * @param {number} x
 * @param {number} y
 */
function base_canBuildAt(x, y)
{
	const t = terrainType(x, y);
	if (t === TER_CLIFFFACE || t === TER_WATER)
	{
		return false;
	}

	if (x < 3 || y < 3 || x >= mapWidth-3 || y >= mapHeight-3)
	{
		return false;
	}

	if (getObject(x, y))
	{
		return false;
	}

	return true;
}

function buildDistanceHeatmap()
{
	const dist = new Array(mapWidth * mapHeight).fill(Infinity);
	const queue = [];
	let head = 0;

	// Multi-source BFS: all start positions begin at distance 0.
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}

		const { x, y } = startPositions[player];
		const i = y*mapWidth + x;
		dist[i] = 0;
		queue.push({ x, y });
	}

	while (head < queue.length)
	{
		const cur = queue[head++];
		const i = cur.y*mapWidth + cur.x;
		const curDist = dist[i];

		const neighbors = [
			[cur.x + 1, cur.y],
			[cur.x - 1, cur.y],
			[cur.x, cur.y + 1],
			[cur.x, cur.y - 1],
		];

		for (const [nx, ny] of neighbors)
		{
			if (!base_canBuildAt(nx, ny))
			{
				continue;
			}

			const i = ny*mapWidth + nx;
			if (dist[i] <= curDist + 1)
			{
				continue;
			}

			dist[i] = curDist + 1;
			queue.push({x: nx, y: ny});
		}
	}

	return dist;
}

/**
 * Get a random structure
 * @param {number} distance - tile distance from the player
 * @param {string[]} structures - options
 * @returns {string | null}
 */
function base_get(distance, structures)
{
	if (distance === Infinity || structures.length === 0)
	{
		return null;
	}
	if (distance >= structures.length)
	{
		distance = structures.length - 1;
	}
	const i = Math.max(0, distance - syncRandom(5));
	return structures[i];
}
