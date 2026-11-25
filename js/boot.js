/* ---- wiring (runs once; elements are static HTML above the scripts) ---- */
(function(){
  /* photo quick-log: snap the meal, punch in the numbers, the photo rides along */
  var qpb = document.getElementById("qPhotoBtn"), qpf = document.getElementById("qPhotoFile");
  if(qpb && qpf){
    qpb.onclick = function(){ qpf.click(); };
    qpf.onchange = function(){
      var f = qpf.files && qpf.files[0]; if(!f) return;
      downscalePhoto(f, 480, function(url){ /* 2026.10.09-h: was 640 — meal thumbs do not need the bytes */
        window.__qPhoto = url;
        var img = document.getElementById("qPhotoImg"), pv = document.getElementById("qPhotoPrev");
        if(img) img.src = url;
        if(pv) pv.style.display = "flex";
      });
      qpf.value = "";
    };
    var qpd = document.getElementById("qPhotoDel");
    if(qpd) qpd.onclick = function(){
      window.__qPhoto = null;
      var pv = document.getElementById("qPhotoPrev");
      if(pv) pv.style.display = "none";
    };
  }
})();
autoPilot();
