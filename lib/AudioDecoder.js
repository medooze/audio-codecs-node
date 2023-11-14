const Native		= require("./Native");
const Emitter		= require("medooze-event-emitter");

/**
 * @typedef {Object} AudioDecoderEvents
 * @property {(self: AudioDecoder) => void} stopped
 */

/** @extends {Emitter<AudioDecoderEvents>} */
class AudioDecoder extends Emitter
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor()
	{
		//Init emitter
		super();
		
		//Create decoder
		this.decoder = new Native.AudioDecoderFacade();
		
		//Start decoder
		this.decoder.Start();
		
		//Track listener
		this.ontrackstopped = ()=>{
			//Dettach
			this.detach();
		};
	}
	
	setAACConfig(/** @type {string} */ config)
	{
		//Set it in encoder
		this.decoder.SetAACConfig(config);
	}
	
	detach()
	{
		//If attached to a decoder
		if (this.attached)
		{
			//Detach native decoder
			this.decoder.SetIncoming(/** @type {any} */ (null));
			//remove listener
			this.attached.off("stopped",this.ontrackstopped);
			
		}
		//Not attached
		this.attached = null;
	}
	
	attachTo(/** @type {import("./AudioEncoderIncomingStreamTrack") | undefined} */ track)
	{
		//Detach first
		this.detach();
		
		//Check if valid object
		if (track)
		{
			//Get first encoding
			const encoding = track.encodings.values().next();
			//Set it
			this.decoder.SetIncoming(encoding.value.source.toRTPIncomingMediaStream());
			//Listen for events
			track.once("stopped",this.ontrackstopped);
			//Keep attached object
			this.attached = track;
		}
	}
	
	stop()
	{
		//Don't call it twice
		if (!this.decoder) return;
		
		//Detach first
		this.detach();
		
		//Stop decoder
		this.decoder.Stop();
		
		this.emit("stopped", this);
		
		//Stop emitter
		super.stop();
		
		//Remove native refs
		//@ts-expect-error
		this.decoder = null;
	}
};

module.exports = AudioDecoder;
