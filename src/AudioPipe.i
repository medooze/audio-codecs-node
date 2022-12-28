%{
#include "AudioPipe.h"	
%}

struct AudioPipe : 
	public AudioInput,
	public AudioOutput
{
	AudioPipe(int rate);
};