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
  data!: any;

  constructor(private db: AngularFireDatabase) {
    this.database = db.list(this.dbPath);
    this.data = this.db.list(this.dbPath, ref => ref.orderByChild('timestamp').limitToLast(1))
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => {
          const data = c.payload.val();
          return data && typeof data === 'object' ? { key: c.payload.key, ...data } : null;
        })[0])
      );
  }

  getFilteredMonitoringView(filterDate: string, startTime: string, endTime: string): Observable<any> {
    return new Observable(observer => {
      const formattedDate = this.convertToFirebaseDate(filterDate); // Convert to M/D/YYYY

      this.database.query.ref
        .orderByChild('current_date')
        .equalTo(formattedDate)
        .once('value', snapshot => {
          if (!snapshot.exists()) {
            observer.next([]); // No matching data
            observer.complete();
            return;
          }


          // Convert snapshot to array and filter by time range
          const filteredData = Object.values(snapshot.val()).filter((item: any) => {
            return this.isTimeInRange(item?.current_time, startTime, endTime);
          });

          observer.next(filteredData);
          observer.complete();
        }, error => observer.error(error));
    });
  }


  getLatestMonitoringView(): Observable<any> {
    return this.data;
  }

  // Convert "YYYY-MM-DD" to "M/D/YYYY" (Firebase format)
  // Convert "YYYY-MM-DD" to "M/D/YYYY" (Firebase format)
  private convertToFirebaseDate(dateStr: string): string {
    const dateObj = new Date(dateStr);
    return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
  }

  // Check if time is within range (ignores seconds)
  private isTimeInRange(dbTime: string | undefined, startTime: string, endTime: string): boolean {
    if (!dbTime) return false; // Skip if current_time is missing

    const [dbHours, dbMinutes] = dbTime.split(':').map(Number);
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const dbTotalMinutes = dbHours * 60 + dbMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return dbTotalMinutes >= startTotalMinutes && dbTotalMinutes <= endTotalMinutes;
  }



}
