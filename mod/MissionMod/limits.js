namespace("limits_")

function limits_eventStartLevel()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			for (const [name, limit] of Object.entries(limits_enemy()))
			{
				setStructureLimits(name, limit, player);
			}
			continue;
		}

		for (const [name, limit] of Object.entries(limits_structure()))
		{
			setStructureLimits(name, limit, player);
		}
		for (const [type, limit] of Object.entries(limits_droid()))
		{
			setDroidLimit(player, limit, type);
		}
	}
}

function limits_enemy()
{
	return {
		"A0CommandCentre":    1,
		"A0ComDroidControl":  100,
		"A0Sat-linkCentre":   100,
		"A0LasSatCommand":    100,

		"A0LightFactory":     500,
		"A0CyborgFactory":    500,
		"A0VTolFactory1":     500,
		"A0ResearchFacility": 500,
		"A0RepairCentre3":    500,

		"A0PowerGenerator":   1000,

		"A0VtolPad":          5000,
	};
}

function limits_structure()
{
	return {
		"A0CommandCentre":    1,
		"A0ComDroidControl":  1,
		"A0Sat-linkCentre":   1,
		"A0LasSatCommand":    1,

		"A0LightFactory":     5,
		"A0CyborgFactory":    5,
		"A0VTolFactory1":     5,
		"A0ResearchFacility": 5,
		"A0RepairCentre3":    5,

		"A0PowerGenerator":   10,

		"A0VtolPad":          50,
	};
}

function limits_droid()
{
	return {
		[DROID_ANY]: 150,
		[DROID_COMMAND]: 10,
		[DROID_CONSTRUCT]: 15,
	};
}
