const { v4: uuidV4 }	= require("uuid");
const Native		= require("./Native");
const Emitter		= require("medooze-event-emitter");
const SharedPointer	= require("./SharedPointer");

/**
 * @typedef {Object} LayerStats Information about each spatial/temporal layer (if present)
 * @property {number} simulcastIdx
 * @property {number} spatialLayerId Spatial layer id
 * @property {number} temporalLayerId Temporatl layer id
 * @property {number} [totalBytes] total rtp received bytes for this layer
 * @property {number} [numPackets] number of rtp packets received for this layer
 * @property {number} bitrate average bitrate received during last second for this layer
 */

/**
 * @typedef {Object} MediaStats stats for each media stream
 * @property {number} [lostPackets] total lost packkets
 * @property {number} [lostPacketsDelta] total lost/out of order packets during last second
 * @property {number} [dropPackets] droppted packets by media server
 * @property {number} numFrames number of rtp packets received
 * @property {number} numFramesDelta number of rtp packets received during last seconds
 * @property {number} numPackets number of rtp packets received
 * @property {number} numPacketsDelta number of rtp packets received during last seconds
 * @property {number} [numRTCPPackets] number of rtcp packsets received
 * @property {number} totalBytes total rtp received bytes
 * @property {number} [totalRTCPBytes] total rtp received bytes
 * @property {number} [totalPLIs] total PLIs sent
 * @property {number} [totalNACKs] total NACk packets sent
 * @property {number} bitrate average bitrate received during last second in bps
 * @property {number} [skew] difference between NTP timestamp and RTP timestamps at sender (from RTCP SR)
 * @property {number} [drift] ratio between RTP timestamps and the NTP timestamp and  at sender (from RTCP SR)
 * @property {number} [clockRate] RTP clockrate
 * @property {LayerStats[]} layers Information about each spatial/temporal layer (if present)
 */

/**
 * @typedef PacketWaitTime packet waiting times in rtp buffer before delivering them
 * @property {number} min
 * @property {number} max
 * @property {number} avg
 */

/**
 * @typedef {Object} EncodingStats stats for each encoding (media, rtx sources (if used))
 *
 * @property {number} timestamp When this stats was generated (in order to save workload, stats are cached for 200ms)
 * @property {PacketWaitTime} waitTime 
 * @property {MediaStats} media Stats for the media stream
 * @property {{}} rtx Stats for the rtx retransmission stream
 * 
 * @property {number} [rtt] Round Trip Time in ms
 * @property {number} bitrate Bitrate for media stream only in bps
 * @property {number} total Accumulated bitrate for rtx, media streams in bps
 * @property {number} [remb] Estimated avialable bitrate for receving (only avaailable if not using tranport wide cc)
 * @property {number} simulcastIdx Simulcast layer index based on bitrate received (-1 if it is inactive).
 * @property {number} [lostPackets] Accumulated lost packets for rtx, media strems
 * @property {number} [lostPacketsRatio] Lost packets ratio
 *
 * Info accumulated for `rtx`, `media` streams:
 *
 * @property {number} numFrames
 * @property {number} numFramesDelta
 * @property {number} numPackets
 * @property {number} numPacketsDelta
 */

/** @typedef {{ [encodingId: string]: EncodingStats }} TrackStats providing the info for each source */

/**
 * @typedef {Object} Encoding
 * @property {string} id
 * @property {SharedPointer.Proxy<Native.MediaFrameListenerBridgeShared>} bridge
 * @property {SharedPointer.Proxy<Native.MediaFrameListenerBridgeShared>} source
 * @property {Native.RTPReceiverShared} receiver
 * @property {SharedPointer.Proxy<Native.MediaFrameListenerBridgeShared>} depacketizer
 */

/**
 * @typedef {Object} ActiveEncodingInfo
 * @property {string} id
 * @property {number} simulcastIdx
 * @property {number} bitrate
 * @property {LayerStats[]} layers
 */

/**
 * @typedef {Object} ActiveLayersInfo Active layers object containing an array of active and inactive encodings and an array of all available layer info
 * @property {ActiveEncodingInfo[]} active
 * @property {Array<LayerStats & { encodingId: string }>} layers
 * @property {{ id: string }[]} inactive
 */

/**
 * @typedef {Object} AudioEncoderIncomingStreamTrackEvents
 * @property {(self: AudioEncoderIncomingStreamTrack) => void} attached
 * @property {(self: AudioEncoderIncomingStreamTrack) => void} detached
 * @property {(self: AudioEncoderIncomingStreamTrack) => void} stopped
 * @property {(muted: boolean) => void} muted
 */

/** @extends {Emitter<AudioEncoderIncomingStreamTrackEvents>} */
class AudioEncoderIncomingStreamTrack extends Emitter
{
	constructor(/** @type {SharedPointer.Proxy<Native.MediaFrameListenerBridgeShared>} */ bridge)
	{
		super();

		//Create new id
		this.id = uuidV4();
		//Store track info
		this.media	= "audio";
		this.bridge	= bridge;
		//Not muted
		this.muted = false;
		//Attach counter
		this.counter	= 0;
	
		//Create source map
		this.encodings = /** @type {Map<string, Encoding>} */ (new Map());
		
		//Push new encoding
		this.encodings.set("", {
			id		: "",
			bridge		: bridge,
			source		: bridge,
			receiver	: bridge.toRTPReceiver(),
			depacketizer	: bridge
		});

		//Set global depacketizer
		this.depacketizer = this.encodings.values().next().value.depacketizer;
	}
	
	/**
	 * Get stats for all encodings
	 * @returns {TrackStats}
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
	 * @returns {ActiveLayersInfo}
	 */
	getActiveLayers()
	{
		const active	= /** @type {ActiveLayersInfo['active']} */ ([]);
		const inactive  = /** @type {ActiveLayersInfo['inactive']} */ ([]);
		const all	= /** @type {ActiveLayersInfo['layers']} */ ([]);
		
		//Return ordered info
		return {
			active		: active.sort((a, b) => b.bitrate-a.bitrate),
			inactive	: inactive, 
			layers		: all.sort((a, b) => b.bitrate-a.bitrate)
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
	 * Get all track encodings
	 * Internal use, you'd beter know what you are doing before calling this method
	 **/
	getEncodings()
	{
		return Array.from(this.encodings.values());
	}

	/**
	 * Get encoding by id
	 * Internal use, you'd beter know what you are doing before calling this method
	 * @param {String} encodingId	- encoding Id,
	 **/
	getEncoding(encodingId)
	{
		return this.encodings.get(encodingId);
	}
	
	/**
	 * Get default encoding
	 * Internal use, you'd beter know what you are doing before calling this method
	 **/
	getDefaultEncoding()
	{
		return this.encodings.values().next().value;
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
			this.emit("attached",this);
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
			this.emit("detached",this);
	}
	
	/**
	 * Check if the track is muted or not
	 * @returns {boolean} muted
	 */
	isMuted()
	{
		return this.muted;
	}

	/**
	 * Mute/Unmute track
	 * @param {boolean} muting - if we want to mute or unmute
	 */
	mute(muting) 
	{
		//For each source
		for (let encoding of this.encodings.values())
		{
			//Mute encoding
			encoding.source.Mute(muting);
		}
		
		//If we are different
		if (this.muted!==muting)
		{
			//Store it
			this.muted = muting;
			this.emit("muted",this.muted);
		}
	}

	/**
	 * Removes the track from the incoming stream and also detaches any attached outgoing track or recorder
	 */
	stop()
	{
		//Don't call it twice
		if (this.stopped) return;

		//Stopped
		this.stopped = true;
		this.emit("stopped",this);

		//stop event emitter
		super.stop();
		
		//remove encodings
		this.encodings.clear();
		this.depacketizer = null;
		
		//Remove transport reference, so destructor is called on GC
		//@ts-expect-error
		this.bridge = null;
		//@ts-expect-error
		this.receiver = null;
	}

}

module.exports = AudioEncoderIncomingStreamTrack;
