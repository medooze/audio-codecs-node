%include "AudioInput.i"
%include "Properties.i"
%include "MediaFrame.i"

%{
#include "AudioEncoderWorker.h"

class AudioEncoderFacade : public AudioEncoderWorker
{
public:
	AudioEncoderFacade()
	{
		loop.Start();
	}

	int SetAudioCodec(v8::Local<v8::Object> name, const Properties *properties)
	{
		//Get codec
		auto codec = AudioCodec::GetCodecForName(*Nan::Utf8String(name));
		//Set it
		return codec!=AudioCodec::UNKNOWN ? AudioEncoderWorker::SetAudioCodec(codec, properties? *properties : Properties()) : 0;
	}

	TimeService& GetTimeService() { return loop; }
private:
	EventLoop loop;
};
%}


struct AudioEncoderFacade
{
	AudioEncoderFacade();
	int Init(AudioInput *input);
	bool AddListener(const MediaFrameListenerShared& listener);
	bool RemoveListener(const MediaFrameListenerShared& listener);
	int SetAudioCodec(v8::Local<v8::Object> name, const Properties *properties );
	int StartEncoding();
	int StopEncoding();
	int End();
	int IsEncoding();

	TimeService& GetTimeService();
};

