namespace("power_");

function power_eventStartLevel()
{
	for (let player = 0; player < maxPlayers; player++)
	{
		setPower(1300, player);

		if (powerType === 0)
		{
			setPowerModifier(75, player);
		}
		else if (powerType === 1)
		{
			setPowerModifier(100, player);
		}
		else if (powerType === 2)
		{
			setPowerModifier(125, player);
		}
	}
}
