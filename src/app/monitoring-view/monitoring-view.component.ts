import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { MonitoringService } from '../core/services/monitoring.service';
import { IMonitoringView } from '../core/models/monitoring.model';

@Component({
  selector: 'app-monitoring-view',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './monitoring-view.component.html',
  styleUrl: './monitoring-view.component.css'
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
  ;
  inputCost: any = 0;
  consumptionKwh: any = 0;
  startDate: string = '';
  endDate: string = '';
  startTime: string = '';
  endTime: string = '';
  selectedEnergy!: number;

  constructor(private monitoringService: MonitoringService) {
  }

  ngOnInit() {
    this.getAllMonitoringView();
    this.getLatestMonitoringView();
  }

  getAllMonitoringView() {
    this.monitoringService.getAllMonitoringView().snapshotChanges().subscribe({
      next: (data: any) => {
        this.monitoringViewList = data;
      },
      error: (err) => { },
      complete: () => { }
    });
  }

  getLatestMonitoringView(): void{
    this.monitoringService.getLatestMonitoringView().subscribe({
      next: (data: any) => {
        this.monitoringView = data;
      },
      error: (err) => { },
      complete: () => { }
    });
  }

  updateEnergy() {
    this.monitoringView.energy_kWh = this.selectedEnergy;
  }

  applyFilters() {
    if (!this.startDate || !this.endDate) {
      this.filteredMonitoringViewList = [...this.monitoringViewList]; // Reset if no filters are applied
      return;
    }

    const startDateTime = new Date(`${this.startDate}T${this.startTime || '00:00:00'}`);
    const endDateTime = new Date(`${this.endDate}T${this.endTime || '23:59:59'}`);

    this.filteredMonitoringViewList = this.monitoringViewList.filter((item) => {
      const [month, day, year] = item.current_date.split('/').map(Number); // Parse date as MM/DD/YYYY
      const [hours, minutes, seconds] = item.current_time.split(':').map(Number); // Parse military time
      const itemDateTime = new Date(year, month - 1, day, hours, minutes, seconds); // Create Date object

      return itemDateTime >= startDateTime && itemDateTime <= endDateTime;
    });
  }

  clearFilters() {
    this.startDate = '';
    this.endDate = '';
    this.startTime = '';
    this.endTime = '';
    this.filteredMonitoringViewList = []; // Reset filtered list
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

    // Format into the required format: DD/MM/YYYY HH:mm
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getVoltageClass(voltage: number): string {
    if (voltage === 220) {
      return 'green';
    } else if ((voltage >= 200 && voltage <= 219) || (voltage >= 221 && voltage <= 240)) {
      return 'yellow';
    } else if (voltage < 200 || voltage > 240) {
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

}
