import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PrinterConnectionTypeEnum } from 'app/shared/model/terminal-settings';
import { changeTerminalField } from './branch-registry.reducer';
import { PrinterProperties } from './branch-registry-terminal-settings';

const mockDispatch = jest.fn();
let mockState;

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('./branch-registry.reducer', () => ({
  changeTerminalField: jest.fn(payload => ({ type: 'branch-registry/change-terminal-field', payload })),
  getEntities: jest.fn(() => ({ type: 'branch-registry/get-entities' })),
  updateEntity: jest.fn(entity => ({ type: 'branch-registry/update-entity', payload: entity })),
}));

const createState = (receiptOverrides = {}, receiptCopies?: number | null) => ({
  branchRegistry: {
    entity: {
      terminalSettings: {
        receiptCopies,
        printerSettings: {
          receipt: [
            {
              type: PrinterConnectionTypeEnum.USB,
              name: 'Receipt printer',
              ip: null,
              port: null,
              size: 'mm80',
              reverse: false,
              printByPdf: false,
              ...receiptOverrides,
            },
          ],
        },
      },
    },
  },
});

describe('PrinterProperties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = createState({}, 1);
  });

  it('shows network printer fields and hides the USB printer name', () => {
    mockState = createState(
      {
        type: PrinterConnectionTypeEnum.NETWORK,
        ip: '192.168.1.20',
        port: 9100,
      },
      1
    );

    render(<PrinterProperties />);

    expect(screen.getByText('Printer IP Address')).not.toBeNull();
    expect(screen.getByDisplayValue('192.168.1.20')).not.toBeNull();
    expect(screen.getByText('Printer Port')).not.toBeNull();
    expect(screen.queryByText('Printer Name')).toBeNull();
  });

  it('defaults copies to one and dispatches only positive integers', () => {
    mockState = createState({}, null);

    render(<PrinterProperties />);

    const copiesInput = screen.getByDisplayValue('1');
    expect(copiesInput).not.toBeNull();
    expect(copiesInput.getAttribute('min')).toBe('1');
    expect(copiesInput.getAttribute('step')).toBe('1');

    fireEvent.change(copiesInput, { target: { value: '-1' } });
    fireEvent.change(copiesInput, { target: { value: '1.5' } });
    expect(changeTerminalField).not.toHaveBeenCalledWith({ name: 'receiptCopies', value: -1 });
    expect(changeTerminalField).not.toHaveBeenCalledWith({ name: 'receiptCopies', value: 1.5 });

    fireEvent.change(copiesInput, { target: { value: '2' } });
    expect(changeTerminalField).toHaveBeenCalledWith({ name: 'receiptCopies', value: 2 });
  });
});
