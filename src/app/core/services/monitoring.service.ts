import { inject, Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/compat/database';
import { IMonitoringView } from '../models/monitoring.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private dbPath = "/PowerData"
  dataList!: AngularFireList<any>;
  data!: any;

  constructor(private db: AngularFireDatabase) {
    this.dataList = this.db.list(this.dbPath);
    this.data = this.db.list(this.dbPath, ref => ref.orderByChild('timestamp').limitToLast(1))
    .snapshotChanges()
    .pipe(
      map(changes =>
        changes.map(c => {
          const data = c.payload.val();
          return data && typeof data === 'object' ? { key: c.payload.key, ...data } : null;
        })[0]
      )
    );
  }

  getAllMonitoringView() {
    return this.dataList;
  }

  getMonitoringView(key: string) {
    return this.db.object(`${this.dbPath}/${key}`);
  }

  getLatestMonitoringView(): Observable<any> {
    return this.data;
  }

  // createMonitoringView(monitoringView?: IMonitoringView) {
  //   const sampleMonitoringView: IMonitoringView = {
  //     active_power_W: 0,
  //     current_A: 0,
  //     frequency_Hz: 0,
  //     phase_angle_deg: 0,
  //     power_kW: 0,
  //     voltage_V: 0,
  //     date_time: null
  //   };

  //   this.monitorRef.push(sampleMonitoringView);
  // }

}
