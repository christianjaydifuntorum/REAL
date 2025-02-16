import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonitoringService } from '../core/services/monitoring.service';
import { IMonitoringView } from '../core/models/monitoring.model';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-monitoring-view',
  imports: [FormsModule, CommonModule],
  templateUrl: './monitoring-view.component.html',
  styleUrls: ['./monitoring-view.component.css']
})
export class MonitoringViewComponent implements OnInit {
  filteredMonitoringViewList: IMonitoringView[] = [];
  monitoringViewList: IMonitoringView[] = [];
  monitoringView: IMonitoringView = {
    active_power_W: 0,
    apparent_power_VA: 0,
    current_A: 0,
    current_date: '',
    current_time: '',
    energy_kWh: 0,
    frequency_Hz: 0,
    phase_angle_deg: 0,
    power_factor: 0,
    voltage_V: 0,
  };
  loading: boolean = false;
  inputCost: any = 0;
  consumptionKwh: any = 0;
  filterDate: string = '';
  startTime: string = '';
  endTime: string = '';
  selectedEnergy: number = 0;
  uniqueEnergyList: number[] = [];
  pdfLoading: boolean = false;

  constructor(private monitoringService: MonitoringService) { }

  ngOnInit(): void {
    this.getLatestMonitoringView();
  }

  preventInvalidInput(event: KeyboardEvent) {
    if (event.key === 'e' || event.key === '-' || event.key === '+') {
      event.preventDefault();
    }
  }

  getLatestMonitoringView(): void {
    this.monitoringService.getLatestMonitoringView().subscribe({
      next: (data: any) => {
        this.monitoringView = data;
      },
      error: (err: any) => { },
      complete: () => { }
    });
  }

  onFilter(): void {
    if (this.filterDate && this.startTime && this.endTime) {
      this.loadData();
    }
  }

  loadData(): void {
    if (this.filterDate && this.startTime && this.endTime) {
      this.loading = true; // Show loading indicator

      this.monitoringService.getFilteredMonitoringView(this.filterDate, this.startTime, this.endTime)
        .subscribe({
          next: (data) => {
            this.filteredMonitoringViewList = data;
            this.uniqueEnergyList  = [...new Set(this.filteredMonitoringViewList.map(item => item.energy_kWh))]; //Remove duplicate energy_kWh
            this.loading = false; // Hide loading indicator
          },
          error: () => {
            this.loading = false; // Hide loading indicator even if there’s an error
          }
        });
    } else {
      this.filteredMonitoringViewList = [];
    }
  }

  calculate() {
    if (this.inputCost > 0) {
      this.consumptionKwh = this.inputCost * this.selectedEnergy;
    }
  }

  resetConsumption() {
    this.inputCost = 0;
    this.consumptionKwh = 0;
  }

  convertDateTime(input: string): any {
    const day = input.substring(0, 2);
    const month = input.substring(2, 4);
    const year = input.substring(4, 8);
    const hours = input.substring(8, 10);
    const minutes = input.substring(10, 12);

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getVoltageClass(voltage: number): string {
    if (voltage === 220) {
      return 'green';
    } else if ((voltage >= 198 && voltage < 220) || (voltage > 220 && voltage <= 242)) {
      return 'yellow';
    } else if (voltage < 198 || voltage > 242) {
      return 'red';
    }
    return '';
  }


  getPowerFactorClass(power: number): string {
    if (power >= 0.95 && power <= 1) {
      return 'green';
    } else if (power >= 0.85 && power <= 0.94) {
      return 'yellow';
    } else if (power < 0.85) {
      return 'red';
    }
    return '';
  }

  updateEnergy() {
    this.monitoringView.energy_kWh = this.selectedEnergy;
  }

  downloadPDF() {
    if (this.filteredMonitoringViewList.length === 0) return; // Prevent download if no data
  
    this.pdfLoading = true; // Start loading
  
    setTimeout(() => { // Simulate loading effect
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Electrical Monitoring Data', 14, 10);
  
      // Table Headers
      const headers = [[
        'Date & Time', 
        'Voltage (V)', 
        'Current (A)', 
        'Power Factor', 
        'Frequency (Hz)', 
        'Phase Angle (°)', 
        'Active Power (W)', 
        'Energy (kWh)']];
  
      // Table Data
      const data = this.filteredMonitoringViewList.map(item => [
        `${item.current_date} ${item.current_time}`,
        item.voltage_V,
        item.current_A,
        item.power_factor,
        item.frequency_Hz,
        item.phase_angle_deg,
        item.active_power_W,
        item.energy_kWh
      ]);
  
      // Generate Table
      autoTable(doc, {
        head: headers,
        body: data,
        startY: 20
      });
  
      // Save PDF
      doc.save('Electrical_Monitoring_Data.pdf');
  
      this.pdfLoading = false; // Stop loading after PDF is generated
    }, 1500); // Simulate a short delay
  }  
  

}

