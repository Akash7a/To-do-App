document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#timerForm");
    const hour_elem = document.querySelector("#hour_elem");
    const min_elem = document.querySelector("#min_elem");
    const sec_elem = document.querySelector("#sec_elem");
    const timersContainer = document.querySelector("#timers");
    const taskInput = document.querySelector("#task_input");

    let timerId = localStorage.getItem("timerId") ? parseInt(localStorage.getItem("timerId")) : 0;
    let allTasks = JSON.parse(localStorage.getItem("task")) || [];
    const timers = {};
    const remainingTimes = {};

    const createTimerElement = (timerId, taskValue = '') => {
        const timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.id = `timer_${timerId}`;

        const timerTitle = document.createElement('h3');
        timerTitle.textContent = 'Task';

        const timeDisplay = document.createElement('h1');
        timeDisplay.id = `time_display_${timerId}`;
        timeDisplay.textContent = '00:00:00';

        const taskDisplay = document.createElement('p');
        taskDisplay.id = `task_display_${timerId}`;
        taskDisplay.textContent = taskValue;
        taskDisplay.classList.add('task');

        // Complete button
        const checkBtn = document.createElement("i");
        checkBtn.classList.add("bi", "bi-check-circle", "check_btn");

        checkBtn.addEventListener('click', () => {
            taskDisplay.classList.toggle('complete'); // Toggle 'complete' class on taskDisplay
            updateTaskCompletion(timerId, taskDisplay.classList.contains('complete')); // Update task completion in localStorage
        });

        // Pause button
        const pauseBtn = document.createElement("i");
        pauseBtn.classList.add("bi", "bi-pause", "pause_btn");

        pauseBtn.addEventListener("click", () => {
            if (timers[timerId]) {
                // If the timer is running, pause it
                clearInterval(timers[timerId]);
                remainingTimes[timerId] = getTimeFromDisplay(timeDisplay.textContent);
                delete timers[timerId];
                pauseBtn.classList.remove("bi-pause");
                pauseBtn.classList.add("bi-skip-start-circle");
                updatePauseButtonsClass();
            } else {
                // If the timer is paused, resume it
                stopAllTimers(); // Stop any running timers
                const { hours, minutes, seconds } = remainingTimes[timerId] || { hours: 0, minutes: 0, seconds: 0 };
                startTimer(hours, minutes, seconds, timerId);
                pauseBtn.classList.remove("bi-skip-start-circle");
                pauseBtn.classList.add("bi-pause");
            }
        });

        // Cancel button
        const cancelBtn = document.createElement("i");
        cancelBtn.classList.add("bi", "bi-x-circle", "cancel_btn");

        cancelBtn.addEventListener("click", () => {
            deleteTimer(timerId, timerContainer); // Delete the timer
        });

        timerContainer.appendChild(timerTitle);
        timerContainer.appendChild(timeDisplay);
        timerContainer.appendChild(taskDisplay);
        timerContainer.appendChild(checkBtn);
        timerContainer.appendChild(pauseBtn);
        timerContainer.appendChild(cancelBtn);

        timersContainer.appendChild(timerContainer);
    }

    const startTimer = (hours, minutes, seconds, timerId) => {
        stopAllTimers(); // Ensure no other timers are running

        let totalSeconds = hours * 3600 + minutes * 60 + seconds;
        const timeDisplay = document.querySelector(`#time_display_${timerId}`);

        timers[timerId] = setInterval(() => {
            if (totalSeconds <= 0) {
                clearInterval(timers[timerId]);
                delete timers[timerId];
                alert('Time is up!');
                return;
            }

            totalSeconds--;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    const stopAllTimers = () => {
        for (const id in timers) {
            clearInterval(timers[id]);
            delete timers[id];
        }
        updatePauseButtonsClass();
    };

    const updatePauseButtonsClass = () => {
        const allPaused = Object.keys(timers).length === 0;
        const pauseButtons = document.querySelectorAll('.pause_btn');
        pauseButtons.forEach(btn => {
            if (allPaused) {
                btn.classList.remove('bi-pause');
                btn.classList.add('bi-skip-start-circle');
            } else {
                btn.classList.remove('bi-skip-start-circle');
                btn.classList.add('bi-pause');
            }
        });
    };

    const renderSavedTasks = () => {
        allTasks.forEach(task => {
            createTimerElement(task.timerId, task.task);
            // Don't start the timer here, only set remainingTimes
            remainingTimes[task.timerId] = { hours: task.hours, minutes: task.minutes, seconds: task.seconds };
            const timeDisplay = document.querySelector(`#time_display_${task.timerId}`);
            timeDisplay.textContent = `${String(task.hours).padStart(2, '0')}:${String(task.minutes).padStart(2, '0')}:${String(task.seconds).padStart(2, '0')}`;
            if (task.completed) {
                const taskDisplay = document.querySelector(`#task_display_${task.timerId}`);
                taskDisplay.classList.add('complete');
            }
        });
        updatePauseButtonsClass(); // Update the class on page load
    }

    renderSavedTasks();

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const hours = parseInt(hour_elem.value) || 0;
        const minutes = parseInt(min_elem.value) || 0;
        const seconds = parseInt(sec_elem.value) || 0;

        if (hours < 0 || minutes < 0 || seconds < 0 || (hours === 0 && minutes === 0 && seconds === 0)) {
            alert('Please enter a valid time.');
            return;
        }

        stopAllTimers(); // Stop any running timers when a new task is added

        timerId++;
        createTimerElement(timerId, taskInput.value);
        // Don't start the timer here, only set remainingTimes
        remainingTimes[timerId] = { hours, minutes, seconds };
        const timeDisplay = document.querySelector(`#time_display_${timerId}`);
        timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        allTasks.push({
            task: taskInput.value,
            timerId: timerId,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            completed: false // Initialize completed status
        });

        localStorage.setItem("task", JSON.stringify(allTasks));
        localStorage.setItem("timerId", timerId);

        hour_elem.value = "";
        min_elem.value = "";
        sec_elem.value = "";
        taskInput.value = "";
    });

    const updateTaskCompletion = (timerId, completed) => {
        const index = allTasks.findIndex(task => task.timerId === timerId);
        if (index !== -1) {
            allTasks[index].completed = completed;
            localStorage.setItem("task", JSON.stringify(allTasks));
        }
    };

    const deleteTimer = (timerId, timerElement) => {
        // Remove the timer element from the DOM
        timerElement.remove();

        // Update the allTasks array
        allTasks = allTasks.filter(task => task.timerId !== timerId);

        // Clear the interval if it exists
        if (timers[timerId]) {
            clearInterval(timers[timerId]);
            delete timers[timerId];
        }

        // Update localStorage
        localStorage.setItem("task", JSON.stringify(allTasks));
        updatePauseButtonsClass();
    };

    const getTimeFromDisplay = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return { hours, minutes, seconds };
    };
});