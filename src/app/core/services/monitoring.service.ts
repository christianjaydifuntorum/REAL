import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/compat/database';
import { IMonitoringView } from '../models/monitoring.model';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private dbPath = "/PowerData";
  dataList!: AngularFireList<any>;
  lastKey: string | null = null;
  database: AngularFireList<any>;

  constructor(private db: AngularFireDatabase) {
    this.database = db.list(this.dbPath);
  }

  getFilteredMonitoringView(filterDate: string, startTime: string, endTime: string): Observable<any> {
    const data = this.database.query.ref.orderByChild('date')
    .equalTo(filterDate)  
    .startAt(startTime)  
    .endAt(endTime); 
    return of(data); 
  }


  getLatestMonitoringView(): Observable<any> {
    return this.db.list(this.dbPath, ref => ref.orderByChild('timestamp').limitToLast(1))
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => {
          const data = c.payload.val();
          return data && typeof data === 'object' ? { key: c.payload.key, ...data } : null;
        })[0])
      );
  }
}
