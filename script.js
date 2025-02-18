let pieChartInstance = null;
let lineChartInstance = null;

/**
 * Updates the displayed value of a slider--version 3.1.
 * @param {string} sliderId - The ID of the slider element.
 * @param {string} valueSpanId - The ID of the span element displaying the value.
 */
function updateSliderValue(sliderId, valueSpanId) {
  const slider = document.getElementById(sliderId);
  const valueSpan = document.getElementById(valueSpanId);
  valueSpan.textContent = slider.value;
}

/**
 * Calculates the loan EMI, estimated interest, actual interest, and adjusted tenure.
 * Updates the UI with the calculated results and generates charts.
 */
function calculateLoan() {
  // Get input values, using consistent naming
  const principal = parseFloat(document.getElementById('principalManual').value);
  const interestRate = parseFloat(document.getElementById('roi').value);
  const tenure = parseFloat(document.getElementById('tenure').value);
  const additionalPayments = parseFloat(document.getElementById('additionalPayments').value);
  const paymentFrequency = parseInt(document.getElementById('frequency').value);

  // Validate principal amount
  if (isNaN(principal) || principal <= 0) {
    alert("Please enter a valid principal amount.");
    return;
  }

  const {
    emi,
    estimatedInterest
  } = calculateEmiAndInterest(principal, interestRate, tenure);
  const {
    actualInterest,
    adjustedTenureMonths
  } = calculateActualInterestAndAdjustedTenure(principal, interestRate, tenure, additionalPayments, paymentFrequency, emi);

  // Display results in the main results section
  document.getElementById('emi').textContent = emi.toFixed(2);
  document.getElementById('estimatedInterest').textContent = estimatedInterest.toFixed(2);
  document.getElementById('actualInterest').textContent = actualInterest.toFixed(2);
  document.getElementById('adjustedTenure').textContent = (adjustedTenureMonths / 12).toFixed(1);

  // Update charts
  updatePieChart(principal, actualInterest);
  updateLineChart(principal, interestRate, tenure, additionalPayments, paymentFrequency, emi);
}

/**
 * Calculates EMI and estimated interest without additional payments.
 */
function calculateEmiAndInterest(principal, interestRate, tenure) {
  const monthlyInterestRate = (interestRate / 100) / 12;
  const numberOfPayments = tenure * 12;
  const emi = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  const estimatedInterest = (emi * numberOfPayments) - principal;
  return {
    emi,
    estimatedInterest
  };
}

/**
 * Calculates actual interest and adjusted tenure with additional payments.
 */
function calculateActualInterestAndAdjustedTenure(principal, interestRate, tenure, additionalPayments, frequency, emi) {
  let actualInterest = 0;
  let adjustedTenureMonths = 0;
  const monthlyInterestRate = (interestRate / 100) / 12;
  const numberOfPayments = tenure * 12;

  if (additionalPayments > 0) {
    let remainingPrincipal = principal;

    while (remainingPrincipal > 0 && adjustedTenureMonths < numberOfPayments) {
      // Apply additional payment at the specified frequency
      if (adjustedTenureMonths % frequency === 0) {
        remainingPrincipal -= additionalPayments;
      }

      // Calculate interest for the current month
      const monthlyInterest = remainingPrincipal * monthlyInterestRate;
      actualInterest += monthlyInterest;

      // Deduct EMI from the remaining principal
      remainingPrincipal -= (emi - monthlyInterest);

      adjustedTenureMonths++;
    }
  } else {
    const {
      estimatedInterest
    } = calculateEmiAndInterest(principal, interestRate, tenure);
    actualInterest = estimatedInterest;
    adjustedTenureMonths = numberOfPayments;
  }

  return {
    actualInterest,
    adjustedTenureMonths
  };
}

/**
 * Updates or creates the pie chart showing principal vs. interest.
 */
function updatePieChart(principal, actualInterest) {
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (pieChartInstance) {
    pieChartInstance.data.datasets[0].data = [principal, actualInterest];
    pieChartInstance.update();
  } else {
    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Principal', 'Interest'],
        datasets: [{
          data: [principal, actualInterest],
          backgroundColor: ['#36a2eb', '#ff6384'],
        }],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom', // Move legend to the bottom
          }
        }
      }
    });
  }
}

/**
 * Updates or creates the line chart showing remaining principal over time.
 */
function updateLineChart(principal, interestRate, tenure, additionalPayments, frequency, emi) {
  const ctx = document.getElementById('lineChart').getContext('2d');
  const monthlyInterestRate = (interestRate / 100) / 12;
  const numberOfPayments = tenure * 12;

  // Simulate remaining principal over time
  const data = [];
  let remainingPrincipal = principal;
  let adjustedTenureMonths = 0;
  for (let month = 1; month <= numberOfPayments; month++) {
    if (additionalPayments > 0) {
      if (adjustedTenureMonths % frequency === 0) {
        remainingPrincipal -= additionalPayments;
      }
    }

    const monthlyInterest = remainingPrincipal * monthlyInterestRate;
    remainingPrincipal -= (emi - monthlyInterest);
    data.push(remainingPrincipal > 0 ? remainingPrincipal : 0);

    adjustedTenureMonths++;
    if (remainingPrincipal <= 0) break; // Stop if principal is paid off
  }

    if (lineChartInstance) {
        lineChartInstance.data.labels = Array.from({ length: data.length }, (_, i) => `Month ${i + 1}`);
        lineChartInstance.data.datasets[0].data = data;
        lineChartInstance.update();
    } else {
        lineChartInstance = new Chart(ctx, { // Assign the new chart instance
            type: 'line',
            data: {
                labels: Array.from({ length: data.length }, (_, i) => `Month ${i + 1}`),
                datasets: [{
                    label: 'Remaining Principal',
                    data: data,
                    borderColor: '#007bff',
                    fill: false,
                    tension: 0.4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                },
            },
        });
    }
}

/**
 * Adds the current loan scenario to the comparison table.
 */
function addToComparison() {
  const principal = parseFloat(document.getElementById('principalManual').value);
  const interestRate = parseFloat(document.getElementById('roi').value);
  const tenure = parseFloat(document.getElementById('tenure').value);
  const additionalPayments = parseFloat(document.getElementById('additionalPayments').value);
  const paymentFrequency = parseInt(document.getElementById('frequency').value);
  const frequencyText = document.getElementById('frequency').options[document.getElementById('frequency').selectedIndex].text;

  const { emi, estimatedInterest } = calculateEmiAndInterest(principal, interestRate, tenure);
  const { actualInterest, adjustedTenureMonths } = calculateActualInterestAndAdjustedTenure(principal, interestRate, tenure, additionalPayments, paymentFrequency, emi);


    const tableBody = document.querySelector("#comparisonTable tbody");

     // Limit comparisons to 10 scenarios.
    if (tableBody.rows.length >= 10) {
      alert("A maximum of 10 comparison scenarios are allowed.");
      return;
    }

  // Create a new row in the comparison table.
  const newRow = tableBody.insertRow();

  // Add data to the row.
  [
    tableBody.rows.length, // Use insertRow index for scenario number
    principal,
    interestRate,
    tenure,
    additionalPayments,
    frequencyText,
    emi.toFixed(2),
    estimatedInterest.toFixed(2),
    actualInterest.toFixed(2),
    (adjustedTenureMonths / 12).toFixed(1)
  ].forEach(value => {
    const cell = newRow.insertCell();
    cell.textContent = value;
  });
}

/**
 * Clears all comparison data and the comparison table.
 */
function clearComparisons() {
    const tableBody = document.querySelector("#comparisonTable tbody");
    tableBody.innerHTML = '';
}

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const principalInput = document.getElementById("principalManual");
  const roiInput = document.getElementById("roi");
  const tenureInput = document.getElementById("tenure");
  const additionalPaymentsInput = document.getElementById("additionalPayments");
  const frequencySelect = document.getElementById("frequency");
  const compareBtn = document.getElementById("compareBtn");
  const clearBtn = document.getElementById("clearBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  // Restore saved input values from localStorage and set up event listeners
  function restoreAndSetupInput(inputElement, storageKey, updateFunction) {
    if (localStorage.getItem(storageKey)) {
      inputElement.value = localStorage.getItem(storageKey);
      if (updateFunction) {
        updateFunction();
      }
    }
    inputElement.addEventListener("input", () => {
      localStorage.setItem(storageKey, inputElement.value);
      if (updateFunction) {
        updateFunction();
      }
      calculateLoan();
    });
  }

  restoreAndSetupInput(principalInput, "principalManual");
  restoreAndSetupInput(roiInput, "roi", () => updateSliderValue("roi", "roiValue"));
  restoreAndSetupInput(tenureInput, "tenure", () => updateSliderValue("tenure", "tenureValue"));
  restoreAndSetupInput(additionalPaymentsInput, "additionalPayments", () => updateSliderValue("additionalPayments", "additionalPaymentsValue"));
  restoreAndSetupInput(frequencySelect, "frequency"); // No need for an update function for the select element

  frequencySelect.addEventListener("change", () => {
      localStorage.setItem("frequency", frequencySelect.value);
      calculateLoan();
  })

  // Event listener for the "Add to Comparison" button.
  compareBtn.addEventListener("click", addToComparison);

  // Event listener for the "Clear Comparisons" button.
  clearBtn.addEventListener("click", clearComparisons);

  // Event listener for the PDF download button.
  downloadPdfBtn.addEventListener("click", () => {
    html2canvas(document.getElementById("comparisonTableContainer")).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const {
        jsPDF
      } = window.jspdf;
      const pdf = new jsPDF("l", "mm", "a4"); // landscape mode
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("comparison.pdf");
    }).catch(error => {
      console.error("Error generating PDF:", error);
    });
  });

  // Initial calculation
  calculateLoan();
});
