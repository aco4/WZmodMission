namespace("timer_");

function timer_eventGameInit()
{
	switch (playerData[ENEMY].difficulty)
	{
		case INSANE: return setMissionTime(30 * 60);
		case HARD  : return setMissionTime(60 * 60);
		case MEDIUM: return setMissionTime(90 * 60);
		case EASY  : return;
		default    : return;
	}
}
