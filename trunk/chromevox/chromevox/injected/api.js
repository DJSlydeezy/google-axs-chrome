// Copyright 2013 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Public APIs to enable web applications to communicate
 * with ChromeVox.
 *
 * @author clchen@google.com (Charles L. Chen)
 */

if (typeof(goog) != 'undefined' && goog.provide) {
  goog.provide('cvox.Api');
}

if (typeof(goog) != 'undefined' && goog.require) {
  goog.require('cvox.ApiImplementation');
}

(function() {
   /*
    * Private data and methods.
    */

   /**
    * The name of the port between the content script and background page.
    * @type {string}
    * @const
    */
   var PORT_NAME = 'cvox.Port';

   /**
    * The name of the message between the page and content script that sets
    * up the bidirectional port between them.
    * @type {string}
    * @const
    */
   var PORT_SETUP_MSG = 'cvox.PortSetup';

   /**
    * The message between content script and the page that indicates the
    * connection to the background page has been lost.
    * @type {string}
    * @const
    */
   var DISCONNECT_MSG = 'cvox.Disconnect';

   /**
    * The channel between the page and content script.
    * @type {MessageChannel}
    */
   var channel_;

   /**
    * Tracks whether or not the ChromeVox API should be considered active.
    * @type {boolean}
    */
   var isActive_ = false;

   /**
    * The next id to use for async callbacks.
    * @type {number}
    */
   var nextCallbackId_ = 1;

   /**
    * Map from callback ID to callback function.
    * @type {Object.<number, function(*)>}
    */
   var callbackMap_ = {};

   /**
    * Internal function to connect to the content script.
    */
   function connect_() {
     if (channel_) {
       // If there is already an existing channel, close the existing ports.
       channel_.port1.close();
       channel_.port2.close();
       channel_ = null;
     }

     channel_ = new MessageChannel();
     window.postMessage(PORT_SETUP_MSG, [channel_.port2], '*');
     channel_.port1.onmessage = function(event) {
       if (event.data == DISCONNECT_MSG) {
         channel_ = null;
       }
       try {
         var message = JSON.parse(event.data);
         if (message['id'] && callbackMap_[message['id']]) {
           callbackMap_[message['id']](message);
           delete callbackMap_[message['id']];
         }
       } catch (e) {
       }
     };
   }

   /**
    * Internal function to send a message to the content script and
    * call a callback with the response.
    * @param {Object} message A serializable message.
    * @param {function(*)} callback A callback that will be called
    *     with the response message.
    */
   function callAsync_(message, callback) {
     var id = nextCallbackId_;
     nextCallbackId_++;
     if (message['args'] === undefined) {
       message['args'] = [];
     }
     message['args'] = [id].concat(message['args']);
     callbackMap_[id] = callback;
     channel_.port1.postMessage(JSON.stringify(message));
   }


   /*
    * Public API.
    */

   if (!window['cvox']) {
     window['cvox'] = {};
   }
   var cvox = window.cvox;


   /**
    * ApiImplementation - this is only visible if all the scripts are compiled
    * together like in the Android case. Otherwise, implementation will remain
    * null which means communication must happen over the bridge.
    *
    * @type {*}
    */
   var implementation_ = null;
   if (typeof(cvox.ApiImplementation) != 'undefined') {
     implementation_ = cvox.ApiImplementation;
   }


   /**
    * @constructor
    */
   cvox.Api = function() {
   };

   /**
    * Internal-only function, only to be called by the content script.
    * Enables the API and connects to the content script.
    */
   cvox.Api.internalEnable = function() {
     isActive_ = true;
     if (!implementation_) {
       connect_();
     }
     var event = document.createEvent('UIEvents');
     event.initEvent('chromeVoxLoaded', true, false);
     document.dispatchEvent(event);
   };

   /**
    * Internal-only function, only to be called by the content script.
    * Disables the ChromeVox API.
    */
   cvox.Api.internalDisable = function() {
     isActive_ = false;
     channel_ = null;
     var event = document.createEvent('UIEvents');
     event.initEvent('chromeVoxUnloaded', true, false);
     document.dispatchEvent(event);
   };

   /**
    * Returns true if ChromeVox is currently running. If the API is available
    * in the JavaScript namespace but this method returns false, it means that
    * the user has (temporarily) disabled ChromeVox.
    *
    * You can listen for the 'chromeVoxLoaded' event to be notified when
    * ChromeVox is loaded.
    *
    * @return {boolean} True if ChromeVox is currently active.
    */
   cvox.Api.isChromeVoxActive = function() {
     if (implementation_) {
       return isActive_;
     }
     return !!channel_;
   };

   /**
    * Speaks the given string using the specified queueMode and properties.
    *
    * @param {string} textString The string of text to be spoken.
    * @param {number=} queueMode Valid modes are 0 for flush; 1 for queue.
    * @param {Object=} properties Speech properties to use for this utterance.
    */
   cvox.Api.speak = function(textString, queueMode, properties) {
     if (!cvox.Api.isChromeVoxActive()) {
       return;
     }

     if (implementation_) {
       implementation_.speak(textString, queueMode, properties);
     } else {
       var message = {
         'cmd': 'speak',
         'args': [textString, queueMode, properties]
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Speaks a description of the given node.
    *
    * @param {Node} targetNode A DOM node to speak.
    * @param {number=} queueMode Valid modes are 0 for flush; 1 for queue.
    * @param {Object=} properties Speech properties to use for this utterance.
    */
   cvox.Api.speakNode = function(targetNode, queueMode, properties) {
     if (!cvox.Api.isChromeVoxActive()) {
       return;
     }

     if (implementation_) {
       implementation_.speak(cvox.DomUtil.getName(targetNode),
           queueMode, properties);
     } else {
       var message = {
         'cmd': 'speakNodeRef',
         'args': [cvox.ApiUtils.makeNodeReference(targetNode), queueMode,
             properties]
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Stops speech.
    */
   cvox.Api.stop = function() {
     if (!cvox.Api.isChromeVoxActive()) {
       return;
     }

     if (implementation_) {
       implementation_.stop();
     } else {
       var message = {
         'cmd': 'stop'
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Plays the specified earcon sound.
    *
    * @param {string} earcon An earcon name.
    * Valid names are:
    *   ALERT_MODAL
    *   ALERT_NONMODAL
    *   BULLET
    *   BUSY_PROGRESS_LOOP
    *   BUSY_WORKING_LOOP
    *   BUTTON
    *   CHECK_OFF
    *   CHECK_ON
    *   COLLAPSED
    *   EDITABLE_TEXT
    *   ELLIPSIS
    *   EXPANDED
    *   FONT_CHANGE
    *   INVALID_KEYPRESS
    *   LINK
    *   LISTBOX
    *   LIST_ITEM
    *   NEW_MAIL
    *   OBJECT_CLOSE
    *   OBJECT_DELETE
    *   OBJECT_DESELECT
    *   OBJECT_OPEN
    *   OBJECT_SELECT
    *   PARAGRAPH_BREAK
    *   SEARCH_HIT
    *   SEARCH_MISS
    *   SECTION
    *   TASK_SUCCESS
    *   WRAP
    *   WRAP_EDGE
    * This list may expand over time.
    */
   cvox.Api.playEarcon = function(earcon) {
     if (!cvox.Api.isChromeVoxActive()) {
       return;
     }
     if (implementation_) {
       implementation_.playEarcon(earcon);
     } else {
       var message = {
         'cmd': 'playEarcon',
         'args': [earcon]
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Synchronizes ChromeVox's internal cursor to the targetNode.
    * Note that this will NOT trigger reading unless given the
    * optional argument; it is for setting the internal ChromeVox
    * cursor so that when the user resumes reading, they will be
    * starting from a reasonable position.
    *
    * @param {Node} targetNode The node that ChromeVox should be synced to.
    * @param {boolean=} speakNode If true, speaks out the node.
    */
   cvox.Api.syncToNode = function(targetNode, speakNode) {
     if (!cvox.Api.isChromeVoxActive() || !targetNode) {
       return;
     }

     if (implementation_) {
       implementation_.syncToNode(targetNode, speakNode);
     } else {
       var message = {
         'cmd': 'syncToNodeRef',
         'args': [cvox.ApiUtils.makeNodeReference(targetNode), speakNode]
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Retrieves the current node and calls the given callback function with it.
    *
    * @param {Function} callback The function to be called.
    */
   cvox.Api.getCurrentNode = function(callback) {
     if (!cvox.Api.isChromeVoxActive() || !callback) {
       return;
     }

     if (implementation_) {
       callback(cvox.ChromeVox.navigationManager.getCurrentNode());
     } else {
       callAsync_({'cmd': 'getCurrentNode'}, function(response) {
         callback(cvox.ApiUtils.getNodeFromRef(response['currentNode']));
       });
     }
   };

   /**
    * Specifies how the targetNode should be spoken using an array of
    * NodeDescriptions.
    *
    * @param {Node} targetNode The node that the NodeDescriptions should be
    * spoken using the given NodeDescriptions.
    * @param {Array.<Object>} nodeDescriptions The Array of
    * NodeDescriptions for the given node.
    */
   cvox.Api.setSpeechForNode = function(targetNode, nodeDescriptions) {
     if (!cvox.Api.isChromeVoxActive() || !targetNode || !nodeDescriptions) {
       return;
     }
     targetNode.setAttribute('cvoxnodedesc', JSON.stringify(nodeDescriptions));
   };

   /**
    * Simulate a click on an element.
    *
    * @param {Element} targetElement The element that should be clicked.
    * @param {boolean} shiftKey Specifies if shift is held down.
    */
   cvox.Api.click = function(targetElement, shiftKey) {
     if (!cvox.Api.isChromeVoxActive() || !targetElement) {
       return;
     }

     if (implementation_) {
       cvox.DomUtil.clickElem(targetElement, shiftKey, true);
     } else {
       var message = {
         'cmd': 'clickNodeRef',
         'args': [cvox.ApiUtils.makeNodeReference(targetElement), shiftKey]
       };
       channel_.port1.postMessage(JSON.stringify(message));
     }
   };

   /**
    * Returns the build info.
    *
    * @param {function(string)} callback Function to receive the build info.
    */
   cvox.Api.getBuild = function(callback) {
     if (!cvox.Api.isChromeVoxActive() || !callback) {
       return;
     }
     if (implementation_) {
       callback(cvox.BuildInfo.build);
     } else {
       callAsync_({'cmd': 'getBuild'}, function(response) {
           callback(response['build']);
       });
     }
   };

   /**
    * Returns the ChromeVox version, a string of the form 'x.y.z',
    * like '1.18.0'.
    *
    * @param {function(string)} callback Function to receive the version.
    */
   cvox.Api.getVersion = function(callback) {
     if (!cvox.Api.isChromeVoxActive() || !callback) {
       return;
     }
     if (implementation_) {
       callback(cvox.ChromeVox.version + '');
     } else {
       callAsync_({'cmd': 'getVersion'}, function(response) {
           callback(response['version']);
       });
     }
   };

   cvox.Api.internalEnable();

   // TODO (sorge) This functions should only be redefined if
   // they do not yet already exist.
   /*
    * Utility functions. Should these be part of the API?
    * @constructor
    */
   cvox.XpathUtil = function() {
   };

   /**
    * Mapping for some default namespaces.
    * @const
    * @private
    */
   cvox.XpathUtil.nameSpaces_ = {
     'xhtml' : 'http://www.w3.org/1999/xhtml',
     'mathml': 'http://www.w3.org/1998/Math/MathML'
   };


   /**
    * Resolve some default name spaces.
    * @param {string} prefix Namespace prefix.
    * @return {string} The corresponding namespace URI.
    */
   cvox.XpathUtil.resolveNameSpace = function(prefix) {
     return cvox.XpathUtil.nameSpaces_[prefix] || null;
   };


   /**
    * Given an XPath expression and rootNode, it returns an array of
    * children nodes that match. The code for this function was taken
    * from Mihai Parparita's GMail Macros Greasemonkey Script.
    * http://gmail-greasemonkey.googlecode.com/svn/trunk/scripts/gmail-new-macros.user.js
    * @param {string} expression The XPath expression to evaluate.
    * @param {Node} rootNode The HTML node to start evaluating the XPath from.
    * @return {Array} The array of children nodes that match.
    */
   cvox.XpathUtil.evalXPath = function(expression, rootNode) {
     try {
       var xpathIterator = rootNode.ownerDocument.evaluate(
           expression,
           rootNode,
           cvox.XpathUtil.resolveNameSpace,
           XPathResult.ORDERED_NODE_ITERATOR_TYPE,
           null); // no existing results
     } catch (err) {
       return [];
     }
     var results = [];
     // Convert result to JS array
     for (var xpathNode = xpathIterator.iterateNext();
          xpathNode;
          xpathNode = xpathIterator.iterateNext()) {
       results.push(xpathNode);
     }
     return results;
   };

   /**
    * NodeDescription
    * Data structure for holding information on how to speak a particular node.
    * NodeDescriptions will be converted into NavDescriptions for ChromeVox.
    *
    * The string data is separated into context, text, userValue, and annotation
    * to enable ChromeVox to speak each of these with the voice settings that
    * are consistent with how ChromeVox normally presents information about
    * nodes to users.
    *
    * @param {string} context Contextual information that the user should
    * hear first which is not part of main content itself. For example,
    * the user/date of a given post.
    * @param {string} text The main content of the node.
    * @param {string} userValue Anything that the user has entered.
    * @param {string} annotation The role and state of the object.
    */
   // TODO (clchen, deboer): Put NodeDescription into externs for developers
   // building ChromeVox extensions.
   cvox.NodeDescription = function(context, text, userValue, annotation) {
     this.context = context ? context : '';
     this.text = text ? text : '';
     this.userValue = userValue ? userValue : '';
     this.annotation = annotation ? annotation : '';
   };
})();