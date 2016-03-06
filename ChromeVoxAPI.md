# ChromeVox API #

The ChromeVox API allows web applications to interact with ChromeVox in order to provide smoother, richer auditory user interfaces.

These APIs allow web developers to make ChromeVox speak custom messages, play earcons, and set ChromeVox's internal reading position.


# Details #

The following JavaScript methods are available:

---

> ### cvox.Api.speak(textString, queueMode, properties) ###
> > Speaks the given string using the specified queueMode and properties.

  * **textString**  The string of text to be spoken.

  * **queueMode**   Valid modes are 0 for flush; 1 for queue.

  * **properties**  Speech properties to use for this utterance.

---


> ### cvox.Api.stop() ###
> > Stops speech.

---


> ### cvox.Api.playEarcon(earcon) ###
> > Plays the specified earcon sound.

  * **earcon** An earcon name.

> Valid names are:

> ALERT\_MODAL

> ALERT\_NONMODAL

> BULLET

> BUSY\_PROGRESS\_LOOP

> BUSY\_WORKING\_LOOP

> BUTTON

> CHECK\_OFF

> CHECK\_ON

> COLLAPSED

> EDITABLE\_TEXT

> ELLIPSIS

> EXPANDED

> FONT\_CHANGE

> INVALID\_KEYPRESS

> LINK

> LISTBOX

> LIST\_ITEM

> NEW\_MAIL

> OBJECT\_CLOSE

> OBJECT\_DELETE

> OBJECT\_DESELECT

> OBJECT\_OPEN

> OBJECT\_SELECT

> PARAGRAPH\_BREAK

> SEARCH\_HIT

> SEARCH\_MISS

> SECTION

> TASK\_SUCCESS

> WRAP

> WRAP\_EDGE

---

> ### cvox.Api.syncToNode(targetNode) ###
> > Synchronizes ChromeVox's internal cursor to the targetNode.


> Note that this will NOT trigger reading; it is only for setting the internal ChromeVox cursor so that when the user resumes reading, they will be starting from a reasonable position.

  * **targetNode**  The node that ChromeVox should be synced to.

---


[The JS file that defines the ChromeVox API can be found here.](http://code.google.com/p/google-axs-chrome/source/browse/trunk/chromevox/chromevox/injected/api.js)