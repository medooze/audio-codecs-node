const tap		= require("tap");
const AudioCodecs	= require("../index");

function sleep(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

AudioCodecs.enableLog(true);
AudioCodecs.enableDebug(true);
AudioCodecs.enableUltraDebug(true);


tap.test("AudioCodecs",async function(suite){
	
	await suite.test("encoder+decoder", async function(test){
		try {
			//Create encoder and decoder
			const audioEncoder	= AudioCodecs.createAudioEncoder("opus", {properties: { opus: { 
					"application.audio"	: true,
					"inbandfec"		: true
			}}});
			const audioDecoder	= AudioCodecs.createAudioDecoder();
			//Attach
			audioEncoder.attachTo(audioDecoder);
			//Create audio track
			const audioTrack = audioEncoder.createIncomingStreamTrack(); 
			//Attach decoder to encoder audio track
			audioDecoder.attachTo(audioTrack);

			await sleep(100)

			//Detach
			audioEncoder.detach();
			audioDecoder.detach();
			
			//Stop all
			audioEncoder.stop();
			audioDecoder.stop();
			//Test for ok
			test.end();
		} catch (error) {
			console.error(error);
			//Should not get here
			test.fail();
		}
	});
	suite.end();
})

