%{
#include "audiodecoder.h"

class AudioDecoderFacade : public AudioDecoderWorker
{
public: 	
	AudioDecoderFacade() = default;
	~AudioDecoderFacade()
	{
		Log("-AudioDecoderFacade::~AudioDecoderFacade()() [incoming:%p,this:%p]\n",incoming.get(),this);
		//Remove listener from old stream
		if (this->incoming) 
			this->incoming->RemoveListener(this);
	}
	
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

	bool SetIncoming(const RTPIncomingMediaStream::shared& incoming)
	{
		Log("-AudioDecoderFacade::SetIncoming() [incoming:%p,this:%p]\n",incoming.get(),this);

		//TODO: may be a sync issue here with onEnded

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
		SetIncoming({});
		return AudioDecoderWorker::Stop();
	}

	virtual void onEnded(RTPIncomingMediaStream* incoming)
	{
		Log("-AudioDecoderFacade::onEnded() [incoming:%p,this:%p]\n",incoming,this);
		//If they are the same
		if (this->incoming.get()==incoming)
			this->incoming.reset();
		AudioDecoderWorker::onEnded(incoming);
	}

private:
	RTPIncomingMediaStream::shared incoming;	
};
%}

%include "RTPIncomingMediaStream.i"

struct AudioDecoderFacade
{
	int Start();
	void SetAACConfig(v8::Local<v8::Object> config);
	void AddAudioOuput(AudioOutput* ouput);
	void RemoveAudioOutput(AudioOutput* ouput);
	bool SetIncoming(const RTPIncomingMediaStreamShared& incomingSource);
	int Stop();
};

