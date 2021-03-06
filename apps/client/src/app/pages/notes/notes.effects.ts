import { FirestoreService } from './../../services/firestore.service';
import { switchMap, map } from 'rxjs/operators';
import 'rxjs/add/observable/fromPromise';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Action } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';

import * as actions from './notes.actions';
import * as fromNotes from './notes.reducer';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';

@Injectable()
export class NotesEffects {

    // Listen for the 'QUERY' action, must be the first effect you trigger

    @Effect() query$: Observable<Action> = this.actions$.ofType(actions.QUERY)
        .map((action: actions.Query) => action.name)
        .switchMap(action => {
            const ref = this.afs.col<fromNotes.Note>('notes', ref => ref.orderBy('createdAt').where('pending_removal', '==', false).where('type', '==', action).where('archived', '==', false))
            return ref.snapshotChanges().map(arr => {
                return arr.map(doc => {
                    const data = doc.payload.doc.data()
                    return { id: doc.payload.doc.id, ...data } as fromNotes.Note
                })
            })
        })
        .map(arr => {
            console.log(arr)
            return new actions.AddAll(arr)
        })

    // Listen for the 'CREATE' action

    @Effect() create$: Observable<Action> = this.actions$.ofType(actions.CREATE)
        .map((action: actions.Create) => action.notes)
        .switchMap(notes => {
            const ref = this.afs.doc<fromNotes.Note>(`notes/${notes.id}`)
            return Observable.fromPromise(this.afs.set(ref, notes))
        })
        .map(() => {
            return new actions.Success()
        })

    // Listen for the 'UPDATE' action

    @Effect() update$: Observable<Action> = this.actions$.ofType(actions.UPDATE)
        .map((action: actions.Update) => action)
        .switchMap(data => {
            const ref = this.afs.doc<fromNotes.Note>(`notes/${data.id}`)
            return Observable.fromPromise(this.afs.update(ref, data.changes))
        })
        .map(() => {
            return new actions.Success()
        })

    // Listen for the 'DELETE' action   

    @Effect() delete$: Observable<Action> = this.actions$.ofType(actions.DELETE)
        .map((action: actions.Delete) => action.id)
        .switchMap(id => {
            const ref = this.afs.doc<fromNotes.Note>(`notes/${id}`)
            return Observable.fromPromise(this.afs.remove(ref))
        })
        .map(() => {
            return new actions.Success()
        })

    constructor(private actions$: Actions, private afs: FirestoreService) { }
}