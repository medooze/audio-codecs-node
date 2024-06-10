{
	'variables':
	{
		'external_libmediaserver%'		: '<!(echo $LIBMEDIASERVER)',
		'external_libmediaserver_include_dirs%'	: '<!(echo $LIBMEDIASERVER_INCLUDE)',
		'medooze_media_server_src' : "<!(node -e \"require('medooze-media-server-src')\")",
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
							'<(medooze_media_server_src)/include',
							'<(medooze_media_server_src)/src',
							'<(medooze_media_server_src)/ext/crc32c/include',
							'<(medooze_media_server_src)/ext/libdatachannels/src',
							'<(medooze_media_server_src)/ext/libdatachannels/src/internal',
							"<(medooze_media_server_src)/src/g711",
							"<(medooze_media_server_src)/src/g722",
							"<(medooze_media_server_src)/src/gsm",
							"<(medooze_media_server_src)/src/aac",
							"<(medooze_media_server_src)/src/opus",
							"<(medooze_media_server_src)/src/speex",
							"<(medooze_media_server_src)/src/mp3",
						],
						"sources": 
						[
							"<(medooze_media_server_src)/src/audioencoder.cpp",
							"<(medooze_media_server_src)/src/audiodecoder.cpp",
							"<(medooze_media_server_src)/src/AudioCodecFactory.cpp",
							"<(medooze_media_server_src)/src/AudioPipe.cpp",
							"<(medooze_media_server_src)/src/audiotransrater.cpp",
							"<(medooze_media_server_src)/src/EventLoop.cpp",
							"<(medooze_media_server_src)/src/log.cpp",
							"<(medooze_media_server_src)/src/MediaFrameListenerBridge.cpp",
							"<(medooze_media_server_src)/src/rtp/DependencyDescriptor.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPPacket.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPPayload.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPHeader.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPHeaderExtension.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPMap.cpp",
							"<(medooze_media_server_src)/src/g711/pcmucodec.cpp",
							"<(medooze_media_server_src)/src/g711/pcmacodec.cpp",
							"<(medooze_media_server_src)/src/g711/g711.cpp",
							"<(medooze_media_server_src)/src/g722/g722_encode.c",
							"<(medooze_media_server_src)/src/g722/g722_decode.c",
							"<(medooze_media_server_src)/src/g722/g722codec.cpp",
							"<(medooze_media_server_src)/src/gsm/gsmcodec.cpp",
							"<(medooze_media_server_src)/src/aac/aacencoder.cpp",
							"<(medooze_media_server_src)/src/aac/aacdecoder.cpp",
							"<(medooze_media_server_src)/src/mp3/MP3Decoder.cpp",
							"<(medooze_media_server_src)/src/opus/opusdecoder.cpp",
							"<(medooze_media_server_src)/src/opus/opusencoder.cpp",
							"<(medooze_media_server_src)/src/speex/speexcodec.cpp",
							"<(medooze_media_server_src)/src/speex/resample.c",
							"<(medooze_media_server_src)/src/opus/opusdepacketizer.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPDepacketizer.cpp",
							"<(medooze_media_server_src)/src/rtp/RTPIncomingMediaStreamDepacketizer.cpp",
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

