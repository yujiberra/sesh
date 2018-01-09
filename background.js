/*  This background page is used to associate a saved session's name
    to the window it's opened into, so that name can be used as the
    default name if the user decides to save that window again. */

var windowNames = new Array();

/*   Stores a window's name for the future */
var setWindowName = function(windowId, name) {
  windowNames[windowId] = name;
  console.log(name);
}

/*  Gets a window's name */
var getWindowName = function(windowId) {
  return windowNames[windowId];
}

/* function removeBoomarks(boookmarkId) {
  chrome.bookmarks.removeTree(bookmarkId);
} */
