namespace("cutscene_");

function cutscene_eventGameInit()
{
	cutscene_start();
	cameraZoom(5000, 9999);

	// Wait for loading screens to end
	queue("cutscene_1");
}

function cutscene_1()
{
	playSound("pcv456.ogg");
	queue("cutscene_zoomIn");
	queue("cutscene_2", 2 * 1000);
	queue("cutscene_3", 4 * 1000);
	queue("cutscene_sendMessage", 4 * 1000);
	queue("cutscene_audio1", CUTSCENE_DURATION);
	queue("cutscene_zoomOut", CUTSCENE_DURATION);
}

function cutscene_2()
{
	playSound("pcv448.ogg");
}

function cutscene_3()
{
	playSound("pcv656.ogg");
}

function cutscene_start()
{
	const { x, y } = startPositions[ENEMY];
	centreView(x, y + 3);

	if (gameTime < CUTSCENE_DURATION)
	{
		queue("cutscene_start");
	}
}

function cutscene_zoomIn()
{
	cameraZoom(100, 1000);
}

function cutscene_zoomOut()
{
	cameraZoom(2000, 9999);
}

function cutscene_sendMessage()
{
	console(" ");
	console(" ");
	console(" ");
	console(cutscene_message);
	console(" ");

	if (gameTime < 90 * 1000)
	{
		queue("cutscene_sendMessage", 5 * 1000);
	}
}

var cutscene_message = (() =>
{
	switch (playerData[ENEMY].difficulty)
	{
		case INSANE: return _("Destroy the nukes before the timer reaches 0");
		case HARD  : return _("Destroy the nukes before the timer reaches 0");
		case MEDIUM: return _("Destroy the nukes before the timer reaches 0");
		case EASY  : return _("Destroy the nukes!");
		default    : return _("Destroy the nukes!");
	}
})();

function cutscene_audio1()
{
	playSound("pcv455.ogg");
	playSound("t-aprolz.ogg");
	queue("cutscene_audio2", 4000);
}

function cutscene_audio2()
{
	playSound("t-arboys.ogg");
	queue("cutscene_audio3", 4000);
}

function cutscene_audio3()
{
	playSound("t-dustof.ogg");
	queue("cutscene_audio4", 4000);
}

function cutscene_audio4()
{
	playSound("com023.ogg");
	playSound("t-gogogo.ogg");
	queue("cutscene_audio5", 4000);
}

function cutscene_audio5()
{
	playSound("pcv373.ogg");
	playSound("pcv379.ogg");
	queue("cutscene_audio6", 4000);
}

function cutscene_audio6()
{
	playSound("t-grnli5.ogg");
	queue("cutscene_audio7", 4000);
}

function cutscene_audio7()
{
	playSound("pcv397.ogg");
	playSound("pcv413.ogg");
	queue("cutscene_audio8", 4000);
}

function cutscene_audio8()
{
	playSound("pcv375.ogg");
	playSound("com041.ogg");
}
