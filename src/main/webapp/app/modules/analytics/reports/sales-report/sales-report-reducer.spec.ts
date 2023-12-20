import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import reducer, { fetchSalesReportRedux } from './sales-report.reducer';
import { EntityState } from 'app/shared/reducers/reducer.utils';
import {ISalesReport} from "app/shared/model/sales-report.model";

// Add the missing imports for the action types

describe('Entities reducer tests', () => {
  function isEmpty(element): boolean {
    if (element instanceof Array) {
      return element.length === 0;
    } else {
      return Object.keys(element).length === 0;
    }
  }

  const initialState: EntityState<ISalesReport> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: {},
    totalItems: 0,
    updating: false,
    updateSuccess: false,
  };

  function testInitialState(state) {
    expect(state).toMatchObject({
      loading: false,
      errorMessage: null,
      updating: false,
      updateSuccess: false,
    });
    expect(isEmpty(state.entities));
    expect(isEmpty(state.entity));
  }

  function testMultipleTypes(types, payload, testFunction, error?) {
    types.forEach((e) => {
      testFunction(reducer(undefined, { type: e, payload, error }));
    });
  }

  describe('Common', () => {
    it('should return the initial state', () => {
      testInitialState(reducer(undefined, { type: '' }));
    });
  });

  describe('Requests', () => {
    it('should set state to loading', () => {
      testMultipleTypes([fetchSalesReportRedux.pending.type], {}, (state) => {
        expect(state).toMatchObject({
          errorMessage: null,
          updateSuccess: false,
          loading: true,
        });
      });
    });
  });

  describe('Failures', () => {
    it('should set a message in errorMessage', () => {
      testMultipleTypes(
        [fetchSalesReportRedux.rejected.type],
        'some message',
        (state) => {
          expect(state).toMatchObject({
            errorMessage: 'some message',
            updateSuccess: false,
            updating: false,
          });
        },
        {
          message: 'error message',
        }
      );
    });
  });

  describe('Successes', () => {
    it('should fetch a single entity', () => {
      const payload = { data: { 1: 'fake1' } };
      expect(
        reducer(undefined, {
          type: fetchSalesReportRedux.fulfilled.type,
          payload,
        })
      ).toEqual({
        ...initialState,
        loading: false,
        entity: payload.data,
      });
    });
  });

  describe('Actions', () => {
    let store;

    const resolvedObject = { value: 'whatever' };
    beforeEach(() => {
      const mockStore = configureStore([thunk]);
      store = mockStore({});
      sinon.stub(axios, 'get').returns(Promise.resolve(resolvedObject));
      sinon.stub(axios, 'post').returns(Promise.resolve(resolvedObject));
      sinon.stub(axios, 'put').returns(Promise.resolve(resolvedObject));
      sinon.stub(axios, 'patch').returns(Promise.resolve(resolvedObject));
      sinon.stub(axios, 'delete').returns(Promise.resolve(resolvedObject));
    });
  });
});
