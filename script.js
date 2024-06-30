'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = Number(this.date);
  constructor(duration, distance, coords) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }
}

class Cycling extends Workout {
  constructor(duration, distance, coords, elevGain) {
    super(duration, distance, coords);
    this.elevGain = elevGain;
    this.speed = (this.distance / this.duration).toFixed(2);
    this.type = 'Cycling';
    this.emoji = '🚴';
  }
}

class Running extends Workout {
  constructor(duration, distance, coords, cadence) {
    super(duration, distance, coords);
    this.cadence = cadence;
    this.pace = (this.duration / this.distance).toFixed(2);
    this.type = 'Running';
    this.emoji = '🏃';
  }
}

class App {
  #MapEvent;
  #map;
  #workouts = [];
  constructor() {
    this.#getPosition();

    inputType.addEventListener('change', this.#toggleInputType);
    form.addEventListener('submit', this.#newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this.#focusWorkout.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          console.log(this);
          this.#loadMap(position);
        }.bind(this),
        function () {
          alert('Unable to detect your location');
        }
      );
    }
  }

  #loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    this.#map = L.map('map').setView([latitude, longitude], 13);
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Current Location', {
        autoClose: false,
        closeOnClick: false,
      })
      .openPopup();

    this.#displaystorage();

    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(event) {
    this.#MapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #validValueCheck(value) {
    if (Number(value) > 0) {
      return true;
    } else {
      return false;
    }
  }

  #toggleInputType() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #capitalize(string) {
    return string[0].toUpperCase() + string.slice(1, string.length);
  }

  #newWorkout(e) {
    e.preventDefault();
    if (
      this.#validValueCheck(inputDuration.value) &&
      this.#validValueCheck(inputDistance.value) &&
      (this.#validValueCheck(inputCadence.value) ||
        this.#validValueCheck(inputElevation.value))
    ) {
      const workoutType = inputType.value;
      let workout;
      console.log(workoutType);
      if (workoutType === 'running') {
        workout = new Running(
          inputDistance.value,
          inputDuration.value,
          this.#MapEvent.latlng,
          inputCadence.value
        );
      } else if (workoutType === 'cycling') {
        workout = new Cycling(
          inputDistance.value,
          inputDuration.value,
          this.#MapEvent.latlng,
          inputElevation.value
        );
      }
      this.#workouts.push(workout);
      const date = workout.date;
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate();
      const { lat, lng } = this.#MapEvent.latlng;
      var marker = L.marker([lat, lng])
        .addTo(this.#map)
        .bindPopup(
          `${workout.emoji} ${this.#capitalize(
            workoutType
          )} on ${month} ${day}`,
          {
            className: `${workoutType.toLowerCase()}-popup .leaflet-popup-content-wrapper`,
            autoClose: false,
            closeOnClick: false,
          }
        )
        .openPopup();

      this.#map.setView([lat, lng], 13, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
      form.classList.add('hidden');
      const html = `<li class="workout workout--${workoutType.toLowerCase()}" data-id="${
        workout.id
      }">
    <h2 class="workout__title">${this.#capitalize(
      workoutType
    )} on ${month} ${day}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.emoji}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>

    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        workoutType.toLowerCase() === 'running'
          ? `${workout.pace}`
          : `${workout.speed}`
      }</span>
      <span class="workout__unit">${
        workoutType.toLowerCase() === 'running' ? `min/km` : `km/hr`
      }</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${
        workoutType.toLowerCase() === 'running'
          ? `${workout.cadence}`
          : `${workout.elevGain}`
      }</span>
      <span class="workout__unit">${
        workoutType.toLowerCase() === 'running' ? `M` : `SPM`
      }</span>
    </div>
  </li>`;
      form.insertAdjacentHTML('afterend', html);
      this.#setlocalstorage();
    } else {
      alert('Enter valid values please');
    }
  }

  #focusWorkout(event) {
    const workoutEntry = event.target.closest('.workout');

    if (!workoutEntry) return;

    const id = workoutEntry.dataset.id;
    const workout = this.#workouts.find(ele => Number(ele.id) === Number(id));
    const { lat, lng } = workout.coords;
    this.#map.setView([lat, lng], 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setlocalstorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getlocalstorage() {
    return JSON.parse(localStorage.getItem('workouts'));
  }

  #displaystorage() {
    const data = this.#getlocalstorage();
    if (!data) {
      return;
    }
    data.forEach(
      function (workout) {
        const date = new Date(workout.date);
        const month = date.toLocaleString('default', { month: 'long' });
        const day = date.getDate();
        this.#workouts.push(workout);
        const { lat, lng } = workout.coords;
        var marker = L.marker([lat, lng])
          .addTo(this.#map)
          .bindPopup(
            `${workout.emoji} ${this.#capitalize(
              workout.type
            )} on ${month} ${day}`,
            {
              className: `${workout.type.toLowerCase()}-popup .leaflet-popup-content-wrapper`,
              autoClose: false,
              closeOnClick: false,
            }
          )
          .openPopup();

        const html = `<li class="workout workout--${workout.type.toLowerCase()}" data-id="${
          workout.id
        }">
        <h2 class="workout__title">${this.#capitalize(
          workout.type
        )} on ${month} ${day}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.emoji}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${
            workout.type.toLowerCase() === 'running'
              ? `${workout.pace}`
              : `${workout.speed}`
          }</span>
          <span class="workout__unit">${
            workout.type.toLowerCase() === 'running' ? `min/km` : `km/hr`
          }</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${
            workout.type.toLowerCase() === 'running'
              ? `${workout.cadence}`
              : `${workout.elevGain}`
          }</span>
          <span class="workout__unit">${
            workout.type.toLowerCase() === 'running' ? `M` : `SPM`
          }</span>
        </div>
      </li>`;
        form.insertAdjacentHTML('afterend', html);
      }.bind(this)
    );
  }
}

const app = new App();
