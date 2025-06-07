// Photoelectric Effect Simulator JavaScript

class PhotoelectricSimulator {
    constructor() {
        // Physical constants
        this.constants = {
            h: 4.136e-15, // Planck constant in eV·s
            c: 3e8, // Speed of light in m/s
            e: 1.602e-19 // Elementary charge in C
        };

        // Metal data
        this.metals = [
            {name: "Sodium", symbol: "Na", workFunction: 2.28, color: "#fbbf24"},
            {name: "Potassium", symbol: "K", workFunction: 2.3, color: "#a855f7"},
            {name: "Cesium", symbol: "Cs", workFunction: 2.1, color: "#06b6d4"},
            {name: "Copper", symbol: "Cu", workFunction: 4.7, color: "#f97316"},
            {name: "Silver", symbol: "Ag", workFunction: 4.73, color: "#6b7280"},
            {name: "Aluminum", symbol: "Al", workFunction: 4.08, color: "#60a5fa"},
            {name: "Gold", symbol: "Au", workFunction: 5.1, color: "#fbbf24"}
        ];

        // Wavelength to color mapping
        this.wavelengthColors = {
            100: "#8b5cf6", 380: "#6366f1", 450: "#06b6d4",
            495: "#10b981", 570: "#fbbf24", 590: "#f97316", 620: "#ef4444", 700: "#ef4444"
        };

        // Current state
        this.state = {
            selectedMetal: 0,
            area: 0.1,
            wavelength: 400,
            intensity: 5,
            voltage: 0,
            lightOn: false,
            measurements: [],
            currentReadings: [],
            chart: null
        };

        this.animationFrames = [];
        this.photonElements = [];
        this.electronElements = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupChart();
        this.updateCalculatedValues();
        this.updateWavelengthColor();
        this.updateMetalColor();
    }

    setupEventListeners() {
        // Material selection
        document.getElementById('materialSelect').addEventListener('change', (e) => {
            this.state.selectedMetal = parseInt(e.target.value);
            this.updateCalculatedValues();
            this.updateMetalColor();
        });

        // Area slider
        const areaSlider = document.getElementById('areaSlider');
        areaSlider.addEventListener('input', (e) => {
            this.state.area = parseFloat(e.target.value);
            document.getElementById('areaValue').textContent = this.state.area.toFixed(2);
        });

        // Wavelength slider
        const wavelengthSlider = document.getElementById('wavelengthSlider');
        wavelengthSlider.addEventListener('input', (e) => {
            this.state.wavelength = parseInt(e.target.value);
            document.getElementById('wavelengthValue').textContent = this.state.wavelength;
            this.updateWavelengthColor();
            this.updateCalculatedValues();
        });

        // Intensity slider
        const intensitySlider = document.getElementById('intensitySlider');
        intensitySlider.addEventListener('input', (e) => {
            this.state.intensity = parseFloat(e.target.value);
            document.getElementById('intensityValue').textContent = this.state.intensity.toFixed(1);
        });

        // Voltage slider
        const voltageSlider = document.getElementById('voltageSlider');
        voltageSlider.addEventListener('input', (e) => {
            this.state.voltage = parseFloat(e.target.value);
            document.getElementById('voltageValue').textContent = this.state.voltage.toFixed(1);
            document.getElementById('voltageDisplay').textContent = `${this.state.voltage.toFixed(1)} V`;
            
            // Change voltage display color based on value
            const voltageDisplay = document.getElementById('voltageDisplay');
            if (this.state.voltage < 0) {
                voltageDisplay.style.color = '#ef4444'; // Red for negative
            } else if (this.state.voltage > 0) {
                voltageDisplay.style.color = '#10b981'; // Green for positive
            } else {
                voltageDisplay.style.color = '#06b6d4'; // Default cyan for zero
            }
            
            if (this.state.lightOn) {
                this.takeMeasurement();
            }
        });

        // Light button
        document.getElementById('lightButton').addEventListener('click', () => {
            this.toggleLight();
        });

        // Reset button
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetExperiment();
        });

        // Export button
        document.getElementById('exportButton').addEventListener('click', () => {
            this.exportData();
        });
    }

    setupChart() {
        const ctx = document.getElementById('ivChart').getContext('2d');
        this.state.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Current vs Voltage',
                    data: [],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8fafc'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Voltage (V)',
                            color: '#f8fafc'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: '#475569'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Current (µA)',
                            color: '#f8fafc'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        },
                        grid: {
                            color: '#475569'
                        }
                    }
                }
            }
        });
    }

    updateWavelengthColor() {
        const wavelength = this.state.wavelength;
        let color;
        
        if (wavelength < 380) color = this.wavelengthColors[100];
        else if (wavelength < 450) color = this.wavelengthColors[380];
        else if (wavelength < 495) color = this.wavelengthColors[450];
        else if (wavelength < 570) color = this.wavelengthColors[495];
        else if (wavelength < 590) color = this.wavelengthColors[570];
        else if (wavelength < 620) color = this.wavelengthColors[590];
        else color = this.wavelengthColors[620];

        document.getElementById('wavelengthColor').style.background = color;
        
        // Update light beam color if active
        if (this.state.lightOn) {
            document.getElementById('lightBeam').style.background = 
                `linear-gradient(90deg, transparent, ${color})`;
        }
    }

    updateMetalColor() {
        const metal = this.metals[this.state.selectedMetal];
        document.getElementById('workFunctionValue').textContent = metal.workFunction.toFixed(2);
        document.getElementById('metalPlate').style.background = 
            `linear-gradient(135deg, ${metal.color}, #9ca3af)`;
    }

    updateCalculatedValues() {
        const metal = this.metals[this.state.selectedMetal];
        const wavelength = this.state.wavelength * 1e-9; // Convert to meters
        
        // Threshold wavelength: λ_th = hc/Φ
        const thresholdWavelength = (this.constants.h * this.constants.c) / metal.workFunction;
        document.getElementById('thresholdWavelength').textContent = 
            `${(thresholdWavelength * 1e9).toFixed(0)} nm`;
        
        // Photon energy: E = hc/λ
        const photonEnergy = (this.constants.h * this.constants.c) / wavelength;
        document.getElementById('photonEnergy').textContent = `${photonEnergy.toFixed(2)} eV`;
        
        // Stopping potential: V_s = (hc/λ - Φ)/e
        const stoppingPotential = Math.max(0, photonEnergy - metal.workFunction);
        document.getElementById('stoppingPotential').textContent = `${stoppingPotential.toFixed(2)} V`;
    }

    calculatePhotocurrent() {
        const metal = this.metals[this.state.selectedMetal];
        const wavelength = this.state.wavelength * 1e-9;
        const photonEnergy = (this.constants.h * this.constants.c) / wavelength;
        
        // Check if photon energy is sufficient to overcome work function
        if (photonEnergy <= metal.workFunction) {
            return 0;
        }
        
        // Calculate maximum kinetic energy of photoelectrons
        const maxKineticEnergy = photonEnergy - metal.workFunction;
        const stoppingPotential = maxKineticEnergy;
        
        // If applied voltage is greater than stopping potential, current is zero
        if (this.state.voltage >= stoppingPotential) {
            return 0;
        }
        
        // Current is proportional to intensity, area, and voltage-dependent factor
        const baseCurrent = this.state.intensity * this.state.area * 10; // Scale factor
        const voltageFactor = Math.max(0, 1 + (this.state.voltage / stoppingPotential));
        
        return baseCurrent * voltageFactor;
    }

    generateGaussianNoise(mean, stdDev) {
        // Box-Muller transformation for Gaussian noise
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        
        const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return mean + z * stdDev;
    }

    takeMeasurement() {
        const trueCurrent = this.calculatePhotocurrent();
        const readings = [];
        
        // Take 10 readings with 5% Gaussian noise
        for (let i = 0; i < 10; i++) {
            const noisyCurrent = this.generateGaussianNoise(trueCurrent, trueCurrent * 0.05);
            readings.push(Math.max(0, noisyCurrent)); // Current can't be negative
        }
        
        const avgCurrent = readings.reduce((sum, val) => sum + val, 0) / readings.length;
        
        // Update or add measurement
        const existingIndex = this.state.measurements.findIndex(m => 
            Math.abs(m.voltage - this.state.voltage) < 0.05
        );
        
        if (existingIndex >= 0) {
            this.state.measurements[existingIndex] = {
                voltage: this.state.voltage,
                avgCurrent: avgCurrent,
                readings: readings
            };
        } else {
            this.state.measurements.push({
                voltage: this.state.voltage,
                avgCurrent: avgCurrent,
                readings: readings
            });
            this.state.measurements.sort((a, b) => a.voltage - b.voltage);
        }
        
        this.updateDisplay(avgCurrent);
        this.updateDataTable();
        this.updateChart();
        
        // Update electron animation based on current
        this.updateElectronAnimation(avgCurrent > 0);
    }

    updateDisplay(current) {
        const currentDisplay = document.getElementById('currentDisplay');
        currentDisplay.textContent = `${current.toFixed(3)} µA`;
        
        // Change current display color based on value
        if (current > 1) {
            currentDisplay.style.color = '#10b981'; // Green for higher current
        } else if (current > 0) {
            currentDisplay.style.color = '#06b6d4'; // Cyan for low current
        } else {
            currentDisplay.style.color = '#ef4444'; // Red for zero current
        }
        
        document.getElementById('measurementCount').textContent = this.state.measurements.length;
    }

    updateDataTable() {
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';
        
        this.state.measurements.forEach(measurement => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = measurement.voltage.toFixed(1);
            row.insertCell(1).textContent = measurement.avgCurrent.toFixed(3);
            
            const readingsCell = row.insertCell(2);
            const readingsText = measurement.readings.map(r => r.toFixed(2)).join(', ');
            readingsCell.innerHTML = `<span title="${readingsText}">${measurement.readings.length} readings</span>`;
        });
    }

    updateChart() {
        const data = this.state.measurements.map(m => ({
            x: m.voltage,
            y: m.avgCurrent
        }));
        
        this.state.chart.data.datasets[0].data = data;
        this.state.chart.update();
    }

    toggleLight() {
        this.state.lightOn = !this.state.lightOn;
        const button = document.getElementById('lightButton');
        const lightStatus = document.getElementById('lightStatus');
        const lightBeam = document.getElementById('lightBeam');
        const statusMessage = document.getElementById('statusMessage');
        
        if (this.state.lightOn) {
            button.textContent = 'Light ON';
            button.classList.add('light-on');
            lightStatus.textContent = 'ON';
            lightStatus.className = 'status status--success';
            lightBeam.classList.add('active');
            statusMessage.textContent = 'Experiment active - Adjust voltage to take measurements';
            
            this.startAnimations();
            this.takeMeasurement();
        } else {
            button.textContent = 'Switch On Light';
            button.classList.remove('light-on');
            lightStatus.textContent = 'OFF';
            lightStatus.className = 'status status--error';
            lightBeam.classList.remove('active');
            statusMessage.textContent = 'Light OFF - Switch on to begin measurements';
            
            this.stopAnimations();
        }
    }

    createPhotonElement() {
        const photonsContainer = document.getElementById('photons');
        const photon = document.createElement('div');
        photon.className = 'photon';
        photon.style.top = (Math.random() * 20 - 10) + 'px';
        
        // Get current wavelength color
        let color;
        const wavelength = this.state.wavelength;
        if (wavelength < 380) color = this.wavelengthColors[100];
        else if (wavelength < 450) color = this.wavelengthColors[380];
        else if (wavelength < 495) color = this.wavelengthColors[450];
        else if (wavelength < 570) color = this.wavelengthColors[495];
        else if (wavelength < 590) color = this.wavelengthColors[570];
        else if (wavelength < 620) color = this.wavelengthColors[590];
        else color = this.wavelengthColors[620];
        
        photon.style.backgroundColor = color;
        photon.style.boxShadow = `0 0 8px ${color}`;
        
        photonsContainer.appendChild(photon);
        this.photonElements.push(photon);
        
        // Remove after animation completes
        setTimeout(() => {
            if (photon.parentNode) {
                photon.parentNode.removeChild(photon);
                this.photonElements = this.photonElements.filter(p => p !== photon);
            }
        }, 2000);
    }

    createElectronElement() {
        if (!this.state.lightOn || this.calculatePhotocurrent() <= 0) return;
        
        const electronsContainer = document.getElementById('electrons');
        const electron = document.createElement('div');
        electron.className = 'electron';
        electron.style.top = (Math.random() * 40 - 20) + 'px';
        
        electronsContainer.appendChild(electron);
        this.electronElements.push(electron);
        
        // Remove after animation completes
        setTimeout(() => {
            if (electron.parentNode) {
                electron.parentNode.removeChild(electron);
                this.electronElements = this.electronElements.filter(e => e !== electron);
            }
        }, 1500);
    }

    updateElectronAnimation(shouldEmit) {
        if (shouldEmit) {
            // Ensure electron animation is running
            if (!this.electronAnimationInterval) {
                this.electronAnimationInterval = setInterval(() => this.createElectronElement(), 300);
            }
        } else {
            // Stop electron animation
            if (this.electronAnimationInterval) {
                clearInterval(this.electronAnimationInterval);
                this.electronAnimationInterval = null;
            }
            
            // Clear existing electrons
            this.electronElements.forEach(electron => {
                if (electron.parentNode) {
                    electron.parentNode.removeChild(electron);
                }
            });
            this.electronElements = [];
        }
    }

    startAnimations() {
        this.stopAnimations(); // Clear any existing animations
        
        // Start photon animation
        this.photonAnimationInterval = setInterval(() => this.createPhotonElement(), 200);
        
        // Check if electrons should be emitted based on current state
        const shouldEmitElectrons = this.calculatePhotocurrent() > 0;
        if (shouldEmitElectrons) {
            this.electronAnimationInterval = setInterval(() => this.createElectronElement(), 300);
        }
    }

    stopAnimations() {
        // Clear animation intervals
        if (this.photonAnimationInterval) {
            clearInterval(this.photonAnimationInterval);
            this.photonAnimationInterval = null;
        }
        
        if (this.electronAnimationInterval) {
            clearInterval(this.electronAnimationInterval);
            this.electronAnimationInterval = null;
        }
        
        // Clear existing particles
        this.photonElements.forEach(photon => {
            if (photon.parentNode) {
                photon.parentNode.removeChild(photon);
            }
        });
        this.photonElements = [];
        
        this.electronElements.forEach(electron => {
            if (electron.parentNode) {
                electron.parentNode.removeChild(electron);
            }
        });
        this.electronElements = [];
    }

    resetExperiment() {
        this.state.lightOn = false;
        this.state.measurements = [];
        this.state.selectedMetal = 0;
        this.state.area = 0.1;
        this.state.wavelength = 400;
        this.state.intensity = 5;
        this.state.voltage = 0;
        
        // Reset UI elements
        document.getElementById('materialSelect').value = '0';
        document.getElementById('areaSlider').value = '0.1';
        document.getElementById('areaValue').textContent = '0.10';
        document.getElementById('wavelengthSlider').value = '400';
        document.getElementById('wavelengthValue').textContent = '400';
        document.getElementById('intensitySlider').value = '5';
        document.getElementById('intensityValue').textContent = '5.0';
        document.getElementById('voltageSlider').value = '0';
        document.getElementById('voltageValue').textContent = '0.0';
        document.getElementById('voltageDisplay').textContent = '0.0 V';
        document.getElementById('voltageDisplay').style.color = '#06b6d4';
        document.getElementById('currentDisplay').textContent = '0.000 µA';
        document.getElementById('currentDisplay').style.color = '#06b6d4';
        document.getElementById('measurementCount').textContent = '0';
        
        const button = document.getElementById('lightButton');
        button.textContent = 'Switch On Light';
        button.classList.remove('light-on');
        
        const lightStatus = document.getElementById('lightStatus');
        lightStatus.textContent = 'OFF';
        lightStatus.className = 'status status--error';
        
        document.getElementById('lightBeam').classList.remove('active');
        document.getElementById('statusMessage').textContent = 
            'Select parameters and switch on light to begin experiment';
        
        this.stopAnimations();
        this.updateCalculatedValues();
        this.updateWavelengthColor();
        this.updateMetalColor();
        this.updateDataTable();
        
        // Clear chart
        this.state.chart.data.datasets[0].data = [];
        this.state.chart.update();
    }

    exportData() {
        if (this.state.measurements.length === 0) {
            // Show a notification if no data
            const statusMessage = document.getElementById('statusMessage');
            const originalText = statusMessage.textContent;
            statusMessage.textContent = 'No measurements to export. Please take some measurements first.';
            statusMessage.style.color = '#ef4444';
            
            setTimeout(() => {
                statusMessage.textContent = originalText;
                statusMessage.style.color = '';
            }, 3000);
            
            return;
        }
        
        const metal = this.metals[this.state.selectedMetal];
        let csv = 'Photoelectric Effect Experiment Data\n';
        csv += `Material: ${metal.name} (${metal.symbol})\n`;
        csv += `Work Function: ${metal.workFunction} eV\n`;
        csv += `Wavelength: ${this.state.wavelength} nm\n`;
        csv += `Intensity: ${this.state.intensity} W/m²\n`;
        csv += `Area: ${this.state.area} cm²\n\n`;
        
        csv += 'Voltage (V),Average Current (µA),Reading 1,Reading 2,Reading 3,Reading 4,Reading 5,Reading 6,Reading 7,Reading 8,Reading 9,Reading 10\n';
        
        this.state.measurements.forEach(measurement => {
            csv += `${measurement.voltage.toFixed(1)},${measurement.avgCurrent.toFixed(3)}`;
            measurement.readings.forEach(reading => {
                csv += `,${reading.toFixed(3)}`;
            });
            csv += '\n';
        });
        
        // Calculate stopping potential
        const stoppingPotential = this.state.measurements.find(m => m.avgCurrent < 0.001);
        if (stoppingPotential) {
            csv += `\nStopping Potential: ${stoppingPotential.voltage.toFixed(2)} V\n`;
        }
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `photoelectric_experiment_${Date.now()}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Show export confirmation
        const statusMessage = document.getElementById('statusMessage');
        const originalText = statusMessage.textContent;
        statusMessage.textContent = 'Data exported successfully!';
        statusMessage.style.color = '#10b981';
        
        setTimeout(() => {
            statusMessage.textContent = originalText;
            statusMessage.style.color = '';
        }, 3000);
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhotoelectricSimulator();
});