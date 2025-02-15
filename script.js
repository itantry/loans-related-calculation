let pieChartInstance = null;
let lineChartInstance = null;
let comparisons = []; // Array to store comparison scenarios

/**
 * Calculates the loan EMI, estimated interest, actual interest, and adjusted tenure.
 * Updates the UI with the calculated results and generates charts.
 */
function calculateLoan() {
    // Get input values
    const principalAmount = parseFloat(document.getElementById('principal').value);
    const annualInterestRate = parseFloat(document.getElementById('roi').value);
    const loanTenureYears = parseFloat(document.getElementById('tenure').value);
    const additionalPayments = parseFloat(document.getElementById('additionalPayments').value);
    const paymentFrequency = parseInt(document.getElementById('frequency').value);

    // Validate principal amount
    if (isNaN(principalAmount) || principalAmount <= 0) {
        alert("Please enter a valid principal amount.");
        return;
    }

    const { emi, estimatedInterest } = calculateEmiAndInterest(principalAmount, annualInterestRate, loanTenureYears);
    const { actualInterest, adjustedTenureMonths } = calculateActualInterestAndAdjustedTenure(principalAmount, annualInterestRate, loanTenureYears, additionalPayments, paymentFrequency, emi);

    // Display results in the main results section
    document.getElementById('emi').textContent = emi.toFixed(2);
    document.getElementById('estimatedInterest').textContent = estimatedInterest.toFixed(2);
    document.getElementById('actualInterest').textContent = actualInterest.toFixed(2);
    document.getElementById('adjustedTenure').textContent = (adjustedTenureMonths / 12).toFixed(1);

    // Update charts
    updatePieChart(principalAmount, actualInterest);
    updateLineChart(principalAmount, annualInterestRate, loanTenureYears, additionalPayments, paymentFrequency, emi);
}

/**
 * Calculates EMI and estimated interest without additional payments.
 */
function calculateEmiAndInterest(principal, roi, tenure) {
    const monthlyInterestRate = (roi / 100) / 12;
    const numberOfPayments = tenure * 12;
    const emi = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    const estimatedInterest = (emi * numberOfPayments) - principal;
    return { emi, estimatedInterest };
}

/**
 * Calculates actual interest and adjusted tenure with additional payments.
 */
function calculateActualInterestAndAdjustedTenure(principal, roi, tenure, additionalPayments, frequency, emi) {
    let actualInterest = 0;
    let adjustedTenureMonths = 0;
    const monthlyInterestRate = (roi / 100) / 12;
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
        const { estimatedInterest } = calculateEmiAndInterest(principal, roi, tenure);
        actualInterest = estimatedInterest;
        adjustedTenureMonths = numberOfPayments;
    }

    return { actualInterest, adjustedTenureMonths };
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
  function updateLineChart(principal, roi, tenure, additionalPayments, frequency, emi) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    const monthlyInterestRate = (roi / 100) / 12;
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
      lineChartInstance.data.datasets[0].borderColor = '#007bff'; // Update line color
      lineChartInstance.update();
    } else {
      const lineChartConfig = {
        type: 'line',
        data: {
          labels: Array.from({ length: data.length }, (_, i) => `Month ${i + 1}`),
          datasets: [{
            label: 'Remaining Principal',
            data: data,
            borderColor: '#007bff', // Blue color
            fill: false,
            tension: 0.4, // Smooth the line
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              grid: {
                display: true,
                color: 'rgba(0,0,0,0.1)'
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              enabled: true
            }
          }
        }
      };
      
      // Create the chart (assuming canvas id is lineChart)
      const lineChartCanvas = document.getElementById("lineChart").getContext("2d");
      new Chart(lineChartCanvas, lineChartConfig);
    }
  }

/**
 * Adds the current loan scenario to the comparison table.
 */
function addToComparison() {
  console.log("addToComparison called"); // Debugging line
    const principalAmount = parseFloat(document.getElementById('principal').value);
    const annualInterestRate = parseFloat(document.getElementById('roi').value);
    const loanTenureYears = parseFloat(document.getElementById('tenure').value);
    const additionalPayments = parseFloat(document.getElementById('additionalPayments').value);
    const paymentFrequency = parseInt(document.getElementById('frequency').value);
    const frequencyText = document.getElementById('frequency').options[document.getElementById('frequency').selectedIndex].text;

    const { emi, estimatedInterest } = calculateEmiAndInterest(principalAmount, annualInterestRate, loanTenureYears);
    const { actualInterest, adjustedTenureMonths } = calculateActualInterestAndAdjustedTenure(principalAmount, annualInterestRate, loanTenureYears, additionalPayments, paymentFrequency, emi);

    if (comparisons.length < 3) {
        comparisons.push({
            scenario: comparisons.length + 1,
            principal: principalAmount,
            interestRate: annualInterestRate,
            tenure: loanTenureYears,
            additionalPayment: additionalPayments,
            frequency: frequencyText,
            emi: emi.toFixed(2),
            estimatedInterest: estimatedInterest.toFixed(2),
            actualInterest: actualInterest.toFixed(2),
            adjustedTenure: (adjustedTenureMonths / 12).toFixed(1)
        });
        updateComparisonTable();
    } else {
        alert("You can compare a maximum of 3 scenarios.");
    }
}

/**
 * Updates the comparison table with the current comparison data.
 */
function updateComparisonTable() {
    const tableBody = document.getElementById('comparisonTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing rows

    for (const comparison of comparisons) {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = comparison.scenario;
        row.insertCell(1).textContent = comparison.principal;
        row.insertCell(2).textContent = comparison.interestRate;
        row.insertCell(3).textContent = comparison.tenure;
        row.insertCell(4).textContent = comparison.additionalPayment;
        row.insertCell(5).textContent = comparison.frequency;
        row.insertCell(6).textContent = comparison.emi;
        row.insertCell(7).textContent = comparison.estimatedInterest;
        row.insertCell(8).textContent = comparison.actualInterest;
        row.insertCell(9).textContent = comparison.adjustedTenure;
    }
}

/**
 * Clears all comparison data and the comparison table.
 */
function clearComparisons() {
    comparisons = [];
    updateComparisonTable();
}

// Event listeners for input changes
document.getElementById('roi').addEventListener('input', function() {
  document.getElementById('roiValue').textContent = this.value;
  calculateLoan();
});

document.getElementById('tenure').addEventListener('input', function() {
  document.getElementById('tenureValue').textContent = this.value;
  calculateLoan();
});

document.getElementById('additionalPayments').addEventListener('input', function() {
  document.getElementById('additionalPaymentsValue').textContent = this.value;
  calculateLoan();
});

document.getElementById('frequency').addEventListener('change', calculateLoan);

// Event listener for the "Add to Comparison" button
document.getElementById('compareBtn').addEventListener('click', addToComparison);

// Event listener for the "Clear Comparisons" button
document.getElementById('clearBtn').addEventListener('click', clearComparisons);

// Initial calculation on page load with a delay, and attach event listeners that depend on DOM elements.
setTimeout(function() {
  calculateLoan();
  // Event listener for the "Add to Comparison" button
  document.getElementById('compareBtn').addEventListener('click', addToComparison);
}, 100); // Delay of 100ms

document.getElementById("compareBtn").addEventListener("click", function() {
  const tableBody = document.querySelector("#comparisonTable tbody");
  
  // Check if 10 scenarios are already added
  if (tableBody.children.length >= 10) {
    alert("A maximum of 10 comparison scenarios are allowed.");
    return;
  }
  
  // Code to add a new row to the comparison table goes here
  // For example:
  const newRow = document.createElement("tr");
  // ... populate newRow with cells ...
  tableBody.appendChild(newRow);
});

document.addEventListener("DOMContentLoaded", () => {
  // Toggle principal manual entry
  const toggleBtn = document.getElementById("togglePrincipalManual");
  const principalManual = document.getElementById("principalManual");
  const principalSlider = document.getElementById("principalSlider");

  toggleBtn.addEventListener("click", () => {
    if (principalManual.style.display === "none" || principalManual.style.display === "") {
      principalManual.style.display = "block";
      // Optional: hide the slider if manual entry is preferred
      principalSlider.style.display = "none";
      toggleBtn.textContent = "-"; // Change to minus to allow reverting
    } else {
      principalManual.style.display = "none";
      principalSlider.style.display = "block";
      toggleBtn.textContent = "+";
    }
  });

  // (Keep your existing event listeners — e.g. for PDF download, compareBtn, etc.)
  const downloadBtn = document.getElementById("downloadPdfBtn");
  downloadBtn.addEventListener("click", () => {
    html2canvas(document.getElementById("comparisonTableContainer")).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
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

  // Other event listeners...

  const compareBtn = document.getElementById("compareBtn");
  const tableBody = document.querySelector("#comparisonTable tbody");
  
  compareBtn.addEventListener("click", () => {
    // Limit comparisons to 10 scenarios.
    if (tableBody.children.length >= 10) {
      alert("You can compare a maximum of 10 scenarios.");
      return;
    }
    
    // Example: create a new row and populate it (customize as needed)
    const newRow = document.createElement("tr");
    
    // Populate cells with sample data for now.
    newRow.innerHTML = `
      <td>Scenario ${tableBody.children.length + 1}</td>
      <td>${document.getElementById("principalManual").value || '-'}</td>
      <td>${document.getElementById("roi").value}</td>
      <td>${document.getElementById("tenure").value}</td>
      <td>${document.getElementById("additionalPayments").value}</td>
      <td>${document.getElementById("frequency").options[document.getElementById("frequency").selectedIndex].text}</td>
      <td>EMI</td>
      <td>Est. Int</td>
      <td>Act. Int</td>
      <td>Adj. Tenure</td>
    `;
    
    tableBody.appendChild(newRow);
  });

  // Restore saved input values from localStorage.
  const principalInput = document.getElementById("principalManual");
  const roiInput = document.getElementById("roi");
  const tenureInput = document.getElementById("tenure");
  const additionalPaymentsInput = document.getElementById("additionalPayments");
  const frequencySelect = document.getElementById("frequency");

  if (localStorage.getItem("principalManual")) {
    principalInput.value = localStorage.getItem("principalManual");
  }
  if (localStorage.getItem("roi")) {
    roiInput.value = localStorage.getItem("roi");
    document.getElementById("roiValue").textContent = roiInput.value;
  }
  if (localStorage.getItem("tenure")) {
    tenureInput.value = localStorage.getItem("tenure");
    document.getElementById("tenureValue").textContent = tenureInput.value;
  }
  if (localStorage.getItem("additionalPayments")) {
    additionalPaymentsInput.value = localStorage.getItem("additionalPayments");
    document.getElementById("additionalPaymentsValue").textContent = additionalPaymentsInput.value;
  }
  if (localStorage.getItem("frequency")) {
    frequencySelect.value = localStorage.getItem("frequency");
  }

  // Save changes to localStorage whenever inputs change.
  principalInput.addEventListener("input", () => {
    localStorage.setItem("principalManual", principalInput.value);
  });
  roiInput.addEventListener("input", function() {
    document.getElementById("roiValue").textContent = this.value;
    localStorage.setItem("roi", this.value);
    calculateLoan();
  });
  tenureInput.addEventListener("input", function() {
    document.getElementById("tenureValue").textContent = this.value;
    localStorage.setItem("tenure", this.value);
    calculateLoan();
  });
  additionalPaymentsInput.addEventListener("input", function() {
    document.getElementById("additionalPaymentsValue").textContent = this.value;
    localStorage.setItem("additionalPayments", this.value);
    calculateLoan();
  });
  frequencySelect.addEventListener("change", function() {
    localStorage.setItem("frequency", this.value);
    calculateLoan();
  });

  // Only one event listener for the "Add to Comparison" button.
  const compareBtn = document.getElementById("compareBtn");
  compareBtn.addEventListener("click", addToComparison);

  // Event listener for the "Clear Comparisons" button.
  document.getElementById("clearBtn").addEventListener("click", clearComparisons);

  // Event listener for the PDF download button.
  document.getElementById("downloadPdfBtn").addEventListener("click", () => {
    html2canvas(document.getElementById("comparisonTableContainer")).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
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

  // Do an initial calculation.
  calculateLoan();
});
