%module medooze_audio_codecs
%{
#include <nan.h>
#include "EventLoop.h"
%}

%typemap(in) v8::Local<v8::Object> {
	$1 = v8::Local<v8::Object>::Cast($input);
}

%include "shared_ptr.i"
%include "MediaFrame.i"
%include "MediaFrameListenerBridge.i"
%include "Properties.i"
%include "RTPIncomingMediaStream.i"

%include "AudioCodecs.i"
%include "AudioDecoderFacade.i"
%include "AudioEncoderFacade.i"
%include "AudioInput.i"
%include "AudioOutput.i"
%include "AudioPipe.i"

