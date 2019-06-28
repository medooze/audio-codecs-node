%module medooze_audio_codecs
%{
#include <nan.h>
#include "audioencoder.h"
#include "audiodecoder.h"
#include "AudioPipe.h"	
#include "MediaFrameListenerBridge.h"
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

int lock_ffmpeg(void **param, enum AVLockOp op)
{
	//Get mutex pointer
	pthread_mutex_t* mutex = (pthread_mutex_t*)(*param);
	//Depending on the operation
	switch(op)
	 {
		case AV_LOCK_CREATE:
			//Create mutex
			mutex = (pthread_mutex_t*)malloc(sizeof(pthread_mutex_t));
			//Init it
			pthread_mutex_init(mutex,NULL);
			//Store it
			*param = mutex;
			break;
		case AV_LOCK_OBTAIN:
			//Lock
			pthread_mutex_lock(mutex);
			break;
		case AV_LOCK_RELEASE:
			//Unlock
			pthread_mutex_unlock(mutex);
			break;
		case AV_LOCK_DESTROY:
			//Destroy mutex
			pthread_mutex_destroy(mutex);
			//Free memory
			free(mutex);
			//Clean
			*param = NULL;
			break;
	}
	return 0;
}

class AudioCodecs
{
public:
	static void Initialize()
	{
		//Register mutext for ffmpeg
		av_lockmgr_register(lock_ffmpeg);

		//Set log level
		av_log_set_callback(log_ffmpeg);

		//Init avcodecs
		avcodec_register_all();
	}
};
	
using MediaFrameListener =  MediaFrame::Listener;

class AudioDecoderFacade : public AudioDecoderWorker
{
public: 	
	AudioDecoderFacade() = default;
	~AudioDecoderFacade()
	{
		//Remove listener from old stream
		if (this->incoming) 
			this->incoming->RemoveListener(this);
	}
	
	void SetAACConfig(v8::Handle<v8::Value> config)
	{
		//Get value
		auto utf8 = v8::String::Utf8Value(config.As<v8::String>());
		
		//Allocate memory for the binary config
		size_t size  = utf8.length()/2;
		uint8_t* data = (uint8_t*)malloc(size);
		//Convert hext to byte
		for(size_t i=0; i<size; ++i)
			//Get value
			sscanf(*utf8+i*2, "%2hhx", &data[i]);
		//Set it
		AudioDecoderWorker::SetAACConfig(data,size);
		//Free config
		free(data);
	}
	bool SetIncoming(RTPIncomingMediaStream* incoming)
	{
		//If they are the same
		if (this->incoming==incoming)
			//DO nothing
			return false;
		//Remove listener from old stream
		if (this->incoming) 
			this->incoming->RemoveListener(this);

                //Store stream and receiver
                this->incoming = incoming;
		//Double check
		if (this->incoming)
			//Add us as listeners
			this->incoming->AddListener(this);
		
		//OK
		return true;
	}
	
	int Stop()
	{
		SetIncoming(nullptr);
		return AudioDecoderWorker::Stop();
	}

private:
	RTPIncomingMediaStream* incoming = nullptr;	
};

class AudioEncoderFacade : public AudioEncoderWorker
{
public:
	int SetAudioCodec(v8::Handle<v8::Value> name, const Properties *properties)
	{
		//Get codec
		auto codec = AudioCodec::GetCodecForName(*v8::String::Utf8Value(name.As<v8::String>()));
		//Set it
		return codec!=AudioCodec::UNKNOWN ? AudioEncoderWorker::SetAudioCodec(codec, properties? *properties : Properties()) : 0;
	}
};


class StreamTrackDepacketizer :
	public RTPIncomingMediaStream::Listener
{
public:
	StreamTrackDepacketizer(RTPIncomingMediaStream* incomingSource)
	{
		//Store
		this->incomingSource = incomingSource;
		//Add us as RTP listeners
		this->incomingSource->AddListener(this);
		//No depkacketixer yet
		depacketizer = NULL;
	}

	virtual ~StreamTrackDepacketizer()
	{
		//JIC
		Stop();
		//Check 
		if (depacketizer)
			//Delete depacketier
			delete(depacketizer);
	}

	virtual void onRTP(RTPIncomingMediaStream* group,const RTPPacket::shared& packet)
	{
		//Do not do extra work if there are no listeners
		if (listeners.empty()) 
			return;
		
		//If depacketizer is not the same codec 
		if (depacketizer && depacketizer->GetCodec()!=packet->GetCodec())
		{
			//Delete it
			delete(depacketizer);
			//Create it next
			depacketizer = NULL;
		}
		//If we don't have a depacketized
		if (!depacketizer)
			//Create one
			depacketizer = RTPDepacketizer::Create(packet->GetMedia(),packet->GetCodec());
		//Ensure we have it
		if (!depacketizer)
			//Do nothing
			return;
		//Pass the pakcet to the depacketizer
		 MediaFrame* frame = depacketizer->AddPacket(packet);
		 
		 //If we have a new frame
		 if (frame)
		 {
			 //Call all listeners
			 for (Listeners::const_iterator it = listeners.begin();it!=listeners.end();++it)
				 //Call listener
				 (*it)->onMediaFrame(packet->GetSSRC(),*frame);
			 //Next
			 depacketizer->ResetFrame();
		 }
		
			
	}
	
	virtual void onBye(RTPIncomingMediaStream* group) 
	{
		if(depacketizer)
			//Skip current
			depacketizer->ResetFrame();
	}
	
	virtual void onEnded(RTPIncomingMediaStream* group) 
	{
		if (incomingSource==group)
			incomingSource = nullptr;
	}
	
	void AddMediaListener(MediaFrame::Listener *listener)
	{
		//Add to set
		listeners.insert(listener);
	}
	
	void RemoveMediaListener(MediaFrame::Listener *listener)
	{
		//Remove from set
		listeners.erase(listener);
	}
	
	void Stop()
	{
		//If already stopped
		if (!incomingSource)
			//Done
			return;
		
		//Stop listeneing
		incomingSource->RemoveListener(this);
		//Clean it
		incomingSource = NULL;
	}
	
private:
	typedef std::set<MediaFrame::Listener*> Listeners;
private:
	Listeners listeners;
	RTPDepacketizer* depacketizer;
	RTPIncomingMediaStream* incomingSource;
};

%}

%nodefaultctor AudioCodecs;
%nodefaultdtor AudioCodecs;
struct AudioCodecs
{
	static void Initialize();
};
	
%nodefaultctor MediaFrameListener;
%nodefaultdtor MediaFrameListener;
struct MediaFrameListener {};

%nodefaultctor RTPIncomingMediaStream;
%nodefaultdtor RTPIncomingMediaStream;
struct RTPIncomingMediaStream {};

%nodefaultctor AudioInput;
%nodefaultdtor AudioInput;
struct  AudioInput {};

%nodefaultctor AudioOutput;
%nodefaultdtor AudioOutput;
struct  AudioOutput {};

struct AudioPipe : 
	public AudioInput,
	public AudioOutput
{
	AudioPipe(int rate);
};

struct MediaFrameListenerBridge : 
	public MediaFrameListener,
	RTPIncomingMediaStream
{
	MediaFrameListenerBridge(int ssrc);
};

struct Properties
{
	void SetProperty(const char* key,int intval);
	void SetProperty(const char* key,const char* val);
	void SetProperty(const char* key,bool boolval);
};

struct AudioEncoderFacade
{
	AudioEncoderFacade();
	int Init(AudioInput *input);
	bool AddListener(MediaFrameListener *listener);
	bool RemoveListener(MediaFrameListener *listener);
	int SetAudioCodec(v8::Handle<v8::Value> name, const Properties *properties );
	int StartEncoding();
	int StopEncoding();
	int End();
	int IsEncoding();
};

struct AudioDecoderFacade
{
	int Start();
	void SetAACConfig(v8::Handle<v8::Value> config);
	void AddAudioOuput(AudioOutput* ouput);
	void RemoveAudioOutput(AudioOutput* ouput);
	bool SetIncoming(RTPIncomingMediaStream* incoming);
	int Stop();
};


class StreamTrackDepacketizer 
{
public:
	StreamTrackDepacketizer(RTPIncomingMediaStream* incomingSource);
	//SWIG doesn't support inner classes, so specializing it here, it will be casted internally later
	void AddMediaListener(MediaFrameListener* listener);
	void RemoveMediaListener(MediaFrameListener* listener);
	void Stop();
};
