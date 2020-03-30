{
	'variables':
	{
		'external_libmediaserver%'		: '<!(echo $LIBMEDIASERVER)',
		'external_libmediaserver_include_dirs%'	: '<!(echo $LIBMEDIASERVER_INCLUDE)',
	},
	"targets": 
	[
		{
			"target_name": "medooze-audio-codecs",
			"cflags": 
			[
				"-march=native",
				"-fexceptions",
				"-O3",
				"-g",
				"-Wno-unused-function -Wno-comment",
				"-DSPX_RESAMPLE_EXPORT= -DRANDOM_PREFIX=mcu -DOUTSIDE_SPEEX -DFLOATING_POINT",
				#"-O0",
				#"-fsanitize=address"
			],
			"cflags_cc": 
			[
				"-fexceptions",
				"-std=c++17",
				"-O3",
				"-g",
				"-Wno-unused-function",
				"-DSPX_RESAMPLE_EXPORT= -DRANDOM_PREFIX=mcu -DOUTSIDE_SPEEX -DFLOATING_POINT",
				"-faligned-new",
				#"-O0",
				#"-fsanitize=address,leak"
			],
			"include_dirs" : 
			[
				'/usr/include/nodejs/',
				"<!(node -e \"require('nan')\")"
			],
			"ldflags" : [" -lpthread -lresolv"],
			"link_settings": 
			{
        			'libraries': ["-lpthread -lpthread -lresolv -lavcodec -lspeex -lopus"]
      			},
			"sources": 
			[ 
				"src/audio-codecs_wrap.cxx",
			],
			"conditions":
			[
				[
					"external_libmediaserver == ''", 
					{
						"include_dirs" :
						[
							'media-server/include',
							'media-server/src',
							'media-server/ext/crc32c/include',
							'media-server/ext/libdatachannels/src',
							'media-server/ext/libdatachannels/src/internal',
							"media-server/src/g711",
							"media-server/src/g722",
							"media-server/src/gsm",
							"media-server/src/aac",
							"media-server/src/opus",
							"media-server/src/speex",
							"media-server/src/nelly",
						],
						"sources": 
						[
							"media-server/src/audioencoder.cpp",
							"media-server/src/audiodecoder.cpp",
							"media-server/src/AudioCodecFactory.cpp",
							"media-server/src/AudioPipe.cpp",
							"media-server/src/audiotransrater.cpp",
							"media-server/src/EventLoop.cpp",
							"media-server/src/MediaFrameListenerBridge.cpp",
							"media-server/src/rtp/RTPPacket.cpp",
							"media-server/src/rtp/RTPPayload.cpp",
							"media-server/src/rtp/RTPHeader.cpp",
							"media-server/src/rtp/RTPHeaderExtension.cpp",
							"media-server/src/rtp/RTPMap.cpp",
							"media-server/src/g711/pcmucodec.cpp",
							"media-server/src/g711/pcmacodec.cpp",
							"media-server/src/g711/g711.cpp",
							"media-server/src/g722/g722_encode.c",
							"media-server/src/g722/g722_decode.c",
							"media-server/src/g722/g722codec.cpp",
							"media-server/src/gsm/gsmcodec.cpp",
							"media-server/src/aac/aacencoder.cpp",
							"media-server/src/aac/aacdecoder.cpp",
							"media-server/src/opus/opusdecoder.cpp",
							"media-server/src/opus/opusencoder.cpp",
							"media-server/src/speex/speexcodec.cpp",
							"media-server/src/speex/resample.c",
							"media-server/src/nelly/NellyCodec.cpp",
							"media-server/src/opus/opusdepacketizer.cpp",
							"media-server/src/rtp/RTPDepacketizer.cpp",
						],
  					        "conditions" : [
								['OS=="mac"', {
									"xcode_settings": {
										"CLANG_CXX_LIBRARY": "libc++",
										"CLANG_CXX_LANGUAGE_STANDARD": "c++17",
										"OTHER_CFLAGS": [ "-Wno-aligned-allocation-unavailable","-march=native"]
									},
								}]
						]
					},
					{
						"libraries"	: [ "<(external_libmediaserver)" ],
						"include_dirs"	: [ "<@(external_libmediaserver_include_dirs)" ],
						'conditions':
						[
							['OS=="linux"', {
								"ldflags" : [" -Wl,-Bsymbolic "],
							}],
							['OS=="mac"', {
									"xcode_settings": {
										"CLANG_CXX_LIBRARY": "libc++",
										"CLANG_CXX_LANGUAGE_STANDARD": "c++17",
										"OTHER_CFLAGS": [ "-Wno-aligned-allocation-unavailable","-march=native"]
									},
							}],
						]
					}
				]
			]
		}
	]
}

