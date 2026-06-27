namespace("spawn_");

var spawn_deltas = [
	[  0, -1 ],
	[  1,  0 ],
	[ -1,  0 ],
	[  0, -1 ],
];

function spawn_eventDestroyed(object)
{
	if (object.type != STRUCTURE || object.player != ENEMY)
	{
		return;
	}

	for (const structure of spawn_shuffle(enumStruct(ENEMY, DEFENSE)))
	{
		for (const [dx, dy] of spawn_deltas)
		{
			const x = structure.x + dx;
			const y = structure.y + dy;
			const t = terrainType(x, y);
			if (!getObject(x, y) && t !== TER_CLIFFFACE && t !== TER_WATER)
			{
				const template = TEMPLATES[syncRandom(Math.min(TEMPLATES.length, Math.floor(TIME / 60)))];
				if (template)
				{
					hackNetOff();
					const droid = addDroid(ENEMY, x, y, template.name, template.body, template.propulsion, "", "", ...template.turrets);
					hackNetOn();
					orderDroidLoc(droid, DORDER_PATROL, x, y);
					return;
				}
			}
		}
	}
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
