const uuidV4		= require("uuid/v4");
const Native		= require("./Native");
const EventEmitter	= require("events").EventEmitter;

class AudioEncoderIncomingStreamTrack
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor(source)
	{
		//Create new id
		this.id = uuidV4();
		//Store track info
		this.media	= "audio";
		this.receiver	= null;
		//Attach counter
		this.counter	= 0;
	
		//Create source map
		this.encodings = new Map();
		
		//Push new encoding
		this.encodings.set("", {
			source		: source,
			depacketizer	: new Native.RTPIncomingMediaStreamDepacketizer(source)
		});

		//Set global depacketizer
		this.depacketizer = this.encodings.values().next().value.depacketizer;
		
		//Create event emitter
		this.emitter = new EventEmitter();
	}
	
	/**
	 * Get stats for all encodings 
	 * 
	 *  
	 * @returns {Map<String,Object>} Map with stats by encodingId
	 */
	getStats()
	{
		//Check if we have cachedd stats
		if (!this.stats )
			//Create new stats
			this.stats = {};
		
		//TODO
		
		//Return a clone of cached stats;
		return Object.assign({},this.stats);
	}
	
	/**
	 * Get active encodings and layers ordered by bitrate
	 * @returns {Object} Active layers object containing an array of active and inactive encodings and an array of all available layer info
	 */
	getActiveLayers()
	{
		const active	= [];
		const inactive  = [];
		const all	= [];
		
		//Return ordered info
		return {
			active		: active.sort((a, b) => a.bitrate<b.bitrate),
			inactive	: inactive, 
			layers		: all.sort((a, b) => a.bitrate<b.bitrate)
		};
	}
	/**
	* Get track id as signaled on the SDP
	*/
	getId()
	{
		return this.id;
	}
	
	/**
	* Get track media type
	* @returns {String} "audio"|"video" 
	*/
	getMedia()
	{
		return this.media;
	}
	
	/**
	 * Add event listener
	 * @param {String} event	- Event name 
	 * @param {function} listener	- Event listener
	 * @returns {IncomingStreamTrack} 
	 */
	on() 
	{
		//Delegate event listeners to event emitter
		this.emitter.on.apply(this.emitter, arguments);
		//Return object so it can be chained
		return this;
	}
	
	/**
	 * Add event listener once
	 * @param {String} event	- Event name 
	 * @param {function} listener	- Event listener
	 * @returns {IncomingStream} 
	 */
	once() 
	{
		//Delegate event listeners to event emitter
		this.emitter.once.apply(this.emitter, arguments);
		//Return object so it can be chained
		return this;
	}
	
	/**
	 * Remove event listener
	 * @param {String} event	- Event name 
	 * @param {function} listener	- Event listener
	 * @returns {IncomingStreamTrack} 
	 */
	off() 
	{
		//Delegate event listeners to event emitter
		this.emitter.removeListener.apply(this.emitter, arguments);
		//Return object so it can be chained
		return this;
	}
	
	/**
	 * Signal that this track has been attached.
	 * Internal use, you'd beter know what you are doing before calling this method
	 */
	attached() 
	{
		//Increase attach counter
		this.counter++;
		
		//If it is the first
		if (this.counter===1)
			/**
			* IncomingStreamTrack stopped event
			*
			* @name attached
			* @memberof IncomingStreamTrack
			* @kind event
			* @argument {IncomingStreamTrack} incomingStreamTrack
			*/
			this.emitter.emit("attached",this);
	}
	
	/** 
	 * Request an intra refres on all sources
	 */
	refresh()
	{
	}
	
	/**
	 * Signal that this track has been detached.
	 * Internal use, you'd beter know what you are doing before calling this method
	 */
	detached()
	{
		//Decrease attach counter
		this.counter--;
		
		//If it is the last
		if (this.counter===0)
			/**
			* IncomingStreamTrack stopped event
			*
			* @name detached
			* @memberof IncomingStreamTrack
			* @kind event
			* @argument {IncomingStreamTrack} incomingStreamTrack
			*/
			this.emitter.emit("detached",this);
	}
	
	/**
	 * Removes the track from the incoming stream and also detaches any attached outgoing track or recorder
	 */
	stop()
	{
		//Don't call it twice
		if (!this.receiver) return;

		//for each encoding
		for (let encoding of this.encodings.values())
			//Stop the depacketizer
			encoding.depacketizer.Stop();

		//Stop global depacketizer
		if (this.depacketizer) this.depacketizer.Stop();

		/**
		* IncomingStreamTrack stopped event
		*
		* @name stopped
		* @memberof IncomingStreamTrack
		* @kind event
		* @argument {IncomingStreamTrack} incomingStreamTrack
		*/
		this.emitter.emit("stopped",this);
		
		//remove encodings
		this.encodings.clear();
		this.depacketizer = null;
		
		//Remove transport reference, so destructor is called on GC
		this.receiver = null;
	}

}

module.exports = AudioEncoderIncomingStreamTrack;
