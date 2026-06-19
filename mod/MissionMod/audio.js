namespace("audio_");

var audio_lastHitTime = 0;

function audio_eventAttacked(victimObj, attackerObj)
{
	if ((victimObj.player === selectedPlayer) && (attackerObj.player !== selectedPlayer) && (gameTime > (audio_lastHitTime + 5000)))
	{
		audio_lastHitTime = gameTime;
		if (victimObj.type === STRUCTURE)
		{
			playSound("pcv337.ogg", victimObj.x, victimObj.y, victimObj.z);	// show position if still alive
		}
		else
		{
			playSound("pcv399.ogg", victimObj.x, victimObj.y, victimObj.z);
		}
	}
}

function audio_eventStartLevel()
{
	queue("audio_1", 4000);
}

function audio_1()
{
	playSound("pcv455.ogg");
	playSound("t-aprolz.ogg");
	playSound("pcv448.ogg");
	queue("audio_2", 4000);
}

function audio_2()
{
	playSound("t-arboys.ogg");
	queue("audio_3", 4000);
}

function audio_3()
{
	playSound("t-dustof.ogg");
	queue("audio_4", 4000);
}

function audio_4()
{
	playSound("com023.ogg");
	playSound("t-gogogo.ogg");
	queue("audio_5", 4000);
}

function audio_5()
{
	playSound("pcv373.ogg");
	playSound("pcv379.ogg");
	queue("audio_6", 4000);
}

function audio_6()
{
	playSound("t-grnli5.ogg");
	queue("audio_7", 4000);
}

function audio_7()
{
	playSound("pcv397.ogg");
	playSound("pcv413.ogg");
	queue("audio_8", 4000);
}

function audio_8()
{
	playSound("pcv375.ogg");
	playSound("com041.ogg");
}
