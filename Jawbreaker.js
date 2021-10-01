var jawbreaker = {};

const COLORS = {
  0: 'empty',
  1: 'red',
  2: 'blue',
  3: 'green',
  4: 'orange'
};

/**
 * Circle representation of jawbreaker
 * @this{jawbreaker.Circle}
 * @param {number} color number of color.
 */
jawbreaker.Circle = function(color) {
  this.color = color;
};

/**
 * start new game by creating random colored circles
 * @param {number} width width of table.
 * @param {number} height height of table.
 * @param {number} colors number of different colors in game.
 */
jawbreaker.newGame = function(width, height, colors) {
  //create the new circles table array
  jawbreaker.circleTable = [];
  jawbreaker.score = 0;
  jawbreaker.colors = colors;
  for (var i = 0; i < width; ++i) {
    jawbreaker.circleTable.push([]);
    for (var j = 0; j < height; ++j) {

      //assign random balls (1 to 5) to each cell
      var newcircle = new jawbreaker.Circle(Math.floor(
          Math.random() * colors) + 1);
      jawbreaker.circleTable[i].push(newcircle);
    }
  }
};

/**
 * return the string of enum color
 * @param {number} color number representation of color.
 * @return {string} string representation of color.
 */
jawbreaker.getColorString = function(color) {
  return COLORS[color];
};

/**
 * draw the updated circles as table
 */
jawbreaker.draw = function() {
  jawbreaker.table = document.getElementById('gametable');

  //clear table
  while (jawbreaker.table.hasChildNodes()) {
     jawbreaker.table.removeChild(jawbreaker.table.firstChild);

  }
  jawbreaker.tableCell = [];
  for (var i = 0; i < jawbreaker.circleTable.length; ++i) {

    //create each row
    var row = document.createElement('tr');
    row.className = 'gamerow';
    row.setAttribute('rowIndex', i);
    jawbreaker.tableCell[i] = [];
    for (var j = 0; j < jawbreaker.circleTable[i].length; ++j) {

      //draw each circle by adding circle class name defined in html and
      //color to its class name again defined in html
      var cell = document.createElement('td');
      var cellDiv = document.createElement('div');

      cellDiv.className = 'circle';
      cellDiv.className += ' ' + jawbreaker.getColorString(
          jawbreaker.circleTable[i][j].color);

      cell.appendChild(cellDiv);

      row.appendChild(cell);
      jawbreaker.tableCell[i][j] = cell;
    }
    jawbreaker.table.appendChild(row);
  }

  //write the score on bottom
  document.getElementById('score').textContent = 'Score: ' + jawbreaker.score;
};


/**
 * selecting ball by recursively selecting adjacent balls with same
 * color. does not physically change the game state and selects maybe reverted
 * by calling jawbreaker.popOrDeselect(false), balls are popped when called
 * jawbreaker.popOrDeselect(true)
 * @param {Object} coord coordinates to select.
 * @return {number} the number of selected balls.
 */
jawbreaker.selectBalls = function(coord) {

  //select balls by recursively calling select on same color adjacent balls
  //and tagging as selected (depth first search)
  var selectRecursively = function(coord) {
    var selectedCount = 0;

    var circle = jawbreaker.circleTable[coord.x][coord.y];
    if (circle.selected || color == 0) {return 0; }
    circle.selected = true;

    var color = circle.color;

    if (color != 0) {
      selectedCount++;

      var adjacents = jawbreaker.getAdjacent(coord);
      for (var i in adjacents) {
        var adjCoord = adjacents[i];

        if (jawbreaker.circleTable[adjCoord.x][adjCoord.y].color == color) {

          selectedCount += selectRecursively(adjCoord);
        }
      }
    }

    return selectedCount;
  };

  jawbreaker.selected = selectRecursively(coord);

  //if only one ball is selectable deselect the ball
  if (jawbreaker.selected <= 1) {

    jawbreaker.popOrDeselect(false);
  }
  return jawbreaker.selected;
};



/**
 * drop the balls above the popped balls so they displace 'empty' balls
 */
jawbreaker.dropBalls = function() {

  for (var i = jawbreaker.circleTable.length - 1; i > 0; --i) {
    for (var j = 0; j < jawbreaker.circleTable.length; ++j) {
      var circle = jawbreaker.circleTable[i][j];
      var drop = 0;
      //find how many lines to drop
      while (circle.color == 0 && i - drop - 1 >= 0) {
        ++drop;
        circle.color = jawbreaker.circleTable[i - drop][j].color;
        jawbreaker.circleTable[i - drop][j].color = 0;
      }
    }
  }
};

/**
 * get rid of totally empty column by moving the column to the right of empty
 * column to left
 */
jawbreaker.dropColumns = function() {

  //find right most non-empty column
  var bottomRow = jawbreaker.circleTable[jawbreaker.circleTable.length - 1];
  for (var maxCol = jawbreaker.circleTable[0].length - 1;
      (bottomRow[maxCol].color == 0) && (maxCol > 0); --maxCol);

  for (var i = 0; i < maxCol; ++i) {
    //if lowest row is empty delete column
    if (bottomRow[i].color == 0) {
      //slide the columns on the column to be deleted (creates a copy of last
      //column)
      for (var j = i; j < jawbreaker.circleTable.length - 1; ++j) {
        for (var k = 0; k < jawbreaker.circleTable.length; ++k) {
          jawbreaker.circleTable[k][j] = jawbreaker.circleTable[k][j + 1];
        }
      }
      //set the copy of last column as 0
      for (var j = 0; j < jawbreaker.circleTable.length; ++j) {
        jawbreaker.circleTable[j][bottomRow.length - 1].color = 0;
      }

      i--;
      maxCol--;
    }
  }
};


/**
 * cleans up temporary visible state and commits or reverts pops
 * @param {boolean} pop if pops should be committed.
 */
jawbreaker.popOrDeselect = function(pop) {

  //sets color as empty if balls are selected and if pop is enabled
  for (var i = 0; i < jawbreaker.circleTable.length; ++i) {
    for (var j = 0; j < jawbreaker.circleTable[0].length; ++j) {
      if (jawbreaker.circleTable[i][j].selected && pop) {
        jawbreaker.circleTable[i][j].color = 0;
      }
      jawbreaker.circleTable[i][j].selected = false;
    }
  }
  jawbreaker.selected = 0;
};


/**
 * gets the adjacent available coordinates
 * @param {Object} coord the coordinates.
 * @return {Object} coordinates of adjacent balls.
 */
jawbreaker.getAdjacent = function(coord) {
  var adjacents = {};
  if (coord.x > 0) {
    adjacents.left = {x: coord.x - 1, y: coord.y};
  }
  if (coord.y > 0) {
    adjacents.down = {x: coord.x, y: coord.y - 1};
  }
  if (coord.x < jawbreaker.circleTable.length - 1) {
    adjacents.right = {x: coord.x + 1, y: coord.y};
  }
  if (coord.y < jawbreaker.circleTable[0].length - 1) {
    adjacents.up = {x: coord.x, y: coord.y + 1};
  }

  return adjacents;
};


/**
 * check if no balls are poppable, in which case game is over
 * @return {boolean} is game over.
 */
jawbreaker.checkGameover = function() {

  for (var i = 0; i < jawbreaker.circleTable.length; ++i) {
    for (var j = 0; j < jawbreaker.circleTable[0].length; ++j) {
      //try selecting balls from all combinations
      jawbreaker.popOrDeselect(false);
      if (jawbreaker.selectBalls({x: i, y: j}) > 1) {
        return false;
      }

    }
  }
  jawbreaker.gameOver = true;
  return true;
};

/**
 * physically pop the ball on the coordinate if possible and update game
 * state
 * @param {Object} coord coordinates to pop ball on.
 * @return {Object} game status.
 */
jawbreaker.popBall = function(coord) {
  var popCount = jawbreaker.selected;
  jawbreaker.popOrDeselect(true);
  jawbreaker.dropBalls();
  jawbreaker.dropColumns();
  jawbreaker.score += popCount * (popCount - 1);
  jawbreaker.draw();

  var gameOver = jawbreaker.checkGameover();
  var status = {
    popCount: popCount,
    gameOver: gameOver
  };
  return status;
};

/** count the number of each colored ball
 * @return {Object} count of each color.
 */
jawbreaker.countBalls = function() {
  var ballCount = new Array();
  for (var i = 0; i < jawbreaker.colors; ++i) {
    ballCount.push(0);
  }

  for (var i = 0; i < jawbreaker.circleTable.length; ++i) {
    for (var j = 0; j < jawbreaker.circleTable[0].length; ++j) {
      var color = jawbreaker.circleTable[i][j].color;
      if (color != 0) {
        ballCount[color - 1]++;
      }

    }
  }
  return ballCount;
};

/**
 * gets coordinates of current focused ball
 * @return {Object} focus coordiantes.
 */
jawbreaker.getCurrentFocus = function() {
  var focusCoord = {
    x: jawbreaker.currFocus[1],
    y: jawbreaker.currFocus[0]
  };
  return focusCoord;
};

/**
 * key down event to play game with keyboard.
 * adds support for scrolling with arrow keys, slash to read current location
 * and disable key press with game over
 * @param {Event} evt on key down event.
 * @return {boolean} supress keydown.
 */
jawbreaker.onKeydown = function(evt) {


  if (jawbreaker.gameOver) {
    cvox.Api.speak('game over. your final score is ' + jawbreaker.score +
        '. refresh page to play a new game');
    return false;
  }
  var nodeDescs = [];

  switch (evt.keyCode) {
    //select/pop with space
    case 32:

      if (!jawbreaker.selected) {
        jawbreaker.accessibleSelectBall(jawbreaker.getCurrentFocus());
      } else {

        nodeDescs.push(jawbreaker.accessiblePopBall(
            jawbreaker.getCurrentFocus()));
        nodeDescs.push(jawbreaker.accessibleHover(
            jawbreaker.getCurrentFocus()));
        var focusedCell = jawbreaker.tableCell[
            jawbreaker.getCurrentFocus().x][jawbreaker.getCurrentFocus().y];
          jawbreaker.speakElement(focusedCell, nodeDescs);
      }
      break;
    //up arrow key
    case 38:

      jawbreaker.currFocus[1]--;
      if (jawbreaker.currFocus[1] < 0) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[1] = 0;
      }

      break;

    //j key
    case 75:
      jawbreaker.currFocus[1]--;
      if (jawbreaker.currFocus[1] < 0) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[1] = 0;
      }
      break;

    //down arrow key
    case 40:
      jawbreaker.currFocus[1]++;
      if (jawbreaker.currFocus[1] >= jawbreaker.circleTable.length) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[1] = jawbreaker.circleTable.length - 1;
      }
      break;

    //k key
    case 74:
      jawbreaker.currFocus[1]++;
      if (jawbreaker.currFocus[1] >= jawbreaker.circleTable.length) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[1] = jawbreaker.circleTable.length - 1;
      }
      break;

    //left arrow key
    case 37:
      jawbreaker.currFocus[0]--;
      if (jawbreaker.currFocus[0] < 0) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[0] = 0;
      }
      break;

    //h key
    case 72:
      jawbreaker.currFocus[0]--;
      if (jawbreaker.currFocus[0] < 0) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[0] = 0;
      }
      break;

    //right arrow key
    case 39:
      jawbreaker.currFocus[0]++;
      if (jawbreaker.currFocus[0] == jawbreaker.circleTable[0].length) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[0] = jawbreaker.circleTable[0].length - 1;
      }
      break;

    //l key
    case 76:
      jawbreaker.currFocus[0]++;
      if (jawbreaker.currFocus[0] == jawbreaker.circleTable[0].length) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
        jawbreaker.currFocus[0] = jawbreaker.circleTable[0].length - 1;
      }
      break;

    //a key, go to left edge
    case 65:
      if (jawbreaker.currFocus[0] == 0) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
      }
      jawbreaker.currFocus[0] = 0;
      break;

    //e key, go to right edge
    case 69:
      var currentRow = jawbreaker.circleTable[jawbreaker.currFocus[1]];

      //find the first top ball of the current column
      var findAvailableSide = function() {
        for (var firstSpace = jawbreaker.circleTable[0].length - 1;
            firstSpace >= 0 && currentRow[firstSpace].color == 0;
            --firstSpace);
        return firstSpace;
      };
      var newFocus = findAvailableSide();
      if (jawbreaker.currFocus[0] == newFocus) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
      }
      jawbreaker.currFocus[0] = newFocus;
      break;

    // t key go to top
    case 84:
      var currColumn = jawbreaker.currFocus[0];
      var findAvailableTop = function() {
        for (var firstSpace = jawbreaker.circleTable.length - 1;
            firstSpace >= 0 &&
            (jawbreaker.circleTable[firstSpace][currColumn].color != 0);
            --firstSpace);
        return (firstSpace + 1);
      };
      var newFocus = findAvailableTop();
      if (jawbreaker.currFocus[1] == newFocus) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
      }
      jawbreaker.currFocus[1] = newFocus;
      break;

    // b key go bottom
    case 66:
      if (jawbreaker.currFocus[1] == jawbreaker.circleTable[0].length - 1) {
        cvox.Api.playEarcon('INVALID_KEYPRESS');
      }
      jawbreaker.currFocus[1] = jawbreaker.circleTable[0].length - 1;
      break;


    case 82:
      //r key to read row or go to a row
      if (jawbreaker.navigateNumber || jawbreaker.navigateNumber == 0) {
        jawbreaker.currFocus[1] = jawbreaker.navigateNumber;

        //add description of the row to go to
        nodeDescs.push(new cvox.NodeDescription(
          '', 'row ' + jawbreaker.navigateNumber, '', ''));

        //move to row and add description of new ball
        nodeDescs.push(
            jawbreaker.accessibleHover(jawbreaker.getCurrentFocus()));

        //speak ball description
        var x = jawbreaker.getCurrentFocus().x;
        var y = jawbreaker.getCurrentFocus().y;
        var focusedCell = jawbreaker.tableCell[x][y];
        jawbreaker.speakElement(focusedCell, nodeDescs);
        jawbreaker.navigateNumber = undefined;
      } else {

        jawbreaker.speakCurrentRow(jawbreaker.getCurrentFocus());
      }
      break;

    case 67:
      //c key to read column or go to a column
      if (jawbreaker.navigateNumber || jawbreaker.navigateNumber == 0) {
        jawbreaker.currFocus[0] = jawbreaker.navigateNumber;
        //add description of the column to go to
        nodeDescs.push(new cvox.NodeDescription(
          '', 'column ' + jawbreaker.navigateNumber, '', ''));

        //move to column and add description of new ball
        nodeDescs.push(
            jawbreaker.accessibleHover(jawbreaker.getCurrentFocus()));

        //speak ball description
        var x = jawbreaker.getCurrentFocus().x;
        var y = jawbreaker.getCurrentFocus().y;

        var focusedCell = jawbreaker.tableCell[x][y];
        jawbreaker.speakElement(focusedCell, nodeDescs);
        jawbreaker.navigateNumber = undefined;
      } else {

        jawbreaker.speakCurrentColumn(jawbreaker.getCurrentFocus());
      }
      break;

    // = key count balls
    case 187:
      var ballCount = jawbreaker.countBalls();
      cvox.Api.speak('score: ' + jawbreaker.score + '. ' + ballCount[0] +
        ' red balls, ' + ballCount[1] + ' blue balls, ' + ballCount[2] +
        ' green balls, ' + ballCount[3] + ' orange balls.');
      break;
    // slash key
    case 191:
      cvox.Api.speak('On: ' + jawbreaker.currFocus[0] + ', ' +
          jawbreaker.currFocus[1]);
      break;
  }

  //if any navigation key(up, down, left, right, a, e, t, b) is pressed
  //hover over the new ball and speak it
  if ([37, 38, 39, 40, 72, 74, 75, 76, 65, 69, 84,
      66].indexOf(evt.keyCode) != -1) {
    nodeDescs.push(jawbreaker.accessibleHover(jawbreaker.getCurrentFocus()));
    if ([37, 38, 39, 40, 72, 74, 75, 76, 65, 69, 84,
        66].indexOf(evt.keyCode) != -1) {
      var focusedCell = jawbreaker.tableCell[
          jawbreaker.getCurrentFocus().x][jawbreaker.getCurrentFocus().y];
      jawbreaker.speakElement(focusedCell, nodeDescs);
    }

  //if a number is pressed save the number to navigate to that row or column if
  // r or c is pressed next
  } else if ([48, 49, 50, 51, 52, 53, 54, 55, 56, 57].indexOf(
        evt.keyCode) != -1) {
    jawbreaker.navigateNumber = evt.keyCode - 48;
  }


  return false;
};

/** hover with audio feedback
 * @param {Object} coord coordinates to hover over.
 * @return {cvox.NodeDescription} node description of hover.
 */
jawbreaker.accessibleHover = function(coord) {
  if (jawbreaker.selected) {
    cvox.Api.playEarcon('OBJECT_DESELECT');
  }
  jawbreaker.popOrDeselect(false); //deselect
  var speechString = '';
  var focusedCircle = jawbreaker.circleTable[coord.x][coord.y];
  speechString = coord.x + ' ' + coord.y;
  speechString += jawbreaker.getColorString(focusedCircle.color) + '. ';

  return new cvox.NodeDescription('', speechString, '', '');
};

/** select ball with accessible feedback
 * @param {Object} coord coordinates of ball to select.
 */
jawbreaker.accessibleSelectBall = function(coord) {

  var speechString = '';
  var focusedCircle = jawbreaker.circleTable[coord.x][coord.y];
  var color = '';

  //read select color

  color = jawbreaker.getColorString(focusedCircle.color);

  if (color == 'empty') {
    cvox.Api.playEarcon('INVALID_KEYPRESS');
    speechString = 'cant select empty';
  } else {
    var selected = jawbreaker.selectBalls(coord);
    if (selected <= 1) {
      cvox.Api.playEarcon('INVALID_KEYPRESS');
      speechString += ' cant select one ball';
    } else {
      cvox.Api.playEarcon('OBJECT_SELECT');
      speechString += 'selected ' + selected + ' ' + color + ' balls';
    }
  }

  cvox.Api.speak(speechString);

};

/** pop ball with accessible feedback
 * @param {Object} coord coordinates of ball to pop.
 * @return {cvox.NodeDescription} node description of pop.
 */
jawbreaker.accessiblePopBall = function(coord) {
  cvox.Api.playEarcon('OBJECT_OPEN');
  var speechString = '';
  var status = jawbreaker.popBall({
    x: coord.x,
    y: coord.y
  });

  //read how many balls popped
  speechString += 'popped ' + status.popCount + ' balls. ';
  if (status.gameOver) {
    speechString += ' game over. your final score is ' + jawbreaker.score +
        '. refresh page to play a new game';
  } else {
    speechString += 'New score ' + jawbreaker.score + '. Now on';
  }
  return new cvox.NodeDescription('', speechString, '', '');
};

/** speak current row
 * @param {Object} coord coordinates to speak row from.
 */
jawbreaker.speakCurrentRow = function(coord) {

  //find right most column by checking for empty on bottom row for each column
  var findMaxColumn = function() {
    var bottomRow = jawbreaker.circleTable[jawbreaker.circleTable.length - 1];
    for (var maxCol = jawbreaker.circleTable[0].length - 1;
        bottomRow[maxCol].color == 0 && maxCol > 0; --maxCol);
    return maxCol;
  }

  var maxCol = findMaxColumn();
  var speechString = 'row ' + coord.x;
  for (var i = 0; i <= maxCol; ++i) {
    var focusedCircle = jawbreaker.circleTable[coord.x][i];
    speechString += ' ' + jawbreaker.getColorString(focusedCircle.color);

  }

  cvox.Api.speak(speechString);
};

/** speak current column
 * @param {Object} coord coordinates to speak column from.
 */
jawbreaker.speakCurrentColumn = function(coord) {
  var speechString = 'column ' + coord.y;
  for (var i = 0; i < jawbreaker.circleTable[0].length; ++i) {
    var focusedCircle = jawbreaker.circleTable[i][coord.y];
    speechString += ' ' + jawbreaker.getColorString(focusedCircle.color);

  }

  cvox.Api.speak(speechString);
};

/**
 * bind the HTML element with its node descriptions and focus on node
 * @param {HTMLElement} node node to focus on.
 * @param {Array<cvox.NodeDescription>} nodeDescs node description array.
 */
jawbreaker.speakElement = function(node, nodeDescs) {

  cvox.Api.setSpeechForNode(node, nodeDescs);
  document.body.focus();
  node.setAttribute('tabindex', -1);
  node.focus();
  cvox.Api.syncToNode(node);
};

/**
 * set up jawbreaker
 * @return {Object} nothing.
 */
jawbreaker.init = function() {

  if (!document.body || !window.cvox) {
    window.setTimeout(jawbreaker.init, 100);
    return;
  }

  if (jawbreaker.ready) {
    return;
  }

  //describe the game instructions

  cvox.Api.speak('Welcome to Accessible Jawbreaker. board size is 10 by 10. ' +
    'use arrow keys or h-j-k-l to navigate on balls, hit space to select and ' +
    'hit again to pop, press r  to read the current row, ' +
    'press c to read the current column, enter number and hit r or c to ' +
    'fast navigate to row or column, press t to go top, b to ' +
    'bottom a to go left, e to go right');
  const WIDTH = 10;
  const HEIGHT = 10;
  const COLOR = 4;

  jawbreaker.newGame(WIDTH, HEIGHT, COLOR);
  jawbreaker.draw();
  jawbreaker.ready = true;
  jawbreaker.currFocus = [0, 0];
};


document.addEventListener('load', jawbreaker.init, true);
document.addEventListener('click', jawbreaker.onClick, true);
document.addEventListener('keydown', jawbreaker.onKeydown, true);
