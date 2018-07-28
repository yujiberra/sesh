var sesh_folder_name = "[Sesh saved sessions]";

$(function() {
  var sesh = new Sesh(99, "document.png", "documents-stack.png");
  sesh.initialize();

  /*  Click event for 'Save tab' button.
      Saves the tab as a bookmark, then closes it (but if it's the
      last tab in the last window, it opens a new tab so you're not
      left without a Chrome window) */
  $('#savetab').click(function(event){
    // Get current tab...
    chrome.tabs.getSelected(null,function(tab) {
      // Then save it to bookmarks...
      chrome.bookmarks.create({
        'parentId': sesh.bookmarkId,
        'title': tab.title,
        'url': tab.url});
      // Then check the number of tabs currently open
      chrome.tabs.getAllInWindow(null, function(tabs) {
        // If it's the last tab...
        if (tabs.length == 1) {
          chrome.windows.getAll(null, function(windows) {
            // In the last window, we create a new tab in addition to
            // removing the saved tab and re-rendering the popup.
            if (windows.length==1) {
              chrome.tabs.create({});
              chrome.tabs.remove(tab.id);
              sesh.initialize();
            }
            else {
              chrome.tabs.remove(tab.id);
              sesh.initialize();
            }
          });
        }
        else {
          chrome.tabs.remove(tab.id);
          sesh.initialize();
        }
      });
    });
  });

  /*  Click event for 'Save window' button.
      Pops up a dialog asking to name the session.  If user accepts a
      name, then all the tabs are saved into a bookmark folder, and
      the window is closed (with another window opened if it was the
      last window).
  */
  $('#savewindow').click(function(event){
    chrome.tabs.getAllInWindow(null,function(tabs) {
      chrome.windows.getCurrent(function(window) {
        //  If the window was opened by opening a saved session, we
        //  recover  the old name here so we can use it as the default.
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
          var defaultName = backgroundPage.getWindowName(window.id);

          var edit = $('<input style="width:250px" id="nameEntry">').val(defaultName == null ? "Saved window" : defaultName);

          //  Make the window tall enough to fit the dialog box.
          var height = $('body').height();
          if (height < 145) { $('body').height(145); }

          //  Open the dialog.
          $('<div></div>').empty().append($('<label for="nameEntry">Enter a name for this window:</label><div style="height:3px"></div>')).append(edit).dialog(
            {autoOpen: false,
             closeOnEscape: true,
             title: 'Save window',
             modal: true,
             buttons: {
               Cancel: function() {
                 $(this).dialog('destroy');
               },

               // The Save button
               'Save': function() {
                 // Create a new bookmark folder...
                 chrome.bookmarks.create({
                   'parentId': sesh.bookmarkId,
                   // If name is blank, use "Saved window" as the name
                   'title': (edit.val() == "") ? "Saved window" : edit.val()},
                   function(newFolder) {
                     chrome.windows.getAll(null, function(windows) {
                       var onlyWindow = (windows.length == 1);
                       //  Save all the tabs in the new folder
                       for (var i = 0; i < tabs.length; i++) {
                         chrome.bookmarks.create({
                           'parentId': newFolder.id,
                           'title': tabs[i].title,
                           'url': tabs[i].url});
                         chrome.tabs.remove(tabs[i].id);
                       }
                       //  Create a new window if this is the last window
                       //  (since we're about to close it)
                       if (onlyWindow) {
                         chrome.windows.create();
                       }
                     });
                   }
                 );
                 $(this).dialog('destroy');
               }
           }}).dialog('open');
          // Make it so pressing enter in the text input submits the
          // dialog.
          $('#nameEntry').select().keyup(function(e) {
            if (e.keyCode == 13) {
              $('.ui-dialog-buttonset > button:last').trigger('click');
            }
           });
        });
      });
    });
  });

});

/*  Creates a new Sesh instance
    Arguments:
      seshNameLength - number of characters that session names are
        truncated to
      singleTabImage - the icon used for a single-tab session
      multiTabImage - the icon used for a multi-tab session
*/
function Sesh(seshNameLength, singleTabImage, multiTabImage) {
  /*This is a list, in Unicode escape sequences, of ways that Chrome
    will call the "Other Bookmarks" folder in various languages.
    Unfortunately, there's way for us to find the folder other than
    by name, and there are many different possible names. */
  this.otherBookmarkFolderNames =

    ["\x4f\x74\x68\x65\x72\x20\x42\x6f\x6f\x6b\x6d\x61\x72\x6b\x73",
    "\u120c\u120b\x20\u12a5\u120d\u1263\u1276\u127d",
    "\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a\x20\u0627\u0644\u0623\u062e\u0631\u0649",
    "\u0985\u09a8\u09cd\u09af\x20\u09ac\u09c1\u0995\u09ae\u09be\u09b0\u09cd\u0995\u09b8",
    "\u0414\u0440\u0443\u0433\u0438\x20\u043e\u0442\u043c\u0435\u0442\u043a\u0438",
    "\x41\x6c\x74\x72\x65\x73\x20\x61\x64\x72\x65\x63\x65\x73\x20\x64\x27\x69\x6e\x74\x65\x72\xe8\x73",
    "\u5176\u4ed6\u4e66\u7b7e",
    "\u5176\u4ed6\u66f8\u7c64",
    "\x44\x72\x75\x67\x65\x20\x6f\x7a\x6e\x61\x6b\x65",
    "\x4f\x73\x74\x61\x74\x6e\xed\x20\x7a\xe1\x6c\x6f\u017e\x6b\x79",
    "\x41\x6e\x64\x72\x65\x20\x62\x6f\x67\x6d\xe6\x72\x6b\x65\x72",
    "\x41\x6e\x64\x65\x72\x65\x20\x62\x6c\x61\x64\x77\x69\x6a\x7a\x65\x72\x73",
    "\x4f\x74\x68\x65\x72\x20\x62\x6f\x6f\x6b\x6d\x61\x72\x6b\x73",
    "\x4d\x75\x75\x64\x20\x6a\xe4\x72\x6a\x65\x68\x6f\x69\x64\x6a\x61\x64",
    "\x49\x62\x61\x20\x70\x61\x6e\x67\x20\x6d\x67\x61\x20\x62\x6f\x6f\x6b\x6d\x61\x72\x6b",
    "\x4d\x75\x75\x74\x20\x6b\x69\x72\x6a\x61\x6e\x6d\x65\x72\x6b\x69\x74",
    "\x41\x75\x74\x72\x65\x73\x20\x66\x61\x76\x6f\x72\x69\x73",
    "\x57\x65\x69\x74\x65\x72\x65\x20\x4c\x65\x73\x65\x7a\x65\x69\x63\x68\x65\x6e",
    "\u0386\u03bb\u03bb\u03bf\u03b9\x20\u03c3\u03b5\u03bb\u03b9\u03b4\u03bf\u03b4\u03b5\u03af\u03ba\u03c4\u03b5\u03c2",
    "\u0a85\u0aa8\u0acd\u0aaf\x20\u0aac\u0ac1\u0a95\u0aae\u0abe\u0ab0\u0acd\u0a95\u0acd\u0ab8",
    "\u05e1\u05d9\u05de\u05e0\u05d9\u05d5\u05ea\x20\u05d0\u05d7\u05e8\u05d5\u05ea",
    "\u0905\u0928\u094d\u092f\x20\u092c\u0941\u0915\u092e\u093e\u0930\u094d\u0915",
    "\x54\x6f\x76\xe1\x62\x62\x69\x20\x6b\xf6\x6e\x79\x76\x6a\x65\x6c\x7a\u0151\x6b",
    "\x42\x6f\x6f\x6b\x6d\x61\x72\x6b\x20\x6c\x61\x69\x6e",
    "\x41\x6c\x74\x72\x69\x20\x50\x72\x65\x66\x65\x72\x69\x74\x69",
    "\u305d\u306e\u4ed6\u306e\u30d6\u30c3\u30af\u30de\u30fc\u30af",
    "\u0c87\u0ca4\u0cb0\x20\u0cac\u0cc1\u0c95\u0ccd\u200c\u0cae\u0cbe\u0cb0\u0ccd\u0c95\u0ccd\u200c\u0c97\u0cb3\u0cc1",
    "\uae30\ud0c0\x20\ubd81\ub9c8\ud06c",
    "\x43\x69\x74\x61\x73\x20\x67\x72\u0101\x6d\x61\x74\x7a\u012b\x6d\x65\x73",
    "\x4b\x69\x74\x6f\x73\x20\u017e\x79\x6d\u0117\x73",
    "\u0d2e\u0d31\u0d4d\u0d31\u0d4d\x20\u0d2c\u0d41\u0d15\u0d4d\u200c\u0d2e\u0d3e\u0d30\u0d4d\u200d\u0d15\u0d4d\u0d15\u0d41\u0d15\u0d33\u0d4d\u200d",
    "\u0907\u0924\u0930\x20\u092c\u0941\u0915\u092e\u093e\u0930\u094d\u0915",
    "\x41\x6e\x64\x72\x65\x20\x62\x6f\x6b\x6d\x65\x72\x6b\x65\x72",
    "\u0646\u0634\u0627\u0646\u06a9\u0647\u0627\u06cc\x20\u062f\u06cc\u06af\u0631",
    "\x49\x6e\x6e\x65\x20\x7a\x61\x6b\u0142\x61\x64\x6b\x69",
    "\x4f\x75\x74\x72\x6f\x73\x20\x66\x61\x76\x6f\x72\x69\x74\x6f\x73",
    "\x4f\x75\x74\x72\x6f\x73\x20\x6d\x61\x72\x63\x61\x64\x6f\x72\x65\x73",
    "\x41\x6c\x74\x65\x20\x6d\x61\x72\x63\x61\x6a\x65",
    "\u0414\u0440\u0443\u0433\u0438\u0435\x20\u0437\u0430\u043a\u043b\u0430\u0434\u043a\u0438",
    "\u041e\u0441\u0442\u0430\u043b\u0438\x20\u043e\u0431\u0435\u043b\u0435\u0436\u0438\u0432\u0430\u0447\u0438",
    "\x49\x6e\xe9\x20\x7a\xe1\x6c\x6f\u017e\x6b\x79",
    "\x44\x72\x75\x67\x69\x20\x7a\x61\x7a\x6e\x61\x6d\x6b\x69",
    "\x4f\x74\x72\x6f\x73\x20\x6d\x61\x72\x63\x61\x64\x6f\x72\x65\x73",
    "\x4f\x74\x72\x6f\x73\x20\x6d\x61\x72\x63\x61\x64\x6f\x72\x65\x73",
    "\x41\x6c\x61\x6d\x69\x73\x68\x6f\x20\x7a\x69\x6e\x67\x69\x6e\x65",
    "\xd6\x76\x72\x69\x67\x61\x20\x62\x6f\x6b\x6d\xe4\x72\x6b\x65\x6e",
    "\u0baa\u0bbf\u0bb1\x20\u0baa\u0bc1\u0b95\u0bcd\u0bae\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0bb8\u0bcd",
    "\u0c07\u0c24\u0c30\x20\u0c2c\u0c41\u0c15\u0c4d\u200c\u0c2e\u0c3e\u0c30\u0c4d\u0c15\u0c4d\u200c\u0c32\u0c41",
    "\u0e1a\u0e38\u0e4a\u0e04\u0e21\u0e32\u0e23\u0e4c\u0e04\u0e2d\u0e37\u0e48\u0e19\u0e46",
    "\x44\x69\u011f\x65\x72\x20\x79\x65\x72\x20\x69\x6d\x6c\x65\x72\x69",
    "\u0406\u043d\u0448\u0456\x20\u0437\u0430\u043a\u043b\u0430\u0434\u043a\u0438",
    "\x44\u1ea5\x75\x20\x74\x72\x61\x6e\x67\x20\x6b\x68\xe1\x63",
    "\x44\u1ea5\x75\x20\x74\x72\x61\x6e\x67\x20\x4b\x68\xe1\x63"]
  this.seshNameLength = seshNameLength;
  this.singleTabImage = singleTabImage;
  this.multiTabImage = multiTabImage;
}

//  Initializes Sesh; the key thing needed for this is the entire set
//  of Chrome bookmarkNodes.
Sesh.prototype.initialize = function() {
  var me = this;
  chrome.bookmarks.getTree(
    function(bookmarkNodes) {
      me.findSeshFolder(bookmarkNodes);
    });
}

//  Finds the Sesh saved sessions bookmark folder (or creates it if
//  necessary then stores it in the class.
//  Then calls Sesh.setBookmarkAndRender to save the bookmark as an
//  instance variable and render the sessions.
Sesh.prototype.findSeshFolder = function(bookmarkNodes) {

  // Find the Other Bookmarks folder
  var i;
  var foundOtherBookmarks = false;
  for (i = 0; i < bookmarkNodes[0].children.length; i++) {
    if (this.otherBookmarkFolderNames.indexOf(bookmarkNodes[0].children[i].title) >= 0) {
      foundOtherBookmarks = true;
      break;
    }
  }

  if (!foundOtherBookmarks) {
    $('body').empty();
    $('body').append($("<p>I'm sorry, Sesh was unable to find the \"Other bookmarks\" folder.</p><p>This is probably because you're using a language that Sesh doesn't support yet.</p><p>Please let me know what language you're using and what operating system you're using on the <a href=\"https://chrome.google.com/webstore/detail/emclpejnhkiogdlimfgipbdfpdcnhhoj\" target=\"_blank\">extension page</a> or by <a href=\"mailto:yuji.kosugi@gmail.com\" target=\"_blank\">email</a> and I will fix it as soon as possible.</p><p>Thanks!<br/>Yuji</p>"));
  } else {

    var otherBookmarksFolder = bookmarkNodes[0].children[i];
    var otherBookmarks = otherBookmarksFolder.children;

    // Search for the Sesh saved sessions folder and return it if found.
    for (var i = 0; i < otherBookmarks.length; i++) {
      if (otherBookmarks[i].children &&
        otherBookmarks[i].title == sesh_folder_name) {
        this.setBookmarkAndRender(otherBookmarks[i]);
        return;
      }
    }

    // If Sesh saved sessions folder isn't found, create it and return it.
    var me = this;
    chrome.bookmarks.create(
      {'parentId': otherBookmarksFolder.id,
       'title': sesh_folder_name},
      function(bookmarkTreeNode) {
        me.setBookmarkAndRender(bookmarkTreeNode);
      }
    );

  }
}

/*   Saves the Sesh saved sessions folder as instance variables
    and renders the sessions. */
Sesh.prototype.setBookmarkAndRender = function(bookmarkTreeNode) {
  this.sessionBookmarks = bookmarkTreeNode.children;
  this.bookmarkId = bookmarkTreeNode.id;
  this.renderSessions();
}

/*  Empties the session list in the popup, then goes through all the
    sessions in the Sesh saved sessions bookmark folder and renders
    them one by one. */
Sesh.prototype.renderSessions = function() {
  var div = $('<div class="seshitems">');
  for (var i = this.sessionBookmarks.length-1; i >= 0; i--) {
    div.append(this.renderSesh(this.sessionBookmarks[i]));
  }
  $('#sessions').empty().append(div);
}

/*  Renders a session based on stored information in a bookmark,
    with different behavior depending on whether it is a folder
    or a one-tab session. */
Sesh.prototype.renderSesh = function(seshBookmark) {
  var seshitem_div = $('<div class="seshitem light-blue">');

  if (seshBookmark.children) { // For a multi-tab session
    seshname_div = $('<div class="seshname"></div>')
    // Add the favicons for each tab in the session
    for (var i = 0; i < seshBookmark.children.length; i++) {
      seshname_div.append($('<img src="chrome://favicon/' +
        seshBookmark.children[i].url + '" alt="' +
        seshBookmark.children[i].url + '" width="16" height="16">'));
    }
    seshname_div.append($('<span style="vertical-align:top"> ' + this.truncateSeshName(seshBookmark.title + '</span>')));
    seshitem_div.append(seshname_div);

    // Extract all the pages stored in the session
    var pages = new Array(seshBookmark.children.length);
    for (var i = 0; i < pages.length; i++) {
      pages[i] = seshBookmark.children[i].url;
    }

    // When item is clicked, open a new window with all pages opened
    // in tabs, then delete the bookmarks.
    seshitem_div.click(function() {
      var bookmarkTitle = seshBookmark.title;
      chrome.windows.create({url: pages},
        function(window) {
          // Associate the session's name to the window so that if
          // the user saves the window, we can give the old session
          // name as the default name.
          chrome.runtime.getBackgroundPage(function(backgroundPage) {
            backgroundPage.setWindowName(window.id, bookmarkTitle);
          });
      });
      chrome.bookmarks.removeTree(seshBookmark.id);
    });

  } else { // For a single-tab session
    seshitem_div.append($('<div class="seshname">' +
      '<img src="chrome://favicon/' + seshBookmark.url +
      '" alt="' + seshBookmark.url + '" width="16" height="16">' +
      ' ' + this.truncateSeshName(seshBookmark.title) +
      '</div>'));

    // When item is clicked, open the page in a tab and delete the
    // bookmark.
    var me = this;
    seshitem_div.click(function() {
      chrome.tabs.create({url: seshBookmark.url});
      chrome.bookmarks.remove(seshBookmark.id,function() {
        me.initialize();
      });
    });
  }

  timestamp_div = $('<div class="timestamp">' +
    shorter_timestamp(new Date(seshBookmark.dateAdded))+'</div>');

  return seshitem_div.append(timestamp_div);
}

/*  Creates a short timestamp string by using timeago.js, then modifying it
    to be a little shorter */
shorter_timestamp = function(date) {
  timestamp = $.timeago(date);
  timestamp = timestamp.replace("less than a minute ago", "just now");
  timestamp = timestamp.replace("about ", "~");
  timestamp = timestamp.replace("a ", "1 ");
  timestamp = timestamp.replace("an ", "1 ");
  return(timestamp);
}

/*  Truncate a string to a length defined when creating Sesh object.
    Used to truncate the name of a saved session. */
Sesh.prototype.truncateSeshName = function(name) {
  if (name.length < this.seshNameLength) {
    return name;
  } else {
    return name.substring(0,this.seshNameLength) + "...";
  }
}
