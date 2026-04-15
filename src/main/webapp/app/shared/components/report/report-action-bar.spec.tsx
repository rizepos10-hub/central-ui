import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import ReportActionBar from './report-action-bar';

describe('ReportActionBar', () => {
  it('disables all actions when disabled is true', () => {
    render(<ReportActionBar onExcel={jest.fn()} onPdf={jest.fn()} onPrint={jest.fn()} disabled />);

    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-pdf').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-print').hasAttribute('disabled')).toBe(true);
  });

  it('calls the provided handlers', () => {
    const onExcel = jest.fn();
    const onPdf = jest.fn();
    const onPrint = jest.fn();

    render(<ReportActionBar onExcel={onExcel} onPdf={onPdf} onPrint={onPrint} />);

    fireEvent.click(screen.getByTestId('report-action-excel'));
    fireEvent.click(screen.getByTestId('report-action-pdf'));
    fireEvent.click(screen.getByTestId('report-action-print'));

    expect(onExcel).toHaveBeenCalledTimes(1);
    expect(onPdf).toHaveBeenCalledTimes(1);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });
});
