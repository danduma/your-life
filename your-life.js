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
    var scale = 2; // Increase this for higher resolution

    // Create a temporary container to properly capture absolutely positioned elements
    var container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = (chart.offsetWidth + 50) + 'px'; // Extra width for the "90" label
    container.style.height = (chart.offsetHeight + 120) + 'px'; // Extra height for x-axis and bottom label
    container.style.paddingTop = '3em'; // Space for x-axis
    container.style.paddingLeft = '3em'; // Space for y-axis
    container.style.paddingBottom = '2em'; // Space for bottom label
    container.style.paddingRight = '2em'; // Space for right label
    container.style.backgroundColor = 'white';

    // Clone the chart and its axis
    var chartClone = chart.cloneNode(true);
    var xAxis = document.querySelector('.x-axis').cloneNode(true);
    var yAxis = document.querySelector('.y-axis').cloneNode(true);

    // Reduce border width for export
    var squares = chartClone.querySelectorAll('li');
    squares.forEach(function(square) {
      square.style.border = '0.5px solid black';
    });

    // Position elements in the container
    chartClone.style.position = 'relative';
    chartClone.style.margin = '0';
    container.appendChild(xAxis);
    container.appendChild(yAxis);
    container.appendChild(chartClone);

    // Temporarily add container to the document
    document.body.appendChild(container);

    // Configure html2canvas
    html2canvas(container, {
      scale: scale,
      backgroundColor: 'white',
      logging: false,
      width: container.offsetWidth,
      height: container.offsetHeight,
      // Ensure we capture all content including absolutely positioned elements
      windowWidth: container.offsetWidth + 100, // Extra space for rendering
      windowHeight: container.offsetHeight + 100 // Extra space for rendering
    }).then(function(canvas) {
      // Create download link
      var link = document.createElement('a');
      var filename = 'your-life-' + unitText + '-' + new Date().toISOString().split('T')[0] + '.png';
      
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Clean up: remove the temporary container
      document.body.removeChild(container);
    });
  };
})();
