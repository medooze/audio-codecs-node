const Native		= require("./Native");
const AudioEncoder	= require("./AudioEncoder.js");
const AudioDecoder	= require("./AudioDecoder.js");

//Sequence for init the other LFSR instances
const LFSR	  = require('lfsr');
const defaultSeed = new LFSR(8, 92914);

//Replace default seeed
LFSR.prototype._defaultSeed = function(n) {
	if (!n) throw new Error('n is required');
	return defaultSeed.seq(n);
};

/** @namespace */
const AudioCodecs = {};

//Initialize library
Native.AudioCodecs.Initialize();

/**
 * Create a new AudioEnocder
 * @memberof AudioCodecs
 * @param {String} codec Codec name
 * @param {Object} codec Codec params
 * @param {Object} params.properties	Codec specific properties 
 * @returns {AudioEnocder} The new created encoder
 */
AudioCodecs.createAudioEncoder = function(codec, params)
{
	return new AudioEncoder(codec, params);
};


/**
 * Create a new AudioDecoder
 * @memberof AudioCodecs
 * @returns {AudioDecoder} The new created decoder
 */
AudioCodecs.createAudioDecoder = function()
{
	return new AudioDecoder();
};


/**
 * Enable or disable log level traces
 * @memberof AudioCodecs
 * @param {Boolean} flag
 */
AudioCodecs.enableLog= function(flag)
{
	//Set flag
	Native.AudioCodecs.EnableLog(flag);
};


/**
 * Enable or disable debug level traces
 * @memberof AudioCodecs
 * @param {Boolean} flag
 */
AudioCodecs.enableDebug = function(flag)
{
	//Set flag
	Native.AudioCodecs.EnableDebug(flag);
};

/**
 * Enable or disable ultra debug level traces
 * @memberof AudioCodecs
 * @param {Boolean} flag
 */
AudioCodecs.enableUltraDebug = function(flag)
{
	//Set flag
	Native.AudioCodecs.EnableUltraDebug(flag);
};

module.exports = AudioCodecs;
