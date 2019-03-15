const Native		= require("./Native");
const Emitter		= require("./Emitter");

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
	
	setAACConfig(config)
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
			this.decoder.SetIncoming(null);
			//remove listener
			this.attached.off("stopped",this.ontrackstopped);
			
		}
		//Not attached
		this.attached = null;
	}
	
	attachTo(track)
	{
		//Detach first
		this.detach();
		
		//Check if valid object
		if (track)
		{
			//Get first encoding
			const encoding = track.encodings.values().next();
			//Set it
			this.decoder.SetIncoming(encoding.value.source);
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
		
		/**
		* AudioDecoder stopped event
		*
		* @name stopped
		* @memberof AudioDecoder
		* @kind event
		* @argument {AudioDecoder} decoder
		*/
		this.emitter.emit("stopped", this);
		
		//Stop emitter
		super.stop();
		
		//Remove native refs
		this.decoder = null;
	}
};

module.exports = AudioDecoder;
