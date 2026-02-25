import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';

import { createBooking, updateBooking } from './delivery.reducer';

describe('Delivery reducer actions', () => {
  let store;

  beforeEach(() => {
    const mockStore = configureStore([thunk]);
    store = mockStore({});
    axios.get = sinon.stub().returns(Promise.resolve({ data: {} }));
    axios.post = sinon.stub().returns(Promise.resolve({ data: {} }));
    axios.put = sinon.stub().returns(Promise.resolve({ data: {} }));
  });

  it('sends provider and date in create booking query', async () => {
    await store.dispatch(
      createBooking({
        orderId: 'order-1',
        provider: 'TOOKAN',
        date: '2026-02-20T11:00:00.000Z',
      })
    );

    const requestUrl = (axios.post as any).firstCall.args[0] as string;
    expect(requestUrl).toContain('api/delivery/add-booking?');
    expect(requestUrl).toContain('orderId=order-1');
    expect(requestUrl).toContain('provider=TOOKAN');
    expect(requestUrl).toContain('date=');
    expect(requestUrl).not.toContain('pickupDate=');
    expect(requestUrl).not.toContain('deliveryDate=');
  });

  it('sends pickupDate and deliveryDate in update booking query', async () => {
    await store.dispatch(
      updateBooking({
        orderId: 'order-2',
        pickupDate: '2026-02-20T12:00:00.000Z',
        deliveryDate: '2026-02-20T13:00:00.000Z',
      })
    );

    const requestUrl = (axios.put as any).firstCall.args[0] as string;
    expect(requestUrl).toContain('api/delivery/update-booking/order-2?');
    expect(requestUrl).toContain('pickupDate=');
    expect(requestUrl).toContain('deliveryDate=');
  });
});
