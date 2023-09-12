const Native		= require("./Native");

function fromObject(object)
{
	function convert(properties, object, preffix = "")
	{
		if (object)
			//For each pro
			for (const [key,val] of Object.entries(object))
			{
				//if it is a plain object
				if (typeof(val)=="object" && val.constructor === Object)
					//Recurse it
					convert(properties, val, preffix + key + ".")
				//If it is a float
				else if (typeof(val)=="number" && !Number.isInteger(val) && !Number.isNaN(val))
					//Use override
					properties.SetFloatProperty(preffix + key, val);
				else
					//Set it
					try { properties.SetProperty(preffix + key, val); } catch (e){console.error(e)}
			}
	}
	//Create properties
	const properties = new Native.Properties();

	//Convert js object to property
	convert(properties, object)

	//Done
	return properties;
}

module.exports = {
	fromObject
}

