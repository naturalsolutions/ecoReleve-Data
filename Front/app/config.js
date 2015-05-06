define({
    root: window.location.pathname.replace(/\/(?:index.html)?$/, ''),

    serverUrl: "http://192.168.1.199/ThesaurusCore", //http://127.0.0.1:6543/ecoReleve-core/",  /ThesaurusCore
    sensorUrl: "http://127.0.0.1:6545/ecoReleve-Sensor/",
    coreUrl: "http://127.0.0.1/ecoReleve-Core/",
    siteName: "Missour. Morocco",
    dateLabel: 'jj/mm/aaaa hh:mm:ss',
    dateFormats: ['DD/MM/YYYY', 'DD/MM/YYYY HH:mm:ss'],
    mapDefault: {
        zoom: 9,
        center: [-4.094755, 33.006721]
    }
});
