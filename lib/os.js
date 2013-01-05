define('os', function () {
  var osdata = [
    {
      string: navigator.platform,
      subString: "Mac",
      identity: "mac"
    },
    {
      string: navigator.platform,
      subString: "Win",
      identity: "windows"
    },
    {
      string: navigator.platform,
      subString: "Linux",
      identity: "linux"
    },
    {
       string: navigator.userAgent,
       subString: "iPhone",
       identity: "ios"
    }
  ];
  for (var i = 0, l = osdata.length; i < l; i++) {
    var data = osdata[i];
    if (data.string.indexOf(data.subString) >= 0) {
      return data.identity;
    }
  }
  return "unknown OS";
});