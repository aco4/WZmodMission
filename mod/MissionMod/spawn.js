namespace("spawn_");

function spawn_eventDestroyed(object)
{
	// Only trigger for a destroyed enemy structure
	if (object.type !== STRUCTURE || object.player !== ENEMY)
	{
		return;
	}

	// Select a structure to spawn next to
	const structures = spawn_shuffle(enumStruct(ENEMY, DEFENSE));
	const selected = {
		structure: null,
		distance: null
	};

	// Search through candidates
	const num_candidates = Math.min(structures.length, 6);
	for (let i = 0; i < num_candidates; i++)
	{
		// Lookup the distance from nearest player HQ
		const x = structures[i].x;
		const y = structures[i].y;
		const distance = base_heatmap[y*mapWidth + x]; // from base.js

		// Safety check. (Should be impossible because structures are only placed on tiles of non-null distance)
		if (distance === null)
		{
			continue;
		}

		// Select this structure if it's closest
		if (selected.distance === null || distance < selected.distance)
		{
			selected.structure = structures[i];
			selected.distance = distance;
		}
	}

	// Safety check. (Should be impossible)
	if (selected.structure === null || selected.distance === null)
	{
		return;
	}

	// Now that we have the selected structure, try to spawn a unit next to it
	spawn_unit(selected.structure.x, selected.structure.y, selected.distance, base_maxDist);
}

/**
 * @param {number} structureX - structure tile position X
 * @param {number} structureY - structure tile position Y
 * @param {number} structureDistance - distance of the structure to nearest player HQ
 * @param {number} maximumDistance - distance of the enemy HQ to nearest player HQ
 * @returns {boolean} success
 */
function spawn_unit(structureX, structureY, structureDistance, maximumDistance)
{
	const deltas = [
		[  0, -1 ], // Up
		[  1,  0 ], // Left
		[ -1,  0 ], // Right
		[  0, -1 ], // Down
	];
	for (const [dx, dy] of deltas)
	{
		const x = structureX + dx;
		const y = structureY + dy;
		const t = terrainType(x, y);
		if (!getObject(x, y) && t !== TER_CLIFFFACE && t !== TER_WATER)
		{
			const a = structureDistance / maximumDistance;
			const b = Math.floor(a * TEMPLATES.length);
			const i = Math.max(0, Math.min(TEMPLATES.length - 1, b) - syncRandom(5));
			const template = TEMPLATES[i];
			if (template)
			{
				hackNetOff();
				const droid = addDroid(ENEMY, x, y, template.name, template.body, template.propulsion, "", "", ...template.turrets);
				hackNetOn();
				orderDroidLoc(droid, DORDER_PATROL, x, y);
				return true;
			}
		}
	}
	return false;
}

function spawn_shuffle(array)
{
	for (let i = array.length - 1; i > 0; i--)
	{
		const j = syncRandom(i + 1);
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
