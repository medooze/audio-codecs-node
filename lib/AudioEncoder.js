const Native		= require("./Native");
const Emitter		= require("medooze-event-emitter");
const Properties	= require("./Properties");
const LFSR		= require('lfsr');
const AudioEncoderIncomingStreamTrack = require("./AudioEncoderIncomingStreamTrack");
const SharedPointer	= require("./SharedPointer")

/**
 * @typedef {Object} AudioEncoderEvents
 * @property {(self: AudioEncoder) => void} stopped
 */

/** @extends {Emitter<AudioEncoderEvents>} */
class AudioEncoder extends Emitter
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor(
		/** @type {string} */ codec,
		/** @type {import("./AudioCodecs").CodecParams} */ params)
	{
		//Init emitter
		super();
		//Create code
		const encoder = new Native.AudioEncoderFacade();
		//Get encoding properties
		const properties = Properties.fromObject(params.properties);
		//Set codec
		if (!encoder.SetAudioCodec(codec,properties))
			//Error
			throw new Error("Audio codec not supported");
		//Storea codec
		this.encoder = encoder;
		//And audio pipe
		this.pipe = new Native.AudioPipe(48000);
		//Set it in encoder
		this.encoder.Init(this.pipe);
		//Start encoding
		this.encoder.StartEncoding();
		
		//Create new sequence generator
		this.lfsr = new LFSR();
		
		//Track maps
		this.tracks = new Map();
	}
	
	createIncomingStreamTrack()
	{
		//Create the source
		const bridge = SharedPointer(new Native.MediaFrameListenerBridgeShared(this.encoder.GetTimeService(), this.lfsr.seq(31)));
		//Add track
		const track = new AudioEncoderIncomingStreamTrack(bridge); 
		//Add it to the encoder
		this.encoder.AddListener(bridge.toMediaFrameListener());
		//Add listener
		track.once("stopped",(track)=>{
			//Remove source from listener
			this.encoder.RemoveListener(bridge.toMediaFrameListener());
			//Stop bridge
			bridge.Stop();
			//Remove from map
			this.tracks.delete(track.getId());
		});
		//Add to tracks
		this.tracks.set(track.getId(),track);
		//Done
		return track;
	}
	detach()
	{
		//If attached to a decoder
		if (this.attached)
			//Remove our pipe
			this.attached.decoder.RemoveAudioOutput(this.pipe);
		//Not attached
		this.attached = null;
	}
	
	attachTo(/** @type {import("./AudioDecoder")} */ decoder)
	{
		//Detach first
		this.detach();
		
		//Check if valid object
		if (decoder && decoder.decoder)
		{
			//Set it
			decoder.decoder.AddAudioOuput(this.pipe);
			//Keep attached object
			this.attached = decoder;
		}
	}
	
	
	stop()
	{
		//Don't call it twice
		if (this.stopped) return;

		//Stopped
		this.stopped = true;
		
		//Detach first
		this.detach();

		//Stop tracks
		for (const [trackId,track] of this.tracks)
			//Stop it
			track.stop();

		//Stop encoding
		this.encoder.StopEncoding();

		/**
		* AudioEncoder stopped event
		*
		* @name stopped
		* @memberof AudioEncoder
		* @kind event
		* @argument {AudioEncoder} encoder
		*/
		this.emit("stopped", this);
		
		//Stop emitter
		super.stop();
		
		//Stop pipe
		this.encoder.End();
			
		//Remove brdige reference, so destructor is called on GC
		//@ts-expect-error
		this.pipe = null;
		//@ts-expect-error
		this.encoder = null;
	}
};

module.exports = AudioEncoder;
