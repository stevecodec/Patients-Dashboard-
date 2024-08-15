document.addEventListener("DOMContentLoaded", function () {
    // API endpoint for patient data
    const apiEndpoint = "https://fedskillstest.coalitiontechnologies.workers.dev";

    // Base64 encoded credentials (username:password -> coalition:skills-test)
    const basicAuth = btoa("coalition:skills-test");

    let patients = [];
    let chart; // Declaring the chart variable in the outer scope

    // Fetching data from the API with Basic Auth
    fetch(apiEndpoint, {
        method: "GET",
        headers: {
            "Authorization": "Basic " + basicAuth
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        patients = data; // Storing the patient data

        // Populating the patient list dynamically
        const patientListElement = document.getElementById("patientList");
        patientListElement.innerHTML = ""; // Clear any existing patients

        patients.forEach((patient, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("patient-item");
            listItem.setAttribute("data-patient-id", index);

            listItem.innerHTML = `
                <img src="${patient.profile_picture || 'assets/default.png'}" alt="${patient.name}">
                <span>${patient.name}</span>
            `;

            // click event listener to each list item
            listItem.addEventListener("click", () => {
                updateProfileSection(index); // Call function to update the profile section
            });

            patientListElement.appendChild(listItem);
        });

        // Automatically displaying the first patient's data on load
        if (patients.length > 0) {
            updateProfileSection(0);
        }
    })
    .catch(error => {
        console.error("Error fetching patient data:", error);
    });

    // updatig the profile section and other parts of the UI
    function updateProfileSection(patientId) {
        const patient = patients[patientId];

        // Updating profile section
        document.getElementById("profileSectionImage").src = patient.profile_picture || "assets/default.png";
        document.getElementById("patientSectionName").textContent = patient.name;
        document.getElementById("patientDOB").textContent = formatDate(patient.date_of_birth);
        document.getElementById("patientGender").textContent = patient.gender;
        document.getElementById("patientContact").textContent = patient.phone_number;
        document.getElementById("patientInsurance").textContent = patient.insurance_type;

        // Updating vitals
        const latestDiagnosis = patient.diagnosis_history[0]; //latest data
        document.getElementById("respiratoryRate").textContent = latestDiagnosis.respiratory_rate.value + " bpm";
        document.getElementById("respiratoryLevel").textContent = latestDiagnosis.respiratory_rate.levels;
        document.getElementById("temperature").textContent = latestDiagnosis.temperature.value + "°F";
        document.getElementById("temperatureLevel").textContent = latestDiagnosis.temperature.levels;
        document.getElementById("heartRate").textContent = latestDiagnosis.heart_rate.value + " bpm";
        document.getElementById("heartRateLevel").textContent = latestDiagnosis.heart_rate.levels;

        // Updating diagnostic list
        const diagnosticList = document.getElementById("diagnosticList");
        diagnosticList.innerHTML = ""; // Clearing previous entries
        patient.diagnostic_list.forEach(diagnostic => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${diagnostic.name}</td>
                <td>${diagnostic.description}</td>
                <td>${diagnostic.status}</td>
            `;
            diagnosticList.appendChild(row);
        });

        // Updating lab results
        const labResultsList = document.getElementById("labResultsList");
        labResultsList.innerHTML = ""; // Clearing previous entries
        patient.lab_results.forEach(result => {
            const listItem = document.createElement("li");
            listItem.textContent = result;
            labResultsList.appendChild(listItem);
        });

        // Updating the blood pressure chart using Chart.js
        const bloodPressureData = patient.diagnosis_history.map(entry => ({
            month: `${entry.month} ${entry.year}`,
            systolic: entry.blood_pressure.systolic.value,
            diastolic: entry.blood_pressure.diastolic.value
        }));

        updateChart(bloodPressureData);
    }

    // Helper function to format the date of birth
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Updating the Chart.js graph
    function updateChart(data) {
        const ctx = document.getElementById("bloodPressureChart").getContext("2d");

        if (chart) {
            chart.destroy(); // Destroy the previous chart before creating a new one
        }

        chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.map(item => item.month),
                datasets: [
                    {
                        label: "Systolic",
                        data: data.map(item => item.systolic),
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: "Diastolic",
                        data: data.map(item => item.diastolic),
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 2,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});
