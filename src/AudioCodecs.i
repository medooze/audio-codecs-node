%{
extern "C" {
#include "libavcodec/avcodec.h"
}

void log_ffmpeg(void* ptr, int level, const char* fmt, va_list vl)
{
	static int print_prefix = 1;
	char line[1024];

	//if (!Logger::IsUltraDebugEnabled() && level > AV_LOG_ERROR)
	//	return;

	//Format the
	av_log_format_line(ptr, level, fmt, vl, line, sizeof(line), &print_prefix);

	//Remove buffer errors
	//if (strstr(line,"vbv buffer overflow")!=NULL)
		//exit
	//	return;
	//Log
	Log(line);
}


class AudioCodecs
{
public:
	static void Initialize()
	{
		//Set log level
		av_log_set_callback(log_ffmpeg);
	}
		
	static void EnableLog(bool flag)
	{
		//Enable log
		Logger::EnableLog(flag);
	}
	
	static void EnableDebug(bool flag)
	{
		//Enable debug
		Logger::EnableDebug(flag);
	}
	
	static void EnableUltraDebug(bool flag)
	{
		//Enable debug
		Logger::EnableUltraDebug(flag);
	}

	static void Terminate()
	{
		//Do nothing for now
	}
};

%}

%nodefaultctor AudioCodecs;
%nodefaultdtor AudioCodecs;
struct AudioCodecs
{
	static void Initialize();
	static void EnableLog(bool flag);
	static void EnableDebug(bool flag);
	static void EnableUltraDebug(bool flag);
};