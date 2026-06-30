namespace("base_");

const base_distance = 20; // Near-HQ player base exclusion zone distance
var base_heatmap; // Store distance from player base. null means unreachable
var base_maxDist; // May be null if enemy HQ is not reachable
var base_players = [];

function base_eventGameInit()
{
	for (let player = 0; player < maxPlayers; player++)
	{
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
	base_heatmap = base_buildDistanceHeatmap();
	base_maxDist = (() =>
	{
		const { x, y } = startPositions[ENEMY];
		const i = y*mapWidth + x;
		return base_heatmap[i];
	})();

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

	// Pick seeds for buildings
	const building_seeds = new Set();
	for (let x = 0; x < mapWidth; x++)
	{
		for (let y = 0; y < mapHeight; y++)
		{
			if (syncRandom(40) === 0)
			{
				building_seeds.add(`${x},${y}`);
			}
		}
	}
	// Build buildings
	for (const seed of building_seeds)
	{
		const [x, y] = seed.split(",").map(z => Number(z));
		if (base_canBuildAt(x, y))
		{
			base_buildAt(x, y, BUILDINGS);
		}
	}

	// Pick seeds for walls
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

	// Build oils
	for (const position of derrickPositions)
	{
		for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]])
		{
			const x = position.x + dx;
			const y = position.y + dy;
			const distance = base_heatmap[y*mapWidth + x];
			if (distance !== null && distance > base_distance)
			{
				addStructure("A0ResourceExtractor", ENEMY, position.x*128, position.y*128);
				break;
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
		const size = base_sizeOf[structure];
		if (size && !base_areaCheck[size](x, y))
		{
			return;
		}
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

function base_buildDistanceHeatmap()
{
	const dist = new Array(mapWidth * mapHeight).fill(null);
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

		// 25% chance to spread diagonally. Effect: circular BFS
		if (!syncRandom(4) && (base_canBuildAt(cur.x+1, cur.y) || base_canBuildAt(cur.x, cur.y+1))) neighbors.push([cur.x + 1, cur.y + 1]);
		if (!syncRandom(4) && (base_canBuildAt(cur.x+1, cur.y) || base_canBuildAt(cur.x, cur.y-1))) neighbors.push([cur.x + 1, cur.y - 1]);
		if (!syncRandom(4) && (base_canBuildAt(cur.x-1, cur.y) || base_canBuildAt(cur.x, cur.y+1))) neighbors.push([cur.x - 1, cur.y + 1]);
		if (!syncRandom(4) && (base_canBuildAt(cur.x-1, cur.y) || base_canBuildAt(cur.x, cur.y-1))) neighbors.push([cur.x - 1, cur.y - 1]);

		for (const [nx, ny] of neighbors)
		{
			if (!base_canBuildAt(nx, ny))
			{
				continue;
			}

			const i = ny*mapWidth + nx;
			if (dist[i] !== null && dist[i] <= curDist + 1)
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
 * Pick a random element from an array, based on distance from the nearest player HQ
 * @param {number} distance - tile distance from the nearest player HQ
 * @param {*[]} arr - array of elements to choose from
 * @returns {*} A random element, or null
 */
function base_get(distance, arr)
{
	if (!distance || arr.length === 0)
	{
		return null;
	}

	const RANGE = base_maxDist - base_distance;

	distance -= base_distance;
	if (distance < 0)
	{
		return null;
	}

	// Normalize the distance [0, 1]
	const normalizedDistance = distance / RANGE;

	// Pick an index in the array
	let i = Math.min(arr.length - 1, Math.floor(normalizedDistance * arr.length));

	// Apply some randomness
	const variance = Math.max(1, Math.floor(arr.length / 12));
	i = Math.max(0, i - syncRandom(variance));

	return arr[i];
}

// x width, y width
const base_sizeOf = {
	"A0BaBaPowerGenerator": "1x1",
	"A0CyborgFactory": "1x2",
	"A0BaBaFactory": "2x1",
	"A0ResearchFacility": "2x2",
	"A0PowerGenerator": "2x2",
	"X-Super-Cannon": "2x2",
	"X-Super-Rocket": "2x2",
	"X-Super-Missile": "2x2",
	"X-Super-MassDriver": "2x2",
	"A0LightFactory": "3x3",
};

const base_areaCheck = {
	"1x1": (x, y) => {
		return base_canBuildAt(x, y);
	},
	"1x2": (x, y) => {
		return base_canBuildAt(x, y)
			&& base_canBuildAt(x, y-1);
	},
	"2x1": (x, y) => {
		return base_canBuildAt(x, y)
			&& base_canBuildAt(x-1, y);
	},
	"2x2": (x, y) => {
		return base_canBuildAt(x, y)
			&& base_canBuildAt(x-1, y)
			&& base_canBuildAt(x, y-1)
			&& base_canBuildAt(x-1, y-1);
	},
	"3x3": (x, y) => {
		return base_canBuildAt(x-1, y-1)
			&& base_canBuildAt(x-1, y+0)
			&& base_canBuildAt(x-1, y+1)
			&& base_canBuildAt(x+0, y-1)
			&& base_canBuildAt(x+0, y+0)
			&& base_canBuildAt(x+0, y+1)
			&& base_canBuildAt(x+1, y-1)
			&& base_canBuildAt(x+1, y+0)
			&& base_canBuildAt(x+1, y+1);
	},
};
