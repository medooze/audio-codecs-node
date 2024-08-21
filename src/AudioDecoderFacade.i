%{
#include "audiodecoder.h"

class AudioDecoderFacade : public AudioDecoderWorker
{
public: 	
	AudioDecoderFacade() = default;
	~AudioDecoderFacade() = default;
	
	void SetAACConfig(v8::Local<v8::Object> config)
	{
		//Get value
		auto utf8 = Nan::Utf8String(config);
		
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
};
%}

struct AudioDecoderFacade : public MediaFrameListener
{
	int Start();
	void SetAACConfig(v8::Local<v8::Object> config);
	void AddAudioOuput(AudioOutput* ouput);
	void RemoveAudioOutput(AudioOutput* ouput);
	int Stop();
	
};

SHARED_PTR_BEGIN(AudioDecoderFacade)
{
	AudioDecoderFacadeShared()
	{
		return new std::shared_ptr<AudioDecoderFacade>(new AudioDecoderFacade());
	}
	SHARED_PTR_TO(MediaFrameListener)
}
SHARED_PTR_END(AudioDecoderFacade)

