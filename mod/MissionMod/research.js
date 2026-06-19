namespace("research_");

var research_list = Object.entries(MRT);

function research_eventStartLevel()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		completeResearch("R-Sys-Spade1Mk1", player);
		completeResearch("R-Vehicle-Body01", player);
		completeResearch("R-Vehicle-Prop-Wheels", player);
		enableResearch("R-Sys-Sensor-Turret01", player);
		enableResearch("R-Wpn-MG1Mk1", player);
		enableResearch("R-Sys-Engineering01", player);
	}
}

function research_eventResearched(research, structure, player)
{
	if (player === ENEMY)
	{
		return;
	}

	const time = MRT[research.id];
	if (time && time > TIME)
	{
		research_completeOnTime(time, ENEMY);
		TIME = time;
	}
}

function research_enable()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		if (player === ENEMY)
		{
			continue;
		}
		enableResearch(researchName, player);
	}
}

function research_completeOnTime(time, player)
{
	hackNetOff();
	for (const [research, researchTime] of research_list)
	{
		if (researchTime <= time)
		{
			completeResearch(research, player);
		}
	}
	hackNetOn();
}
