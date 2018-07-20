/*
 * usualy 
 * FF D8 (jpeg)
 * FF E1 (APP1 mmarker)
 * EXIF\0\0
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

var littleEndian;
var isJPEG;
var TIFFstart;
var tiffSize;

const EXIF_INVALID = -1;
const EXIF_UNKNOWN_ERROR = -2;

function getByteAt(index) {
    return self.int8View.get
}

self.findStart = function(data) {
    return data.indexOf('Exif\0\0')-2;
}

self.getEndianFromNav = function() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true /*littleEndian donc */);
    // Int16Array utilise le boutisme de la plate-forme
    return new Int16Array(buffer)[0] === 256;
}

self.init = function(options) {
    self.message = {
        uniqueIdentifier: null,
        fileName : null,
        cid : null,
        error : null
    };
    
    if(!options)
        return;
    self.message = {
        uniqueIdentifier: options.uniqueIdentifier,
        fileName : options.fileName,
        cid : options.cid,
        error : null
    };
    var data = options.binString;
    littleEndian = false;
    isJPEG = false;
    TIFFstart = 0;
    tiffSize = 0;
    TIFFstart = self.findStart(data);

    if(TIFFstart === -1 )
        throw new exifParseError("Le buffer doit contenir la chaine Exif");

    self.arrayBuffer = new ArrayBuffer(data.length);
    self.view = new DataView(arrayBuffer);
    
    for(var i= 0 ; i < data.length ; i++ ) {
        self.view.setInt8(i,data.charCodeAt(i));
    }
    
   self.buffer = arrayBuffer;
}

self.exifParseError = function(msg) {
    this.errorMessage = 'Error :'+msg;
    this.toString = function() {
       return this.errorMessage;
    };
}

self.checkEndian = function() {

    var value = self.getUint16(TIFFstart+8);
    switch (value) {
        case 0x4949://"little endian"
            littleEndian = true;
            break;
        case 0x4D4D://"big endian"
            littleEndian = false;
            break;
        default:
            throw new exifParseError("endianless .... impossible")
            break;
    }
}

self.checkJPEG = function() {
    var value = self.getUint16(0);
    if( value === 0xFFD8)
        isJPEG = true;
    else
        throw new exifParseError("Le fichier n'est pas un fichier JPEG")
}

self.findAPP1 = function() {
    var app1Flag = false;
    for (var i = 0 ; i < TIFFstart -1 && !app1Flag ; i++) {
        if(  self.view.getUint8(i) === 0xFF && self.view.getUint8(i+1) == 0xE1 ) 
            app1Flag = true;
    }
    if(app1Flag === false) {
        throw new exifParseError("No APP1 Flag")
    }
}

self.findSizeExif = function() {
    //TODO V2 will be usefull when we split the file to the correct size
    var value = self.view.getUint16(TIFFstart);
    tiffSize = value
  //  console.log("la taille de l'exif est de ",value);
}

self.checkIfHeaderCorrect = function() {
    if ( self.getUint16(TIFFstart+10) !== 0x002A)
        throw new exifParseError("TIFF Header not correct,problem on 0x2A00");
    if ( self.getUint32(TIFFstart+12) !== 0x00000008)
        throw new exifParseError("TIFF Header not correct,problem on 0x08000000");
}

self.parseExif = function() {
    var index = TIFFstart+17
    index+=1;
    var dateFound = false;
    while(index < tiffSize) {
        // console.log("index",index)
        var tagRef = self.getUint16(index);
        index+=2;
        var format = self.getUint16(index)
        index+=2;
        // console.log("iter",iter)
        // console.log("tagref",tagRef)  
        var components = self.getUint32(index)
        index+=4
        var valueOrOffset = self.getUint32(index)
        index+=4;
        if(tagRef == 0x0132  ) {
            if(format === 2)
            {
                dateFound = true;
                var textDecoder = new TextDecoder('utf-8');
                self.message.date = textDecoder.decode(new Uint8Array(self.buffer, valueOrOffset+TIFFstart+8,components-1));
                self.message.error = null;
                //console.log("file : "+self.uniqueIdentifier+" date : "+textDecoder.decode(new Uint8Array(self.buffer, valueOrOffset+TIFFstart+8,20)) )
                postMessage(self.message)
            }
           /* 
            console.log("value",value)*/
            break;

        }
    }
    if(!dateFound) {
        throw new exifParseError("no Exif date ");
    }
    //no exif date send file date or raise error
    // alert("no exif date")
}


self.getUint8 = function(offset) {
    return self.view.getUint8(offset);
}
self.getUint16 = function(offset) {
    return self.view.getUint16(offset,littleEndian);
}
self.getUint32 = function (offset) {
    return self.view.getUint32(offset,littleEndian);
}


self.onmessage = function(event) {
    if( !event || ( event.data &&  event.data.from != 'exifLib') ) {
        return;
    }
    self.init(event.data);
    try {
        self.checkJPEG();
        self.findAPP1();
        self.checkEndian();
        self.checkIfHeaderCorrect();
        self.findSizeExif();
        self.parseExif();
     } catch (e) {
         var error = null;
        if (e instanceof exifParseError) {
            error = EXIF_INVALID;
        } else {
            error = EXIF_UNKNOWN_ERROR;
        }
        self.message.error = error
        postMessage(self.message)

     }
};