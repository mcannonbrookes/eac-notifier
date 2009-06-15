function NetworkNotifier(doc){
  var that = this;
  $(doc).click(this.goToNetwork);
  that.update(doc);
  
  setInterval( function(){
    that.update(doc);
  }, 60*1000 );
}

NetworkNotifier.prototype = {
  ids: {},
  
  goToNetwork: function(){
    jetpack.tabs.open("https://extranet.atlassian.com/users/viewfollow.action");
    jetpack.tabs[ Jetpack.tabs.length-1 ].focus();
  },
  
  update: function(doc){
    console.log('update() ' + new Date());
    var url = "https://extranet.atlassian.com/feeds/follow.action?contentType=USER_STATUS&publicFeed=false&os_authType=basic&rssType=atom&output=atom";
    doc = $(doc);
    var that = this;
    $.get( url, function(xml){
      var el = "";
      var displayCount = 0;
      $(xml).find("entry").each(function() {
        // var id_text = $(this).attr('id');
        var entryid = $(this).find('id').text();
        // console.log(entryid);
        // console.log(that.ids.length);
        if (!that.ids[entryid]) {
          var title = $(this).find('title').text();
          var author = $(this).find('name').text();
          var text = $(this).find('summary').text();
          var icon = 'http://confluence.atlassian.com/s/1619/13/_/images/logo/confluence_16.png';

          // try to work out if we're a status message or not, by the first characters
          if (title.length > author.length && title.substring(0, author.length) == author)
          {
            title = title.substring(author.length + 1);
          }

          
          if (displayCount++ < 15) {
             var idx = text.indexOf('/display/~');
             if (idx > 0) {
                var endIdx = text.indexOf('"', idx);
                if (endIdx > 0) {
                   var username = text.substring(idx + '/display~'.length + 1, endIdx);
                   // console.log(username);
                   if (!jetpack.storage.live.confAvatars)
                      jetpack.storage.live.confAvatars = { };
                   if (jetpack.storage.live.confAvatars[username]) {
                        console.log("Already got icon for " + username + " - displaying now.");
                        jetpack.notifications.show({'title': author, 
                        'body': title, 
                        'icon': jetpack.storage.live.confAvatars[username]});
                   }
                   else { // we don't have an icon for that user yet, go get it
                      console.log("Getting icon for " + username + " as not cached.");
                      $.get("https://extranet.atlassian.com/users/userinfopopup.action?username=" + username, { },
                      function(data){
                          // console.log(data.length);
                          icon = 'https://extranet.atlassian.com' + $(data).find('img.userLogo').attr('src');
                          jetpack.storage.live.confAvatars[username] = icon;
                          // console.log(icon);
                          jetpack.notifications.show({'title': author, 
                            'body': title, 
                            'icon': icon});
                      });
                   }
                }
             }
          }
        }
        else {
          // console.log(entryid + ' already seen');
        }
        that.ids[entryid] = entryid;
        // console.log('ids: ' + that.ids[entryid]);
      });
    });
  }
}

jetpack.statusBar.append({
  html: '<img src="http://confluence.atlassian.com/s/1619/13/_/images/logo/confluence_16.png" vspace="2"><span id="count"></span>',
  onReady: function(doc){
    var network = new NetworkNotifier(doc);
  },
  width: 20
});