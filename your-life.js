/**
 * Interactive form and chart events / logic.
 */
(function () {
  var yearEl = document.getElementById('year'),
    monthEl = document.getElementById('month'),
    dayEl = document.getElementById('day'),
    currentYearEl = document.getElementById('current-year'),
    currentMonthEl = document.getElementById('current-month'),
    currentDayEl = document.getElementById('current-day'),
    maleLifespanEl = document.getElementById('male-lifespan'),
    femaleLifespanEl = document.getElementById('female-lifespan'),
    maleDiseaseEl = document.getElementById('male-disease'),
    femaleDiseaseEl = document.getElementById('female-disease'),
    unitboxEl = document.getElementById('unitbox'),
    unitText = document.querySelector('.unitbox-label').textContent.toLowerCase(),
    items = document.querySelectorAll('.chart li'),
    itemCount,
    KEY = {
      UP: 38,
      DOWN: 40
    };

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  yearEl.addEventListener('input', _handleDateChange);
  yearEl.addEventListener('keydown', _handleUpdown);
  yearEl.addEventListener('blur', _unhideValidationStyles);
  monthEl.addEventListener('change', _handleDateChange);
  monthEl.addEventListener('keydown', _handleUpdown);
  dayEl.addEventListener('input', _handleDateChange);
  dayEl.addEventListener('blur', _unhideValidationStyles);
  dayEl.addEventListener('keydown', _handleUpdown);

  // Current date inputs
  currentYearEl.addEventListener('input', _handleDateChange);
  currentMonthEl.addEventListener('change', _handleDateChange);
  currentDayEl.addEventListener('input', _handleDateChange);

  // Life parameter inputs
  maleLifespanEl.addEventListener('input', _handleDateChange);
  femaleLifespanEl.addEventListener('input', _handleDateChange);
  maleDiseaseEl.addEventListener('input', _handleDateChange);
  femaleDiseaseEl.addEventListener('input', _handleDateChange);

  // Set default current date
  var now = new Date();
  currentYearEl.value = now.getFullYear();
  currentMonthEl.value = now.getMonth();
  currentDayEl.value = now.getDate();

  // Ensure the month is unselected by default.
  monthEl.selectedIndex = -1;

  // Load default values
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e) {
    window.location = '' + e.currentTarget.value + '.html';
  }

  function _handleDateChange(e) {
    // Save date of birth in local storage
    localStorage.setItem("DOB", JSON.stringify({
      month: monthEl.value,
      year: yearEl.value,
      day: dayEl.value
    }));

    if (_dateIsValid()) {
      itemCount = calculateElapsedTime();
      _repaintItems(itemCount);
    } else {
      _repaintItems(0);
    }
  }

  function _handleUpdown(e) {
    var newNum;
    // A crossbrowser keycode option.
    thisKey = e.keyCode || e.which;
    if (e.target.checkValidity()) {
      if (thisKey === KEY.UP) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum += 1;
        // we call the date change function manually because the input event isn't
        // triggered by arrow keys, or by manually setting the value, as we've done.
        _handleDateChange();
      } else if (thisKey === KEY.DOWN) {
        newNum = parseInt(e.target.value, 10);
        e.target.value = newNum -= 1;
        _handleDateChange();
      }
    }
  }

  function _unhideValidationStyles(e) {
    e.target.classList.add('touched');
  }

  function calculateElapsedTime() {
    var currentDate = _getCurrentDate(),
      dateOfBirth = _getDateOfBirth(),
      diff = currentDate.getTime() - dateOfBirth.getTime(),
      elapsedTime;

    switch (unitText) {
      case 'weeks':
        // Measuring weeks is tricky since our chart shows 52 weeks per year (for simplicity)
        // when the actual number of weeks per year is 52.143. Attempting to calculate weeks
        // with a diffing strategy will result in build-up over time. Instead, we'll add up
        // 52 per elapsed full year, and only diff the weeks on the current partial year.
        var elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        var isThisYearsBirthdayPassed = (currentDate.getTime() > new Date(currentDate.getUTCFullYear(), monthEl.value, dayEl.value).getTime());
        var birthdayYearOffset = isThisYearsBirthdayPassed ? 0 : 1;
        var dateOfLastBirthday = new Date(currentDate.getUTCFullYear() - birthdayYearOffset, monthEl.value, dayEl.value);
        var elapsedDaysSinceLastBirthday = Math.floor((currentDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        var elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        // Months are tricky, being variable length, so I opted for the average number
        // of days in a month as a close-enough approximation (30.4375). This can make
        // the chart look off by a day when you're right on the month threshold, but
        // it's otherwise fairly accurate over long periods of time.
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        // We can represent our millisecond diff as a year and subtract 1970 to
        // end up with an accurate elapsed time. To see why, consider the following:
        //
        //   1. JavaScript's Date timestamp represents milliseconds since 1970. Thus,
        //      new Date(0).toUTCString() → 'Thu, 01 Jan 1970 00:00:00 GMT'
        //   2. Picture the diff between today and tomorrow. It's a small number. A
        //      newly created date with that number would result in January 2 1970.
        //   3. Thus, subtracting 1970 from that date gives us elapsed time. We use
        //      UTC because otherwise we'd need to offset "1970" by our timezone.
        //
        // See more details here: https://stackoverflow.com/a/24181701/1154642
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid() {
    return monthEl.checkValidity() && dayEl.checkValidity() && yearEl.checkValidity() &&
           currentMonthEl.checkValidity() && currentDayEl.checkValidity() && currentYearEl.checkValidity();
  }

  function _getDateOfBirth() {
    return new Date(yearEl.value, monthEl.value, dayEl.value);
  }

  function _getCurrentDate() {
    return new Date(currentYearEl.value, currentMonthEl.value, currentDayEl.value);
  }

  function _repaintItems(livedCount) {
    var maleLifespan = parseFloat(maleLifespanEl.value);
    var femaleLifespan = parseFloat(femaleLifespanEl.value);
    var maleDiseaseOnset = parseFloat(maleDiseaseEl.value);
    var femaleDiseaseOnset = parseFloat(femaleDiseaseEl.value);
    
    // Convert lifespans and disease onsets to units (weeks/months/years)
    var maleUnits, femaleUnits, maleDiseaseUnits, femaleDiseaseUnits;
    switch (unitText) {
      case 'weeks':
        maleUnits = Math.floor(maleLifespan * 52);
        femaleUnits = Math.floor(femaleLifespan * 52);
        maleDiseaseUnits = Math.floor(maleDiseaseOnset * 52);
        femaleDiseaseUnits = Math.floor(femaleDiseaseOnset * 52);
        break;
      case 'months':
        maleUnits = Math.floor(maleLifespan * 12);
        femaleUnits = Math.floor(femaleLifespan * 12);
        maleDiseaseUnits = Math.floor(maleDiseaseOnset * 12);
        femaleDiseaseUnits = Math.floor(femaleDiseaseOnset * 12);
        break;
      case 'years':
        maleUnits = Math.floor(maleLifespan);
        femaleUnits = Math.floor(femaleLifespan);
        maleDiseaseUnits = Math.floor(maleDiseaseOnset);
        femaleDiseaseUnits = Math.floor(femaleDiseaseOnset);
        break;
    }

    // Find the earlier and later disease onset
    var earlierDiseaseUnits = Math.min(maleDiseaseUnits, femaleDiseaseUnits);
    var laterDiseaseUnits = Math.max(maleDiseaseUnits, femaleDiseaseUnits);
    var earlierLifeUnits = Math.min(maleUnits, femaleUnits);
    var laterLifeUnits = Math.max(maleUnits, femaleUnits);

    for (var i = 0; i < items.length; i++) {
      // Remove all existing classes first
      items[i].classList.remove('lived', 'healthy', 'chronic', 'female-extra');
      
      if (i < livedCount) {
        items[i].classList.add('lived');
      } else if (i < earlierDiseaseUnits) {
        items[i].classList.add('healthy');
      } else if (i < laterDiseaseUnits) {
        items[i].classList.add('female-extra');
      } else if (i < earlierLifeUnits) {
        items[i].classList.add('chronic');
      } else if (i < laterLifeUnits) {
        items[i].classList.add('female-extra');
      }
    }
  }

  function _loadStoredValueOfDOB() {
    var DOB = JSON.parse(localStorage.getItem('DOB'));

    if (!DOB) {
      return;
    }

    if (DOB.month >= 0 && DOB.month < 12) {
      monthEl.value = DOB.month
    }

    if (DOB.year) {
      yearEl.value = DOB.year
    }

    if (DOB.day > 0 && DOB.day < 32) {
      dayEl.value = DOB.day
    }
    _handleDateChange();
  }

  // Export functionality
  window.exportToImage = function() {
    var chart = document.querySelector('.chart');
    var scale = 2;

    // Temporarily reduce border width for all squares during export
    var squares = chart.querySelectorAll('li');
    var originalBorders = [];
    squares.forEach(function(square, index) {
      originalBorders[index] = square.style.border;
      square.style.border = '0.5px solid black';
    });

    // Get chart position and add padding for absolutely positioned elements
    var chartRect = chart.getBoundingClientRect();
    var padding = 100; // Extra space for axes that extend outside

    // Capture with padding to include axes
    html2canvas(chart, {
      scale: scale,
      backgroundColor: 'white',
      logging: false,
      useCORS: true,
      allowTaint: true,
      x: -padding,
      y: -padding, 
      width: chart.offsetWidth + (padding * 2),
      height: chart.offsetHeight + (padding * 2)
    }).then(function(canvas) {
      // Restore original borders
      squares.forEach(function(square, index) {
        square.style.border = originalBorders[index];
      });

      // Crop the canvas to remove excess white space
      var ctx = canvas.getContext('2d');
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      
      // Find actual content bounds
      var minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      
      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
          var i = (y * canvas.width + x) * 4;
          var r = data[i], g = data[i + 1], b = data[i + 2];
          
          // If pixel is not white (has content)
          if (r < 250 || g < 250 || b < 250) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      // Add small padding around content
      var cropPadding = 20;
      minX = Math.max(0, minX - cropPadding);
      minY = Math.max(0, minY - cropPadding);
      maxX = Math.min(canvas.width, maxX + cropPadding);
      maxY = Math.min(canvas.height, maxY + cropPadding);
      
      // Create cropped canvas
      var croppedCanvas = document.createElement('canvas');
      var croppedCtx = croppedCanvas.getContext('2d');
      croppedCanvas.width = maxX - minX;
      croppedCanvas.height = maxY - minY;
      croppedCtx.fillStyle = 'white';
      croppedCtx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);
      croppedCtx.drawImage(canvas, minX, minY, croppedCanvas.width, croppedCanvas.height, 0, 0, croppedCanvas.width, croppedCanvas.height);

      // Create download link with cropped canvas
      var link = document.createElement('a');
      var filename = 'your-life-' + unitText + '-' + new Date().toISOString().split('T')[0] + '.png';
      
      link.download = filename;
      link.href = croppedCanvas.toDataURL('image/png');
      link.click();
    }).catch(function(error) {
      // Restore borders in case of error
      squares.forEach(function(square, index) {
        square.style.border = originalBorders[index];
      });
      console.error('Export failed:', error);
    });
  };
})();
