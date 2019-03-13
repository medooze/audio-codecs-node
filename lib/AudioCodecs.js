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
 * @returns {AudioEnocder} The new created encoder
 */
AudioCodecs.createAudioEncoder = function(codec)
{
	return new AudioEncoder(codec);
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

module.exports = AudioCodecs;
